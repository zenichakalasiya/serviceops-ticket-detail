/**
 * SeriesManager — the legend, promoted into a real control surface.
 *
 * Lives inside the rank pill's popover (ChartTile legend modes ② and ⑥): pick the
 * slice of the ranking on top, see exactly the series that slice plots underneath.
 *
 * One verb only: click a row to disable it, and its data leaves the chart. Click
 * again to bring it back. The bulk row (All / None / Invert / Top 10) was cut —
 * the rank window above already does that job, and two ways to say "top 10" in
 * one panel is one way too many.
 *
 * Search collapses to an icon so the list gets the vertical space instead.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, DashPortal } from '../ui/primitives';
import './SeriesManager.css';

const CP_W = 172;
/* The theme tokens live on the board's `.dash-root` (not on :root, as in the prototype), so they are
   read from the nearest one — the theme the chart is actually painted in. */
const tokenHost = (el?: Element | null) => (el?.closest?.(".dash-root") || document.querySelector(".dash-root") || document.documentElement) as Element;
const cssVar = (n: string, f: string, el?: Element | null) => getComputedStyle(tokenHost(el)).getPropertyValue(n).trim() || f;
const sameColor = (a: any, b: any) => String(a).toLowerCase() === String(b).toLowerCase();

export function SeriesManager({
  entities,          // [{ key, name, value, color }]
  hidden,            // Set<key>
  total,             // pre-truncation denominator
  compact = false,
  // only the All tab lists the whole set, so only there is searching it meaningful
  searchable = true,
  onToggle, onReset, onRecolor,
}: any) {
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const rootEl = useRef<HTMLDivElement>(null);
  const [sortKey] = useState<'name' | 'value'>('value');   // 'name' | 'value'
  const [sortDir] = useState<'asc' | 'desc'>('desc');

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInput.current?.focus());
  }
  // closing clears the needle too — a collapsed icon must never filter the list silently
  function closeSearch() {
    setQ('');
    setSearchOpen(false);
  }
  // leaving All collapses the search — a stale needle must not silently filter the list
  useEffect(() => { if (!searchable) closeSearch(); }, [searchable]);

  const needle = q.trim().toLowerCase();
  const list = needle ? entities.filter((e: any) => e.name.toLowerCase().includes(needle)) : entities;
  const dir = sortDir === 'asc' ? 1 : -1;
  const rows = [...list].sort((a: any, b: any) =>
    sortKey === 'name' ? a.name.localeCompare(b.name) * dir : (a.value - b.value) * dir);

  const shownCount = entities.length - hidden.size;
  const pct = (v: number) => ((v / total) * 100).toFixed(1);

  /* ---- colour picker -----------------------------------------------------------
   * Two targets in one row, so each needs its own verb: the NAME toggles the series
   * (the row's job), the SWATCH recolours it. The swatch therefore stops propagation —
   * without that, picking a colour would also hide the series you just coloured.
   *
   * The palette offered is the chart's own --chart-1..10 stops, not a free spectrum:
   * those are the values picked to stay separable at a 9px legend swatch, so choosing
   * from them keeps a recoloured chart as readable as a default one. A native input is
   * kept as the escape hatch for anything outside the set.
   *
   * Teleported: the row sits inside .sm-list, which scrolls (overflow: auto), so a
   * popover anchored in-flow would be clipped by the list it belongs to. */
  const [pickFor, setPickFor] = useState<any>(null);          // entity key whose picker is open
  const [pickPos, setPickPos] = useState({ top: 0, left: 0 });
  const palette = [
    ...Array.from({ length: 10 }, (_, i) => cssVar('--chart-' + (i + 1), '#3d8bd0', rootEl.current)),
    cssVar('--chart-other', '#7d8ea3', rootEl.current),
  ];
  const colorOf = (key: any) => entities.find((e: any) => e.key === key)?.color || '#3d8bd0';

  function openPick(key: any, ev: React.MouseEvent) {
    if (pickFor === key) { setPickFor(null); return; }
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    setPickPos({
      top: Math.min(r.bottom + 8, window.innerHeight - 176),
      left: Math.max(8, Math.min(r.left - 10, window.innerWidth - CP_W - 8)),
    });
    setPickFor(key);
  }
  // a swatch closes the picker; the native input streams while dragging, so it doesn't
  function choose(color: string) { onRecolor?.({ key: pickFor, color }); setPickFor(null); }
  function setCustom(color: string) { onRecolor?.({ key: pickFor, color }); }
  // the list scrolls under an open picker, which would leave it pointing at nothing
  const rowsSig = rows.map((r: any) => r.key).join('\u0000');
  useEffect(() => { setPickFor(null); }, [rowsSig]);

  return (
    <div ref={rootEl} className={`sm dc-SeriesManager${compact ? ' compact' : ''}`}>
      <div className="sm-bar">
        {searchOpen && searchable ? (
          <div className="sm-search">
            <Icon name="search" size={13} className="mu" />
            <input ref={searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search series…"
              onKeyDown={(e) => { if (e.key === 'Escape') closeSearch(); }} />
            <button className="sx" title="Close search" onClick={closeSearch}><Icon name="x" size={13} /></button>
          </div>
        ) : searchable ? (
          <button className="si" title="Search series" onClick={openSearch}><Icon name="search" size={14} /></button>
        ) : null}
      </div>

      <div className="sm-list">
        {rows.map((e: any) => (
          <div
            key={e.key} className={`sm-row${hidden.has(e.key) ? ' off' : ''}`}
            title={`${e.name} — ${e.value} (${pct(e.value)}%) · ${hidden.has(e.key) ? 'show' : 'hide'}`}
            onClick={() => onToggle?.(e.key)}
          >
            {/* the swatch recolours, the row toggles — hence stopPropagation */}
            <button
              className={`sw${pickFor === e.key ? ' open' : ''}`} style={{ background: e.color }}
              title={`Change ${e.name}’s colour`} onClick={(ev) => { ev.stopPropagation(); openPick(e.key, ev); }}
            />
            <span className="nm"><span className="nm-k">{e.name}</span>: {pct(e.value)}%</span>
          </div>
        ))}
        {!rows.length && <div className="sm-empty">No series match “{q}”</div>}
      </div>

      <div className="sm-foot">
        <b>{shownCount}</b> / {entities.length} is shown
        {hidden.size > 0 && <button className="rst" onClick={() => onReset?.()}>Reset</button>}
      </div>

      {/* colour picker — teleported past .sm-list's scroll box */}
      {pickFor != null && (
        <DashPortal>
          <div className="dc-SeriesManager">
            <div className="cp-back" onClick={() => setPickFor(null)} />
            <div className="cp" style={{ top: pickPos.top + 'px', left: pickPos.left + 'px', width: CP_W + 'px' }} onClick={(e) => e.stopPropagation()}>
              <div className="cp-h">Series colour</div>
              <div className="cp-grid">
                {palette.map((c) => (
                  <button key={c} className={`cp-sw${sameColor(c, colorOf(pickFor)) ? ' on' : ''}`}
                    style={{ background: c }} onClick={() => choose(c)}
                  >{sameColor(c, colorOf(pickFor)) && <Icon name="check" size={11} />}</button>
                ))}
              </div>
              <label className="cp-custom">
                <span className="cp-cs" style={{ background: colorOf(pickFor) }} />
                <span className="cp-cl">Custom…</span>
                <input type="color" value={colorOf(pickFor)} onChange={(e) => setCustom(e.target.value)} />
              </label>
            </div>
          </div>
        </DashPortal>
      )}
    </div>
  );
}
