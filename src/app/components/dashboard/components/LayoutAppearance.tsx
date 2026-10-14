/**
 * LayoutAppearance — the dashboard layout settings, as ONE component.
 *
 * ONE entry point: the board's ⋯ menu. It opens on "All dashboards", the broader and more
 * common intent. Pinning a single board away from the global is the deliberate second choice.
 *
 * ── Where the values go ─────────────────────────────────────────────────────────
 *   'all'  → store.layout, the global default every board inherits
 *   'this' → the open dashboard's own fields, which win over the global
 *
 * ── Preview now, commit on Apply ────────────────────────────────────────────────
 * Every control still moves the REAL board as you drag it — that's why the drawer
 * has no scrim. But nothing is kept until Apply. Cancel (and the X, Escape, or a
 * click outside) restores the snapshot taken when the drawer opened.
 *
 * Port: the scope switch is the product's pill-track.
 */
import { useEffect } from 'react';
import './LayoutAppearance.css';
import { Icon, Hint } from '../ui/primitives';
import { ChartSkeleton } from './ChartSkeleton';
import {
  store, byId, toast,
  LAYOUT_FIELD as FIELD, LAYOUT_KEYS as KEYS,
  layoutValue, setLayoutValue, resetLayoutValues, isLayoutDefault,
  commitLayoutEdit, cancelLayoutEdit,
} from '../store.js';
import { useDashStore } from '../reactivity.js';
import { useDashRoute } from '../nav.js';

const SIZES = [
  { id: 'S', label: 'Small', px: 12 },
  { id: 'M', label: 'Medium', px: 13 },
  { id: 'L', label: 'Large', px: 15 },
];
/* Each slider states what it does to the BOARD, not which property it sets. Widget padding
 * and Board margin were cut — they are fixed product values now (store.layout). */
const SLIDERS = [
  { key: 'hGap', label: 'Horizontal spacing', hint: 'Between widgets, side to side', min: 4, max: 32, step: 2 },
  { key: 'vGap', label: 'Vertical spacing', hint: 'Between rows of widgets', min: 4, max: 32, step: 2 },
  { key: 'rowHeight', label: 'Row height', hint: 'How tall one row of widgets is', min: 110, max: 260, step: 10 },
];
/* The preview tiles carry a chart SHAPE: a row-height change is a change to the plot area.
 * The pairing is deliberate — a split goes on the pie, categories on the bars, a period on the line. */
const PREVIEW_TILES = [
  { title: 'Open Requests', kind: 'line' },
  { title: 'By Priority', kind: 'donut' },
  { title: 'By Status', kind: 'hbar' },
  { title: 'Status by Priority', kind: 'stack' },
];

