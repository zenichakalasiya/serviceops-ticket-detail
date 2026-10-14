import { Fragment, useState } from 'react';
import './ListingFlyout.css';
import { Icon, ConfirmDialog, DashPortal } from '../ui/primitives';
import { store, live, recents, toggleFavorite, archiveDashboard, markDefault, recordView } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router, useDashRoute } from '../nav.js';

/* The words the product uses. The tooltip used to print the internal key — a row whose
   glyph you did not recognise answered "pre" when you hovered it. */
const KIND_LABEL: any = { pre: 'Predefined', mine: 'Created by me', shared: 'Shared with me' };

export function ListingFlyout({ onClose }: any) {
  useDashStore();
  const route = useDashRoute();
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(() => new Set(['Recently used', 'My Favourite']));
  const toggleGroup = (name: string) => { const s = new Set(open); s.has(name) ? s.delete(name) : s.add(name); setOpen(s); };

  let tabbed = live.value as any[];
  if (tab === 'mine') tabbed = tabbed.filter((d) => d.mine);
  if (tab === 'shared') tabbed = tabbed.filter((d) => d.sharedWithMe);
  // Predefined boards ship with the product — the one tab whose members you cannot create
  if (tab === 'predefined') tabbed = tabbed.filter((d) => d.predefined);
  const q = store.ui.listingQuery.trim().toLowerCase();
  if (q) tabbed = tabbed.filter((d) => d.name.toLowerCase().includes(q));

  /* The default dashboard is pinned on its own row under the search — the one board you can
   * always reach without opening a group. It follows the tab + search so the pin never lies. */
  const defaultDash = tabbed.find((d) => d.default) || null;

  // groups: My Favourite → Recently used → category-wise
  const groups: { name: string; items: any[] }[] = [];
  {
    const set = new Set(tabbed.map((d) => d.id));
    const inTab = (d: any) => set.has(d.id);
    const fav = tabbed.filter((d) => d.favorite);
    if (fav.length) groups.push({ name: 'My Favourite', items: fav });
    const rec = (recents.value as any[]).filter(inTab);
    if (rec.length) groups.push({ name: 'Recently used', items: rec });
    const cats: any = {};
    tabbed.forEach((d) => {
      // the default is BOTH pinned above and listed in its own category
      const c = d.category || 'Other'; (cats[c] ||= []).push(d);
    });
    Object.keys(cats).sort().forEach((c) => groups.push({ name: c, items: cats[c] }));
  }

  // identify a dashboard by icon: predefined · shared-with-me · created-by-me
  function dashKind(d: any) {
    // Predefined WINS, even over ownership — predefined means *locked*, and the icon has to say so.
    if (d.predefined) return 'pre';
    if (tab === 'mine') return 'mine';
    if (tab === 'shared') return 'shared';
    if (d.mine) return 'mine';
    if (d.sharedWithMe) return 'shared';
    return 'shared';
  }
  const dashIcon = (d: any) => (({ pre: 'predefined-monitor', shared: 'share', mine: 'user' }) as any)[dashKind(d)];
  const openBoard = (d: any) => { recordView(d); router.push(`/dashboard/${d.id}`); };
  const del = (d: any) => archiveDashboard(d);
  const openFull = () => { onClose?.(); router.push('/dashboards'); };
  const newDashboard = () => { store.ui.cloneTarget = null; store.ui.editTarget = null; store.ui.createOpen = true; };

  // ---- per-row actions menu (Edit · Clone · Mark as default · Archive) ----
  /* the ROW the menu belongs to (category + dashboard), not the dashboard. A board shows
     up under several categories, and keying by id alone lit every copy of it at once. */
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuBoardId, setMenuBoardId] = useState<string | null>(null);
  const rowKey = (grp: string, d: any) => grp + '::' + d.id;
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuDash = menuBoardId ? (live.value as any[]).find((d) => d.id === menuBoardId) : null;
  // archiving from the listing used to fire on a single click — confirm it by name
  const [delTarget, setDelTarget] = useState<any>(null);
  function openMenu(d: any, e: any, key: string) {
    const k = key || d.id;
    if (menuId === k) { setMenuId(null); setMenuBoardId(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    // open to the RIGHT of the ⋯ button (into the main area), clamped to the viewport
    setMenuPos({ top: r.bottom + 6, left: Math.min(r.right + 6, window.innerWidth - 210) });
    setMenuId(k);
    setMenuBoardId(d.id);
  }
  /* Capture the dashboard BEFORE closing the menu. */
  function menuAct(fn: (d: any) => void) {
    const d = menuDash;
    setMenuId(null); setMenuBoardId(null);
    if (d) fn(d);
  }
  const doEdit = (d: any) => { store.ui.cloneTarget = null; store.ui.editTarget = d; store.ui.createOpen = true; };
  const doClone = (d: any) => { store.ui.editTarget = null; store.ui.cloneTarget = d; store.ui.createOpen = true; };

  const row = (d: any, key: string, extraCls: string, lead: React.ReactNode, isDef: boolean) => (
    <div className={`item ${extraCls} ${route.params.id === d.id ? 'active' : ''} ${menuId === key ? 'menu-open' : ''}`}
      title={isDef ? 'Default dashboard — the one you land on' : undefined} onClick={() => openBoard(d)}>
      {lead}
      <span className="iname ellip">{d.name}</span>
      {!isDef && d.default && <span title="Default dashboard — the one you land on" style={{ display: 'inline-grid', flex: 'none' }}><Icon name="default-home" size={13} className="def-mark" /></span>}
      {/* favourite is the quick action upfront on hover, and stays lit once set */}
      <button className={`hb fav ${d.favorite ? 'show' : ''}`} title={d.favorite ? 'Remove from favourites' : 'Add to favourites'} onClick={(e) => { e.stopPropagation(); toggleFavorite(d); }}>
        <Icon name={d.favorite ? 'star-fill' : 'star'} size={14} />
      </button>
      <span className="hov">
        <button className="hb" title="Actions" onClick={(e) => { e.stopPropagation(); openMenu(d, e, key); }}><Icon name="dots-v" size={14} /></button>
      </span>
    </div>
  );

  return (
    <aside className="dc-ListingFlyout flyout">
      <div className="fhead">
        {/* collapse is driven from the main screen's toggle now, so only the title here */}
        <span className="ftitle">Dashboards</span>
        <button className="new-ic" title="New dashboard" onClick={newDashboard}><Icon name="plus" size={17} /></button>
      </div>

      {/* Search sits ABOVE the tabs because it searches across all of them. */}
      <div className="fsearch"><Icon name="search" size={15} className="muted" /><input value={store.ui.listingQuery} onChange={(e) => { store.ui.listingQuery = e.target.value; }} placeholder="Search dashboards…" /></div>

      {/* scrolls sideways: four tab labels do not fit 300px */}
      <div className="tabs2">
        <button className={`t2 ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>All</button>
        <button className={`t2 ${tab === 'mine' ? 'on' : ''}`} onClick={() => setTab('mine')}>Created by me</button>
        <button className={`t2 ${tab === 'shared' ? 'on' : ''}`} onClick={() => setTab('shared')}>Shared with me</button>
        <button className={`t2 ${tab === 'predefined' ? 'on' : ''}`} onClick={() => setTab('predefined')}>Predefined</button>
      </div>

      {/* default dashboard: pinned above the groups, home icon leading the name, ⋯ on hover */}
      {defaultDash && (
        <div className="def-row">
          {row(defaultDash, rowKey('__default', defaultDash), 'def', <Icon name="default-home" size={15} className="def-lead" />, true)}
        </div>
      )}

      <div className="glist">
        {groups.map((grp) => (
          <section key={grp.name} className="grp">
            <button className="grp-head" onClick={() => toggleGroup(grp.name)}>
              <Icon name={open.has(grp.name) ? 'chevron-down' : 'chevron-right'} size={16} />
              <span className="gname">{grp.name}</span>
              <span className="gcount">{grp.items.length}</span>
            </button>
            {open.has(grp.name) && (
              <div className="items">
                {grp.items.map((d) => (
                  <Fragment key={grp.name + d.id}>
                    {/* the kind is carried by the GLYPH and nothing else */}
                    {row(d, rowKey(grp.name, d), '', <span className="ibox" title={KIND_LABEL[dashKind(d)]}><Icon name={dashIcon(d)} size={16} /></span>, false)}
                  </Fragment>
                ))}
              </div>
            )}
          </section>
        ))}
        {!groups.length && <div className="none">No dashboards match.</div>}
      </div>

      {/* footer: the one link that isn't reachable from the rail */}
      <div className="ffoot">
        <button className="manage-link" onClick={openFull}><Icon name="rows" size={15} /> Manage all dashboards <Icon name="chevron-right" size={14} className="ml-arrow" /></button>
      </div>

      {/* per-row actions menu (teleported so it overlays instead of being clipped) */}
      {menuId && (
        <DashPortal>
          <div className="dc-ListingFlyout">
            <div className="row-backdrop" onClick={() => { setMenuId(null); setMenuBoardId(null); }} />
            {menuDash && (
              <div className="menu row-menu" style={{ top: menuPos.top + 'px', left: menuPos.left + 'px' }} onClick={(e) => e.stopPropagation()}>
                <button className="menu-item" onClick={() => menuAct(doEdit)}><Icon name="edit" size={15} /> Edit</button>
                <button className="menu-item" onClick={() => menuAct(doClone)}><Icon name="copy" size={15} /> Clone</button>
                {!menuDash.default && <button className="menu-item" onClick={() => menuAct((d) => markDefault(d))}><Icon name="default-home" size={15} /> Mark as default landing</button>}
                {/* a predefined dashboard cannot be archived or deleted — absent, not disabled */}
                {!menuDash.predefined && (
                  <>
                    <div className="menu-sep" />
                    <button className="menu-item danger" onClick={() => menuAct((d) => setDelTarget(d))}><Icon name="archive" size={15} /> Archive</button>
                  </>
                )}
              </div>
            )}
          </div>
        </DashPortal>
      )}

      {delTarget && (
        <ConfirmDialog
          title="Archive this dashboard?"
          target={delTarget.name}
          message="will move to the Archive tab with its widgets. Restore it from there, or delete it permanently."
          confirmLabel="Archive"
          onConfirm={() => { del(delTarget); setDelTarget(null); }}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </aside>
  );
}
