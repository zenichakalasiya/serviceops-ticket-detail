/**
 * AddWidgetModal — the "Add new widget" drawer: Create Widget (the chart-type picker) and
 * the three reuse tabs (Predefined · Created by me · Shared with me).
 *
 * Props: d (the dashboard), group (a group id new tiles are tagged with, or null).
 * Callbacks: onClose, onCreated(id), onNewgroup().
 *
 * Port note: the tab strip and the type pills are the product's `.pill-track`, the module
 * filter is `Dropdown`, and the delete confirm is the shared `ConfirmDialog` (product
 * buttons) — Zeni's rule that CTAs, fields and radios are the product's.
 */
import { useEffect, useState } from 'react';
import { Icon, Dropdown, ConfirmDialog } from '../ui/primitives';
import { ChartIcon } from './ChartIcon';
import { WidgetBuilderModal } from './WidgetBuilderModal';
import { store, addTilesToDashboard, removeLibTileForever, toast } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { uid } from '../data/mock.js';
import { groupPickerTypes } from '../data/chartTypes.js';
import './AddWidgetModal.css';

const TABS = [
  { v: 'chart', label: 'Create Widget' },
  { v: 'predefined', label: 'Predefined' },
  { v: 'user', label: 'Created by me' },
  { v: 'shared', label: 'Shared with me' },
];
const TYPE_FILTERS = [{ v: '', label: 'All' }, { v: 'chart', label: 'Widget' }, { v: 'kpi', label: 'KPI' }, { v: 'shortcut', label: 'Shortcut' }];

/* ---- Chart type tab -------------------------------------------------------------
 * Every chart card. Which GROUP each falls into, and in what order, comes from
 * PICKER_GROUPS in data/chartTypes.js — the builder's Chart Type row reads the same
 * list, so the two can never disagree about where a type belongs.
 *
 * Map Bubble is withdrawn. The renderer and its lazy India geo stay in the codebase so
 * any tile already built on it keeps drawing; it is simply no longer offered. */
const CHART_CARDS = [
  { id: 'line', label: 'Line', icon: 'chart-line', type: 'chart', kind: 'line' },
  { id: 'bar', label: 'Bar', icon: 'chart-bar', type: 'chart', kind: 'hbar' },
  { id: 'column', label: 'Column', icon: 'chart-bar', type: 'chart', kind: 'bar' },
  // Pie now builds a PIE. It used to build a doughnut, which meant the one kind you
  // could pick by name was the one you couldn't get.
  { id: 'pie', label: 'Pie', icon: 'chart-pie', type: 'chart', kind: 'pie' },
  { id: 'donut', label: 'Donut', icon: 'chart-donut', type: 'chart', kind: 'donut' },
  { id: 'stack', label: 'Stacked', icon: 'chart-stack', type: 'chart', kind: 'stack' },
  { id: 'grouped', label: 'Grouped', icon: 'chart-grouped', type: 'chart', kind: 'grouped' },
  { id: 'multiline', label: 'Multi-line', icon: 'chart-multiline', type: 'chart', kind: 'multiline' },
  { id: 'combo', label: 'Combo', icon: 'chart-combo', type: 'chart', kind: 'combo' },
  { id: 'gauge', label: 'Gauge', icon: 'chart-gauge', type: 'chart', kind: 'gauge' },
  { id: 'hist', label: 'Histogram', icon: 'chart-hist', type: 'chart', kind: 'hist' },
  { id: 'heatmap', label: 'Heatmap', icon: 'chart-heatmap', type: 'chart', kind: 'heatmap' },
  { id: 'funnel', label: 'Funnel', icon: 'chart-funnel', type: 'chart', kind: 'funnel' },
];

/* One section per tile FAMILY, as the design file lays the gallery out: every chart kind
   under Widget, then the families that are not charts, each on its own. This groups by
   what the tile IS, which is the axis the rest of the product already uses. */
const GROUPS: any[] = [
  ...(groupPickerTypes as any)(CHART_CARDS),
  { cat: 'Non-chart', types: [
    { id: 'kpi', label: 'KPI', icon: 'kpi', type: 'kpi', kind: null },
    { id: 'shortcut', label: 'Shortcut', icon: 'table', type: 'shortcut', kind: null },
    { id: 'text', label: 'Free Text', icon: 'chart-text', type: 'text', kind: null },
  ] },
];

// ---- Reuse tabs: listing with actions ----
const provMap: any = { predefined: 'predefined', user: 'user', shared: 'shared' };
const TYPE_LABEL: any = { kpi: 'KPI', chart: 'Widget', shortcut: 'Shortcut' };
/* There is NO hover tooltip on a row: the type is drawn as the row's artwork, and the
   provenance is the tab you are standing in. */
const TAB_LABEL: any = { predefined: 'Predefined', user: 'Created by me', shared: 'Shared with me' };