export function LayoutAppearance({ variant = 'drawer' }: any) {
  useDashStore();
  /* The board in context, read from the route so no entry point has to thread it down. */
  const route = useDashRoute();
  const dash = route.params.id ? byId(route.params.id) : null;
  const scope = dash ? store.ui.layoutScope : 'all';
  // leaving the board can't leave a board-scoped panel pointing at nothing
  useEffect(() => { if (!dash) store.ui.layoutScope = 'all'; }, [dash]);

  const val = (k: string) => layoutValue(dash, k);
  const setVal = (k: string, v: any) => setLayoutValue(dash, k, v);
  const atDefaults = isLayoutDefault(dash);

  function pickScope(next: string) {
    const d = dash;
    if (!d || next === scope) return;
    store.ui.layoutScope = next;
    // back to global — drop this board's overrides so it genuinely inherits again.
    if (next === 'all') (KEYS as string[]).forEach((k) => { delete d[(FIELD as any)[k]]; });
  }

  // how many boards a GLOBAL change actually moves — the ones that haven't overridden
  const inheriting = store.dashboards.filter((d: any) => !d.archived && (KEYS as string[]).every((k) => d[(FIELD as any)[k]] == null)).length;
  const titlePx = SIZES.find((s) => s.id === val('titleSize'))?.px || 13;
  /* Row height drives the PLOT, not the tile's min-height, and the tile follows from it. */
  const previewChartH = Math.round(val('rowHeight') * 0.85);
  // the slider works in stop indexes; the stored value stays 'S' | 'M' | 'L'
  const sizeIdx = Math.max(0, SIZES.findIndex((s) => s.id === val('titleSize')));
  /* The CTA names the scope it will act on. */
  const applyLabel = scope === 'all' ? 'Apply to all dashboards' : 'Apply to this dashboard';

  function apply() {
    commitLayoutEdit();
    toast(scope === 'all' ? `Layout applied to all dashboards — ${inheriting} updated` : `Layout applied to “${dash.name}”`);
    store.ui.layoutOpen = false;
  }
  function cancel() { cancelLayoutEdit(); store.ui.layoutOpen = false; }

  return (
    <div className={`dc-LayoutAppearance la ${variant}`}>
      {/* everything above the footer scrolls; the footer does not */}
      <div className="la-scroll">
        {/* SCOPE — heading, segmented control, one-liner. */}
        <div className="la-scope">
          <div className="sec-h">Apply to</div>
          <div className="pill-track la-seg" role="radiogroup" aria-label="Where these settings apply">
            {/* "All dashboards" leads and is the default — the broader, more common intent. */}
            <button aria-pressed={scope === 'all'} role="radio" aria-checked={scope === 'all'} onClick={() => pickScope('all')}>All dashboards</button>
            <button aria-pressed={scope === 'this'} disabled={!dash}
              title={dash ? '' : 'Open a dashboard to give it a layout of its own'}
              role="radio" aria-checked={scope === 'this'} onClick={() => pickScope('this')}>This dashboard only</button>
          </div>
          <p className="oneliner">
            <Icon name="info" size={14} />
            {scope === 'this' ? <span>Only <b>“{dash.name}”</b> changes. Every other board keeps the global layout.</span>
              : dash ? <span>Sets your global layout. Every board that follows it changes — <b>{inheriting}</b> of them.</span>
                : <span>Sets your global layout — <b>{inheriting}</b> boards follow it. Open a dashboard to give that one a layout of its own.</span>}
          </p>
        </div>

        <div className="la-body">
          {/* Two per row: the whole layout is one screenful. */}
          <div className="la-controls">
            {/* S/M/L is a scale — a track reads it correctly; the marks say what the stops are. */}
            <div className="la-fld">
              <label>Widget title size <Hint text="The size of every widget's title on the board" /></label>
              <div className="la-rng-row">
                <input className="la-rng" type="range" min="0" max="2" step="1"
                  value={sizeIdx} onChange={(e) => setVal('titleSize', SIZES[+e.target.value].id)} />
              </div>
              <div className="la-scale">{SIZES.map((s) => <span key={s.id}>{s.id}</span>)}</div>
            </div>
            {SLIDERS.map((s) => (
              <div key={s.key} className="la-fld">
                <label>{s.label} <Hint text={s.hint} /></label>
                <div className="la-rng-row">
                  <input className="la-rng" type="range" min={s.min} max={s.max} step={s.step}
                    value={val(s.key)} onChange={(e) => setVal(s.key, +e.target.value)} />
                  <span className="la-val box">{val(s.key)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* A live preview, sized from the real values — a MODEL of the board, not a screenshot. */}
          <div className="la-preview">
            <span className="la-pv-cap">Live preview</span>
            {/* margin and padding come straight from store.layout: they are no longer scoped settings */}
            <div className="la-pv-frame" style={{ padding: store.layout.boardMargin + 'px' }}>
              <div className="la-pv-grid" style={{ columnGap: val('hGap') + 'px', rowGap: val('vGap') + 'px' }}>
                {PREVIEW_TILES.map((t) => (
                  <div key={t.title} className="la-pv-tile">
                    <div className="la-pv-head" style={{ fontSize: titlePx + 'px' }}>{t.title}</div>
                    <div className="la-pv-body" style={{ padding: store.layout.cardPad + 'px' }}>
                      {/* ChartSkeleton takes no class/style, so the sizing box wraps it */}
                      <div className="la-pv-chart" style={{ height: previewChartH + 'px' }}><ChartSkeleton kind={t.kind} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER — Reset at the left edge, the commit pair at the right. Reset changes the
          draft rather than ending the session, so Cancel undoes a Reset too. */}
      <footer className="la-foot dlg-foot">
        <button className="la-ghost spread" disabled={atDefaults} title="Put every value back to its default" onClick={() => resetLayoutValues(dash)}>
          <Icon name="reset" size={14} /> Reset
        </button>
        <button className="btn" onClick={cancel}>Cancel</button>
        <button className="btn btn-primary" onClick={apply}>{applyLabel}</button>
      </footer>
    </div>
  );
}
