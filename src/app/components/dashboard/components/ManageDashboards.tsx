/* Manage dashboards — the full listing. Port: the product's admin-listing controls — blue
 * "New Dashboard" CTA, pill-track tabs, the product checkbox, StatusToggle for Status. */
import { Fragment, useEffect, useState } from 'react';
import './ManageDashboards.css';
import { Icon } from '../ui/primitives';
import { StatusToggle } from '../../FormRuleControls';
import { ScheduleDialog } from './ScheduleDialog';
import { HistoryDialog } from './HistoryDialog';
import { TableFilterBar } from './TableFilterBar';
import { matchesConds } from '../data/filters.js';
import {
  store, manageable, archived, archiveDashboard, restoreDashboard, deleteForever, recordView,
  togglePublished, setPublished, moveDashboardsToCategory, archiveMany, toggleFavorite,
} from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router } from '../nav.js';
import { ACCESS } from '../data/mock.js';

const CAT = (d: any) => d.category || 'Uncategorized';
const FIELD_OF: any = {
  category: CAT,
  access: (d: any) => (ACCESS as any)[d.access]?.label || d.access,
  status: (d: any) => (d.enabled === false ? 'Unpublished' : 'Published'),
  owner: (d: any) => d.owner,
};
const SORT_OF: any = {
  name: (d: any) => d.name.toLowerCase(),
  category: CAT,
  tech: (d: any) => (d.techAccess || []).length,
  group: (d: any) => (d.groupAccess || []).length,
  description: (d: any) => (d.description || '').toLowerCase(),
  owner: (d: any) => (d.owner || '').toLowerCase(),
  status: (d: any) => (d.enabled === false ? 0 : 1),
  updated: (d: any) => new Date(d.updated).getTime(),
};
// ---- columns — the 2026-09-24 Figma's set and order ----
const COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'group', label: 'Technician Group Access' },
  { key: 'tech', label: 'Technician Access' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
];
const TABS = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Created by me' },
  { id: 'shared', label: 'Shared with me' },
  { id: 'archive', label: 'Archive' },
];
// the product's checkbox (the ticket listing's)
const CHK = 'h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] accent-[#3D8BD0] text-[#3D8BD0] focus:ring-0';