/* The row wears the artwork of the chart it actually draws. A KPI and a Shortcut have one
   glyph each; a chart has thirteen, and an item saved before `kind` existed falls back to
   Column rather than to nothing. */
function libIcon(l: any) {
  if (l.type === 'kpi') return 'kpi';
  if (l.type === 'shortcut') return 'shortcut';
  return l.kind || 'column';
}
function typeDesc(l: any) {
  if (l.type === 'kpi') return { id: 'kpi', label: 'KPI', type: 'kpi', kind: null };
  if (l.type === 'shortcut') return { id: 'shortcut', label: 'Shortcut', type: 'shortcut', kind: null };
  return { id: 'bar', label: 'Widget', type: 'chart', kind: 'bar' };
}
function uniqueName(base: string) {
  const names = new Set(store.library.map((l: any) => l.title.toLowerCase()));
  if (!names.has(base.toLowerCase())) return base;
  let n = 1;
  while (names.has(`${base} copy ${n}`.toLowerCase())) n++;
  return `${base} Copy ${n}`;
}

/* ---- per-ITEM action rules (same for Widget / KPI / Shortcut) ----
 * Predefined: Duplicate only · Created by me: Duplicate·Edit·Delete
 * Shared: Duplicate always, Edit only if the owner granted Edit access
 * These read the item's own provenance, never the active tab. */
const canDuplicate = (_l?: any) => true;
function canEdit(l: any) {
  if (l.prov === 'user') return true;
  if (l.prov === 'shared') return l.sharedAccess === 'edit' || l.sharedAccess === 'both';
  return false;   // predefined → no edit
}
const canDelete = (l: any) => l.prov === 'user';

