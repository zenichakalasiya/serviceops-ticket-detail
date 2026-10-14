/**
 * TourGuide — a guided, spotlight walkthrough of the revamped dashboard.
 *
 * A single fixed overlay dims the app and cuts a "spotlight" around each target
 * element (via a huge box-shadow), with a coach-mark card explaining it. Steps
 * target real elements by selector; a step may run a `before()` to put the app in
 * the right state first (open the listing, show the AI card…). Centered steps
 * (no selector) are the intro / outro.
 *
 * Driven by store.ui.tourOpen. Port: opened from the board's ⋯ menu ("Take a tour") —
 * the product header has no tour entry. Its Next/Done is the product's primary button.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './TourGuide.css';
import { Icon, DashPortal } from '../ui/primitives';
import { GroupWaysCarousel } from './GroupWaysCarousel';
import { store } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router } from '../nav.js';

// each step: { sel?, place?, title, body, before?() }  — no sel = centered card
const STEPS: any[] = [
  {
    center: true, title: 'Welcome to the revamped Dashboards',
    body: 'A quick tour of what’s new — the dashboards listing, the grounded AI layer, and the redesigned create & grouping flows.',
  },
  {
    sel: '.flyout', place: 'right', title: 'Your dashboards, on the left',
    body: 'The listing sidebar: a search, tabs for All / Created by me / Shared with me, and smart groups — Favourites, Recently used and by category.',
    before: () => { store.ui.activeModule = 'dashboard'; store.ui.listingOpen = true; store.ui.railExpanded = false; },
  },
  {
    sel: '.manage-link', place: 'right', title: 'The full listing',
    body: 'Beyond the sidebar, the complete “Manage all dashboards” grid — sortable and filterable, with bulk actions, a columns picker, and an Archive / restore tab.',
  },
  {
    sel: '.ai-chip', place: 'bottom', title: 'Grounded AI insights',
    body: 'The ✨ chip in the board header opens a plain-language read of this board plus three actions — insights, every widget explained, and add a widget. Every number is computed from the real data, so it works even with no AI model attached.',
    before: () => { store.ui.aiPlacement = 'A'; },
  },
  {
    sel: '.fab', place: 'left', title: 'Create, the new way',
    body: 'The + is your one place to build:',
    points: ['Create a dashboard from scratch', 'Add a widget to this board', 'Or just describe either — and let AI generate it for you'],
  },
  {
    center: true, anim: 'groupways', title: 'Four ways to group widgets',
    body: 'Tidy a busy board into named sections — here are all four ways to do it.',
  },
];
const PAD = 8;
const tick = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function TourGuide() {
  useDashStore();
  const active = store.ui.tourOpen;
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<any>(null); // target rect (viewport coords) or null = centered
  const [tip, setTip] = useState({ top: 0, left: 0 });
  const tipEl = useRef<HTMLDivElement>(null);
  const step = STEPS[i] || null;
  const isLast = i === STEPS.length - 1;
  const snapshot = useRef<any>(null); // app state restored when the tour ends
  const iRef = useRef(i); iRef.current = i;
  const rectRef = useRef(rect); rectRef.current = rect;

  async function ensureBoard() {
    if (!/^#\/dashboard\//.test(window.location.hash)) {
      const d = store.dashboards.find((x: any) => x.default && !x.archived) || store.dashboards.find((x: any) => !x.archived);
      if (d) router.push(`/dashboard/${d.id}`);
      await wait(550);
    }
  }

  async function place(idx: number) {
    const s = STEPS[idx];
    if (!s) return;
    if (s.before) { s.before(); await tick(); }
    if (s.center || !s.sel) { setRect(null); return; }
    // retry: some targets mount late (skeleton → board)
    let el: Element | null = null;
    for (let t = 0; t < 14 && !el; t++) { el = document.querySelector(s.sel); if (!el) await wait(90); }
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    await wait(70);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }

  function computeTip() {
    const s = STEPS[iRef.current]; if (!s) return;
    const vw = window.innerWidth, vh = window.innerHeight, gap = 14, m = 12;
    const te = tipEl.current;
    const tw = te ? te.offsetWidth : 320;
    const th = te ? te.offsetHeight : 168;
    const r = rectRef.current;
    if (!r) { setTip({ top: Math.round(vh / 2 - th / 2), left: Math.round(vw / 2 - tw / 2) }); return; }
    const fits: any = {
      bottom: r.top + r.height + gap + th <= vh - m,
      top: r.top - gap - th >= m,
      right: r.left + r.width + gap + tw <= vw - m,
      left: r.left - gap - tw >= m,
    };
    const want = s.place || 'bottom';
    const orders: any = {
      bottom: ['bottom', 'top', 'right', 'left'], top: ['top', 'bottom', 'right', 'left'],
      right: ['right', 'left', 'bottom', 'top'], left: ['left', 'right', 'top', 'bottom'],
    };
    const p = (orders[want] || orders.bottom).find((x: string) => fits[x]) || want;
    let top, left;
    if (p === 'bottom') { top = r.top + r.height + gap; left = r.left + r.width / 2 - tw / 2; }
    else if (p === 'top') { top = r.top - gap - th; left = r.left + r.width / 2 - tw / 2; }
    else if (p === 'right') { left = r.left + r.width + gap; top = r.top + r.height / 2 - th / 2; }
    else { left = r.left - gap - tw; top = r.top + r.height / 2 - th / 2; }
    setTip({ top: Math.round(Math.max(m, Math.min(top, vh - th - m))), left: Math.round(Math.max(m, Math.min(left, vw - tw - m))) });
  }
  // the card is measured after it renders with the new step / rect
  useLayoutEffect(() => { if (active) computeTip(); }, [active, i, rect]);

  const spotStyle: any = !rect ? { display: 'none' }
    : { top: (rect.top - PAD) + 'px', left: (rect.left - PAD) + 'px', width: (rect.width + PAD * 2) + 'px', height: (rect.height + PAD * 2) + 'px' };

  function finish() {
    store.ui.tourOpen = false;
    if (snapshot.current) { Object.assign(store.ui, snapshot.current); snapshot.current = null; }
  }
  function next() { if (iRef.current === STEPS.length - 1) return finish(); const n = iRef.current + 1; setI(n); place(n); }
  function back() { if (iRef.current === 0) return; const n = iRef.current - 1; setI(n); place(n); }

  const fns = useRef({ next, back, finish, place }); fns.current = { next, back, finish, place };
  useEffect(() => {
    if (!active) return;
    const reposition = () => { const s = STEPS[iRef.current]; if (s && !s.center) fns.current.place(iRef.current); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fns.current.finish();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') fns.current.next();
      else if (e.key === 'ArrowLeft') fns.current.back();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', reposition); window.removeEventListener('keydown', onKey); };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    snapshot.current = { listingOpen: store.ui.listingOpen, railExpanded: store.ui.railExpanded, aiPlacement: store.ui.aiPlacement, activeModule: store.ui.activeModule };
    (async () => { await ensureBoard(); await tick(); setI(0); place(0); })();
  }, [active]);

  if (!active || !step) return null;
  return (
    <DashPortal>
      <div className="dc-TourGuide">
        <div className="tour-root" role="dialog" aria-modal="true" aria-label="Product tour">
          {rect ? <div className="tour-spot" style={spotStyle} /> : <div className="tour-dim" />}

          <div ref={tipEl} className={`tour-tip ${!rect ? 'centered' : ''}`} style={{ top: tip.top + 'px', left: tip.left + 'px' }}>
            <div className="tt-head">
              <h3 className="tt-title">{step.title}</h3>
              <button className="tt-x" title="Skip tour" onClick={finish}><Icon name="x" size={16} /></button>
            </div>
            {step.anim === 'groupways' && <GroupWaysCarousel className="tt-anim" />}
            <p className="tt-body">{step.body}</p>
            {step.points && (
              <ul className="tt-points">
                {step.points.map((p: string, k: number) => <li key={k}><Icon name="check" size={13} /> <span>{p}</span></li>)}
              </ul>
            )}
            <div className="tt-foot">
              <span className="tt-num">{i + 1} / {STEPS.length}</span>
              <div className="tt-btns">
                {i > 0 && <button className="btn btn-sm" onClick={back}>Back</button>}
                <button className="btn btn-sm btn-primary" onClick={next}>{isLast ? 'Done' : 'Next'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashPortal>
  );
}