export function ManageDashboards({ initialTab }: any) {
  useDashStore();
  const [tab, setTabRaw] = useState(initialTab === 'archive' ? 'archive' : 'all'); // all | mine | shared | archive
  // "Open Archive" (the archive toast) lands here with ?tab=archive — also when Manage is already open
  useEffect(() => { if (initialTab === 'archive') setTabRaw('archive'); }, [initialTab]);
  const [q, setQ] = useState('');
  const isArchive = tab === 'archive';

  /* The same bar the Shortcut tables use. One field does two jobs: type to search, or click
   * to pick a field and build a `Field Operator Value` condition. Conditions are ANDed. */
  const [conds, setConds] = useState<any[]>([]);
  let base = (isArchive ? archived.value : manageable.value) as any[];
  if (tab === 'mine') base = base.filter((d) => d.mine);
  if (tab === 'shared') base = base.filter((d) => d.sharedWithMe);
  // options come from what's actually in the tab — never offer a filter that matches nothing
  const opts = (fn: any) => [...new Set(base.map(fn))].filter(Boolean).sort();
  const filterFields = [
    { key: 'category', label: 'Category', type: 'enum', options: opts(CAT) },
    { key: 'access', label: 'Visibility', type: 'enum', options: opts(FIELD_OF.access) },
    { key: 'status', label: 'Status', type: 'enum', options: opts(FIELD_OF.status) },
    { key: 'owner', label: 'Owner', type: 'enum', options: opts(FIELD_OF.owner) },
  ];

  // ---- column sorting ----
  const [sortKey, setSortKey] = useState(''); // '' = the store's own order (drag-to-reorder wins)
  const [sortDir, setSortDir] = useState('asc');
  function sortBy(k: string) {
    if (!SORT_OF[k]) return;
    if (sortKey === k) {
      // asc → desc → off, so the user can always get back to the manual order
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(k); setSortDir('asc'); }
  }
  const sortIcon = (k: string) => (sortKey !== k ? 'sort-asc' : sortDir === 'asc' ? 'sort-asc' : 'sort-desc');

  let rows = base.filter((d) => matchesConds((key: string) => FIELD_OF[key]?.(d), conds, filterFields));
  const s = q.trim().toLowerCase();
  if (s) rows = rows.filter((d) => d.name.toLowerCase().includes(s) || (d.owner || '').toLowerCase().includes(s));
  if (sortKey) {
    const fn = SORT_OF[sortKey], dir = sortDir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => { const x = fn(a), y = fn(b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
  }

  const [visibleCols] = useState(() => new Set(COLUMNS.map((c) => c.key)));
  const col = (k: string) => visibleCols.has(k);
  const shownCols = COLUMNS.filter((x) => col(x.key));

  // ---- bulk selection ----
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const toggleSel = (d: any) => { const n = new Set(sel); n.has(d.id) ? n.delete(d.id) : n.add(d.id); setSel(n); };
  const toggleAll = (e: any) => setSel(e.target.checked ? new Set(rows.map((d) => d.id)) : new Set());
  const allChecked = !!rows.length && rows.every((d) => sel.has(d.id));
  const selDashboards = () => rows.filter((d) => sel.has(d.id));
  const [bulkCatOpen, setBulkCatOpen] = useState(false);
  const bulkArchive = () => { archiveMany(selDashboards()); setSel(new Set()); };
  const bulkMove = (cat: string) => { moveDashboardsToCategory(selDashboards(), cat); setBulkCatOpen(false); setSel(new Set()); };
  /* One button, not two: "Disable all" while anything selected is still enabled, "Enable
   * all" once they're all off. The selection is KEPT so the label visibly flips. */
  const allSelDisabled = (() => { const x = selDashboards(); return x.length > 0 && x.every((d) => d.enabled === false); })();
  const bulkTogglePublished = () => setPublished(selDashboards(), allSelDisabled);

  // ---- tech-access pills expand ----
  const [openTech, setOpenTech] = useState<string | null>(null);
  const chips = (list: any[]) => { const a = list || []; return { first: a[0], rest: a.slice(1) }; };

  // ---- delete confirm ----
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const doDelete = (d: any) => { (isArchive ? deleteForever : archiveDashboard)(d); setConfirmId(null); };

  const open = (d: any) => { recordView(d); router.push(`/dashboard/${d.id}`); };
  const edit = (d: any) => { store.ui.cloneTarget = null; store.ui.editTarget = d; store.ui.createOpen = true; };
  const clone = (d: any) => { store.ui.editTarget = null; store.ui.cloneTarget = d; store.ui.createOpen = true; };
  /* The row itself opens the board. Anything the row already hands to a control keeps its
   * own job; without this guard, archiving a dashboard would also navigate to it. */
  function onRowClick(d: any, e: any) {
    if (e.target.closest('button, input, a, label, .tp, .drag')) return;
    open(d);
  }
  const [scheduleTarget, setScheduleTarget] = useState<any>(null);
  const [historyTarget, setHistoryTarget] = useState<any>(null);

  // drag-to-reorder
  const [dragId, setDragId] = useState<string | null>(null);
  function onDrop(target: any) {
    const arr = store.dashboards, from = arr.findIndex((x: any) => x.id === dragId), to = arr.findIndex((x: any) => x.id === target.id);
    if (from < 0 || to < 0 || from === to) return;
    const [m] = arr.splice(from, 1); arr.splice(to, 0, m); setDragId(null);
  }
  const setTab = (t: string) => { setTabRaw(t); setSel(new Set()); };

  return (
    <div className="dc-ManageDashboards page">
      <div className="page-head">
        <div className="ph-l">
          <button className="listing-toggle" title={store.ui.listingOpen ? 'Collapse dashboard listing' : 'Expand dashboard listing'} onClick={() => { store.ui.listingOpen = !store.ui.listingOpen; }}>
            <Icon name={store.ui.listingOpen ? 'panel-close' : 'panel-left'} size={14} />
          </button>
          <h1>Manage dashboards</h1>
        </div>
        {/* No layout entry here. Layout is reached from a board's ⋯ menu. */}
        <button className="btn btn-primary btn-sm" onClick={() => { store.ui.cloneTarget = null; store.ui.editTarget = null; store.ui.createOpen = true; }}>New Dashboard</button>
      </div>

      {/* the tabs FIRST (the product's pill-track), then the one search/filter field beneath them */}
      <div className="pill-track mtabs">
        {TABS.map((t) => <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="searchbar">
        <TableFilterBar modelValue={conds} onUpdateModelValue={setConds} search={q} onUpdateSearch={setQ} fields={filterFields} closable={false} />
      </div>

      {/* bulk action bar */}
      {sel.size > 0 && (
        <div className="bulkbar">
          <span className="bb-n">{sel.size} selected</span>
          <div className="grow" />
          <div className="cols-wrap">
            <button className="btn btn-sm" onClick={() => setBulkCatOpen(!bulkCatOpen)}><Icon name="folder" size={14} /> Move to category</button>
            {bulkCatOpen && <div className="cols-back" onClick={() => setBulkCatOpen(false)} />}
            {bulkCatOpen && (
              <div className="cols-pop right">
                {store.categories.map((c: string) => <button key={c} className="col-opt btn-like" onClick={() => bulkMove(c)}>{c}</button>)}
                <button className="col-opt btn-like" onClick={() => bulkMove('')}>Uncategorized</button>
              </div>
            )}
          </div>
          {/* one toggle: it names the action that applies, and flips once it's done */}
          {!isArchive && (
            <button className="btn btn-sm" title={allSelDisabled ? 'Make these visible in listings again' : 'Hide these from listings'} onClick={bulkTogglePublished}>
              <Icon name={allSelDisabled ? 'eye' : 'lock'} size={14} />
              {allSelDisabled ? 'Enable all' : 'Disable all'}
            </button>
          )}
          <button className="btn btn-sm danger" onClick={bulkArchive}><Icon name="archive" size={14} /> Archive</button>
          <button className="btn btn-sm" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      <div className="tbl-wrap">
        <table className="mtbl">
          <thead>
            <tr>
              <th className="c-chk"><input type="checkbox" className={CHK} checked={allChecked} onChange={toggleAll} /></th>
              {/* click a header to sort: asc → desc → off */}
              <th className={`c-nm srt ${sortKey === 'name' ? 'on' : ''}`} onClick={() => sortBy('name')}>
                <span className="th-in">Dashboard <Icon className={`sc ${sortKey === 'name' ? 'vis' : ''}`} name={sortIcon('name')} size={13} /></span>
              </th>
              {shownCols.map((c) => (
                <th key={c.key} className={`srt ${sortKey === c.key ? 'on' : ''}`} onClick={() => sortBy(c.key)}>
                  <span className="th-in">{c.label} <Icon className={`sc ${sortKey === c.key ? 'vis' : ''}`} name={sortIcon(c.key)} size={13} /></span>
                </th>
              ))}
              <th className="c-act">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className={`row-open ${d.enabled === false ? 'dim' : ''} ${sel.has(d.id) ? 'sel' : ''}`}
                draggable={!isArchive} onClick={(e) => onRowClick(d, e)}
                onDragStart={() => setDragId(d.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(d)}>
                <td className="c-chk"><input type="checkbox" className={CHK} checked={sel.has(d.id)} onChange={() => toggleSel(d)} /></td>
                <td className="nm">
                  {/* inner wrapper carries the flex; a <td> set to display:flex stops being a table-cell */}
                  <div className="nm-in">
                    {!isArchive && <Icon name="drag" size={15} className="drag" />}
                    <span className="nm-t ellip" onClick={() => open(d)}>{d.name}</span>
                    {/* favourite + default are independent → shown together when both apply */}
                    {!isArchive && <button className={`nm-ic fav ${d.favorite ? 'on' : ''}`} title={d.favorite ? 'Favourite' : 'Add to favourites'} onClick={(e) => { e.stopPropagation(); toggleFavorite(d); }}><Icon name={d.favorite ? 'star-fill' : 'star'} size={14} /></button>}
                    {d.default && <span className="nm-ic def" title="Default dashboard"><Icon name="default-home" size={15} /></span>}
                  </div>
                </td>
                {/* Cells render in COLUMNS order. A list shows its first entry and a "+N" that opens the rest. */}
                {shownCols.map((c) => {
                  if (c.key === 'category') return <td key={c.key}>{d.category || '—'}</td>;
                  if (c.key === 'group' || c.key === 'tech') {
                    const ch = chips(c.key === 'tech' ? d.techAccess : d.groupAccess);
                    return (
                      <td key={c.key} className="techcell">
                        {ch.first ? (
                          <>
                            <span>{ch.first}</span>
                            {ch.rest.length > 0 && <span className="tp more" onClick={(e) => { e.stopPropagation(); setOpenTech(openTech === d.id + c.key ? null : d.id + c.key); }}>+{ch.rest.length}</span>}
                            {openTech === d.id + c.key && <div className="tp-back" onClick={(e) => { e.stopPropagation(); setOpenTech(null); }} />}
                            {openTech === d.id + c.key && <div className="tp-pop">{ch.rest.map((t: string) => <span key={t} className="tp">{t}</span>)}</div>}
                          </>
                        ) : <span className="muted">—</span>}
                      </td>
                    );
                  }
                  if (c.key === 'status') return (
                    <td key={c.key}>
                      <StatusToggle on={d.enabled !== false} title={d.enabled !== false ? 'Published' : 'Unpublished'} onChange={() => togglePublished(d)} />
                    </td>
                  );
                  if (c.key === 'description') return <td key={c.key} className="desc ellip" title={d.description}>{d.description || '—'}</td>;
                  return <Fragment key={c.key} />;
                })}
                <td className="acts">
                  <div className="acts-in">
                    {isArchive ? (
                      <button className="ia" title="Restore" onClick={() => restoreDashboard(d)}><Icon name="restore" size={16} /></button>
                    ) : (
                      <>
                        {/* No "Open" action: the row is the open target. */}
                        <button className="ia" title="Duplicate" onClick={() => clone(d)}><Icon name="copy" size={16} /></button>
                        <button className="ia" title="Edit" onClick={() => edit(d)}><Icon name="edit" size={16} /></button>
                        <button className="ia" title="Schedule" onClick={() => setScheduleTarget(d)}><Icon name="calendar2" size={16} /></button>
                        <button className="ia" title="History" onClick={() => setHistoryTarget(d)}><Icon name="history" size={16} /></button>
                      </>
                    )}
                    <div className="del-wrap">
                      {/* A predefined board can't be deleted: an empty slot of the same width keeps the column aligned. */}
                      {d.predefined && !isArchive
                        ? <span className="ia-blank" title="Predefined dashboard — can’t be deleted" />
                        : <button className="ia del" title={isArchive ? 'Delete permanently' : 'Archive'} onClick={(e) => { e.stopPropagation(); setConfirmId(confirmId === d.id ? null : d.id); }}><Icon name={isArchive ? 'trash' : 'archive'} size={16} /></button>}
                      {confirmId === d.id && <div className="cfm-back" onClick={(e) => { e.stopPropagation(); setConfirmId(null); }} />}
                      {confirmId === d.id && (
                        <div className="cfm">
                          <span>{isArchive ? 'Delete permanently? This can’t be undone.' : 'Archive this dashboard?'}</span>
                          <button className="btn btn-sm danger" onClick={() => doDelete(d)}>Yes</button>
                          <button className="btn btn-sm" onClick={() => setConfirmId(null)}>No</button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty"><Icon name="layout" size={24} className="muted" /><p>{isArchive ? 'Nothing archived.' : 'No dashboards match.'}</p></div>}
      </div>

      {scheduleTarget && <ScheduleDialog d={scheduleTarget} onClose={() => setScheduleTarget(null)} />}
      {historyTarget && <HistoryDialog d={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}