export function AddWidgetModal({ d, group = null, onClose, onCreated, onNewgroup }: any) {
  useDashStore();
  const tagGroup = (id: any) => { if (group && id != null) { const t = d.tiles.find((x: any) => x.id === id); if (t) t.group = group; } };

  const [tab, setTab] = useState('chart');              // chart | predefined | user | shared
  /* There is no Archive. Delete is a REAL delete, behind a confirm — destructive, named and
     confirmed, the pattern the rest of the app already uses. */
  // The search box sits under the tab strip and only on the three reuse tabs. It filters the
  // ACTIVE tab only, same as the type pills and module dropdown beside it.
  const [fModule, setFModule] = useState('');
  const [fType, setFTypeS] = useState('');              // '' | kpi | chart | shortcut
  const [search, setSearch] = useState('');
  const [builder, setBuilder] = useState<any>(null);   // selected chart type → opens centered builder
  const [libBuilder, setLibBuilder] = useState<any>(null);
  const [delTarget, setDelTarget] = useState<any>(null);

  /* Clicking a tab while a search is open goes to that tab, which means clearing the search
     — otherwise you would land on a tab whose content the search is still overriding. A tab
     change also clears the module and type filters. */
  const goTab = (v: string) => { setSearch(''); setFModule(''); setFTypeS(''); setTab(v); };
  // Shortcut listing has no module filter
  const setFType = (v: string) => { setFTypeS(v); if (v === 'shortcut') setFModule(''); };

  /* The All tab is gone — each remaining tab is one provenance, and the per-item rules
   * still read `l.prov` rather than the tab. */
  const inTab = (l: any) => l.prov === provMap[tab] && !l.trashed;

  /* Search is scoped to the active tab — description and module match too, since you rarely
   * remember what a saved widget was called. */
  const q = search.trim().toLowerCase();
  const searching = q.length > 0;
  const hitText = (v: string) => !!v && v.toLowerCase().includes(q);
  const hitSearch = (l: any) => !searching || hitText(l.title) || hitText(l.desc) || hitText(l.module);

  /* Module counts must describe WHAT YOU WILL GET, so they are scoped to the tab, the type
   * filter and the search text you already have on. A module with nothing in the current tab
   * isn't offered at all. "All modules" carries no count: it is the absence of a filter. */
  let moduleBase = store.library.filter(inTab).filter(hitSearch);
  if (fType) moduleBase = moduleBase.filter((l: any) => l.type === fType);
  const moduleCount = (m: string) => moduleBase.filter((l: any) => l.module === m).length;
  const moduleOptions = [
    { value: '', label: 'All modules' },
    ...store.modules.filter((m: string) => moduleCount(m) > 0).map((m: string) => ({ value: m, label: `${m} (${moduleCount(m)})` })),
  ];
  // switching tab/type can retire the module you had picked — don't leave a dead filter on
  const moduleKey = moduleOptions.map((o) => o.value).join('|');
  useEffect(() => {
    if (fModule && !moduleOptions.some((o) => o.value === fModule)) setFModule('');
  }, [moduleKey, fModule]);

  let list = store.library.filter(inTab).filter(hitSearch);
  if (fType) list = list.filter((l: any) => l.type === fType);
  if (fModule) list = list.filter((l: any) => l.module === fModule);
  // per-type counts for the current tab (before the type filter is applied)
  const typeCounts: any = (() => {
    const inMod = (l: any) => !fModule || l.module === fModule;
    const base = store.library.filter((l: any) => inTab(l) && inMod(l)).filter(hitSearch);
    return { '': base.length, kpi: base.filter((l: any) => l.type === 'kpi').length, chart: base.filter((l: any) => l.type === 'chart').length, shortcut: base.filter((l: any) => l.type === 'shortcut').length };
  })();

  // ---- quick add: one click places the tile at the end of the board, drawer stays open ----
  // a library item already on this dashboard can't be added again
  const isPlaced = (l: any) => d.tiles.some((t: any) => t.title === l.title && t.type === l.type);
  function quickAdd(l: any) {
    if (isPlaced(l)) return;
    const before = d.tiles.length;
    addTilesToDashboard(d, [l]);
    if (group) for (let i = before; i < d.tiles.length; i++) d.tiles[i].group = group;
    toast(`Added “${l.title}” to the dashboard`, 'success');
  }

  // ---- Duplicate / Edit → open the builder (live preview); Update returns a copy to the listing ----
  const openLibBuilder = (l: any) => setLibBuilder({ type: typeDesc(l), item: l });
  function onLibrarySaved({ title, module, type, sharedAccess, desc, kind, place }: any) {
    const item = { id: uid('lt'), type, title: uniqueName(title), prov: provMap[tab] || 'user', module, favorite: false, sharedAccess: sharedAccess || 'view', desc, kind };
    store.library.unshift(item);     // shows at top of the current tab's listing
    setLibBuilder(null);
    if (place) {                     // "Clone & Add Widget" → place on canvas + redirect
      addTilesToDashboard(d, [item]);
      const newId = d.tiles[d.tiles.length - 1].id;
      tagGroup(newId);
      onCreated?.(newId);
      onClose?.();
    } else {
      toast(`Saved “${item.title}” — select it to add`, 'success');
    }
  }
  // "Create Widget" (no place) → save the new definition into User Defined
  function onSavedToLibrary({ title, module, type, sharedAccess, desc, kind }: any) {
    const item = { id: uid('lt'), type, title: uniqueName(title), prov: 'user', module, favorite: false, sharedAccess: sharedAccess || 'view', desc, kind };
    store.library.unshift(item);
    setBuilder(null);
    goTab('user');
    toast(`Saved “${item.title}” to User Defined`, 'success');
  }

  // ---- Delete removes the definition from the library, behind a confirm ----
  const confirmDel = () => { removeLibTileForever(delTarget); setDelTarget(null); };

  const plural = fType ? (fType === 'kpi' ? 'KPIs' : TYPE_LABEL[fType] + 's') : 'items';
  const emptyMsg = `No ${plural} in ${TAB_LABEL[tab] || 'this tab'} yet.`;
  const emptyHelp = tab === 'shared' ? 'Widgets, KPIs and Shortcuts shared with you will appear here.'
    : tab === 'user' ? 'Create one from the Create Widget tab, then it appears here.'
      : 'Predefined tiles curated by your admin will appear here.';

  const handleCreated = (id: any) => { tagGroup(id); onCreated?.(id); onClose?.(); };

  return (
    <div className="dc-AddWidgetModal drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="aw">
        <header className="dlg-head">
          <h3>Add new widget</h3>
          <div className="hd-a">
            <button className="dlg-x" onClick={() => onClose?.()}><Icon name="x" size={18} /></button>
          </div>
        </header>

        {/* top tabs. No All, no Archive. */}
        <div className="aw-tabs">
          <div className="pill-track">
            {TABS.map((t) => <button key={t.v} aria-pressed={tab === t.v} onClick={() => goTab(t.v)}>{t.label}</button>)}
          </div>
        </div>

        {/* Search sits under the tabs and only on the three reuse tabs — Create Widget is a
            fixed grid of chart types, nothing to search. */}
        {tab !== 'chart' && (
          <div className="aw-search">
            <div className="srch">
              <Icon name="search" size={15} className="muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search widgets, KPIs and Shortcuts…" />
              {searching && <button className="srch-x" title="Clear search" onClick={() => setSearch('')}><Icon name="x" size={14} /></button>}
            </div>
          </div>
        )}

        {/* Per-tab filters: type pills and module. */}
        {tab !== 'chart' && (
          <div className="type-tabs">
            <div className="pill-track" role="tablist">
              {TYPE_FILTERS.map((t) => (
                <button key={t.v} role="tab" aria-pressed={fType === t.v} aria-selected={fType === t.v} onClick={() => setFType(t.v)}>
                  {t.label} <span className="ttab-c">{typeCounts[t.v]}</span>
                </button>
              ))}
            </div>
            <span className="tt-sp" />
            {fType !== 'shortcut' && <div className="modsel"><Dropdown modelValue={fModule} options={moduleOptions} onUpdateModelValue={setFModule} placeholder="All modules" /></div>}
          </div>
        )}

        <div className="aw-body">
          {tab === 'chart' ? (
            <>
              {/* CHART TYPE: category card grid → opens centered builder. Illustrated icons:
                  at 64px a chart type is a picture of the chart. */}
              {GROUPS.map((g) => (
                <section key={g.cat} className="cat">
                  <div className="cat-h">{g.cat}</div>
                  <div className="cards">
                    {g.types.map((t: any) => (
                      <button key={t.id} className="tc" onClick={() => setBuilder(t)}>
                        <div className="tc-ico"><ChartIcon name={t.id} size={64} /></div>
                        <span className="tc-label">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              {/* Empty Group is the last option (charts come first) */}
              <section className="cat">
                <div className="cat-h">Empty group</div>
                <div className="cards">
                  <button className="tc tc-group" onClick={() => onNewgroup?.()}>
                    <div className="tc-ico"><ChartIcon name="group" size={64} /></div>
                    <span className="tc-label">Empty Group</span>
                  </button>
                </div>
              </section>
            </>
          ) : list.length ? (
            /* THE LISTING — the active tab, filtered by type pill / module / search. */
            <>
              {searching && <div className="res-h">{list.length} {list.length === 1 ? 'result' : 'results'} for “{search.trim()}”</div>}
              <div className="lst">
                {/* Each row is a static card. The actions live in `.lt-acts` and appear on
                    hover, Add first. A row already on the dashboard swaps that whole group
                    for a static "already added" mark. */}
                {list.map((l: any) => (
                  <div key={l.id} className={`lrow ${isPlaced(l) ? 'placed' : ''}`}>
                    <span className="lt-ico"><ChartIcon name={libIcon(l)} size={34} /></span>
                    <div className="lt-main">
                      <div className="lt-name-row">
                        <span className="lt-name ellip">{l.title}</span>
                        <span className="row-tag mod">{l.module}</span>
                      </div>
                      {/* Falls back to the type and module for an item saved without a description */}
                      <div className="lt-desc ellip">{l.desc || (TYPE_LABEL[l.type] + ' · ' + l.module)}</div>
                    </div>
                    <div className={`lt-acts ${isPlaced(l) ? 'always' : ''}`}>
                      {isPlaced(l) ? (
                        <span className="la-added" title="Already on this dashboard"><Icon name="check" size={14} /></span>
                      ) : (
                        <>
                          <button className="la la-add" title="Add to dashboard" onClick={() => quickAdd(l)}><Icon name="plus" size={15} /></button>
                          {canDuplicate(l) && <button className="la" title="Duplicate" onClick={() => openLibBuilder(l)}><Icon name="copy" size={15} /></button>}
                          {canEdit(l) && <button className="la" title="Edit" onClick={() => openLibBuilder(l)}><Icon name="edit" size={15} /></button>}
                          {canDelete(l) && <button className="la del" title="Delete" onClick={() => setDelTarget(l)}><Icon name="trash" size={15} /></button>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : searching ? (
            <div className="none"><Icon name="search" size={24} /><p className="none-t">Nothing matches “{search.trim()}” in {TAB_LABEL[tab]}.</p><span className="none-h">Try a shorter word, or clear the type / module filter.</span></div>
          ) : (
            <div className="none"><Icon name="inbox" size={24} /><p className="none-t">{emptyMsg}</p><span className="none-h">{emptyHelp}</span></div>
          )}
        </div>

        <footer className="dlg-foot">
          <span />
          <div className="fbtns"><button className="btn" onClick={() => onClose?.()}>Cancel</button></div>
        </footer>
      </div>

      {/* Centered builder — create from Chart type */}
      {builder && <WidgetBuilderModal d={d} type={builder} onClose={() => setBuilder(null)} onCreated={handleCreated} onSavedToLibrary={onSavedToLibrary} />}
      {/* Centered builder — duplicate/edit a library tile (Update returns a copy to the listing) */}
      {libBuilder && <WidgetBuilderModal d={d} type={libBuilder.type} libItem={libBuilder.item} onClose={() => setLibBuilder(null)} onLibrarySaved={onLibrarySaved} />}

      {/* Delete confirmation */}
      {delTarget && (
        <ConfirmDialog
          title={`Delete “${delTarget.title}”?`}
          message="This removes the definition from the library for everyone. Copies already placed on a dashboard keep working. This can’t be undone."
          confirmLabel="Delete"
          onConfirm={confirmDel}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
