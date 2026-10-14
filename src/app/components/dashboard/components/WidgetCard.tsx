/* WidgetCard — the tile on the board: KPI / chart / table (Shortcut) / free text (note), the
 * standardized header (title · info · AI sparkle · date · refresh · ⋯), the ⋯ menu with its
 * flyouts, full screen, email/schedule/delete dialogs. Ported from WidgetCard.vue.
 *
 * Props: tile, edit, group (the group object this tile sits in, or null when it is out on the
 * canvas — it is what makes a group-level date filter inheritable).
 * Callbacks (Vue emits): onRemove(tile) · onEdit(tile) · onDuplicate(tile) · onArmdrag(tile) · onPin. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon, ConfirmDialog, DashPortal } from '../ui/primitives';
import { WidgetEmpty } from './WidgetEmpty';
import { ChartLoader } from './ChartLoader';
import { ChartTile } from './ChartTile';
import { DataTable } from './DataTable';
import { FreeTextTile } from './FreeTextTile';
import { EmailWidgetModal } from './EmailWidgetModal';
import { ScheduleDialog } from './ScheduleDialog';
import { TableFilterBar } from './TableFilterBar';
import { TimeRangePopover, rectOf } from './TimeRangePopover';
import { typesFor, isFrozen, frozenReason, whyDisabled } from '../data/chartTypes.js';
import { conditionFields, matchesConds } from '../data/filters.js';
import { windowFor, stampFor } from '../data/timeRanges.js';
import { rangeValue, rangeChart, rangeRows } from '../data/rangeData.js';
import { emptyStateFor } from '../data/emptyStates.js';
import { widgetBrief } from '../data/aiEngine.js';
import { store, toast } from '../store.js';
import { useDashStore } from '../reactivity.js';
import './WidgetCard.css';

// wide enough that "What needs attention" sits on ONE line beside "Deep dive"
const CARD_W = 384;
const TIP_W = 260;
const MENU_W = 190; // .tile-menu min-width
const SUB_W = 178;  // widest submenu (chart types)
const MENU_H = 260; // first-paint estimate; refined from the real rect below
const GAP = 6, EDGE = 8;
/* The Chart Morph loader demo (tile.loaderDemo): 10s = ONE FULL LOOP of the loader's five charts. */
const LOADER_MS = 10000;

// classify a table cell into a soft status/priority pill
function pillClass(v: any) {
  const s = String(v).toLowerCase().trim();
  if (['open', 'pending', 'to do', 'new', 'assigned'].includes(s)) return 'pill pill-blue';
  if (['in progress', 'active', 'running', 'on hold', 'watch'].includes(s)) return 'pill pill-amber';
  if (['resolved', 'closed', 'done', 'completed', 'compliant'].includes(s)) return 'pill pill-green';
  if (['expired', 'breached', 'overdue', 'failed', 'critical'].includes(s)) return 'pill pill-red';
  const m = s.match(/^p([1-4])$/);
  if (m) return 'pill pill-p' + m[1];
  return '';
}

const PROV: Record<string, { label: string }> = {
  predefined: { label: 'Predefined' },
  user: { label: 'User-defined' },
  shared: { label: 'Shared with me' },
};
/* Export has three destinations, the same three the dashboard offers. */
const EXPORTS = [
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'pdf', label: 'PDF', icon: 'file-text' },
];
// task 12: record IDs in a shortcut table are explorable → jump to their module record
const ID_MODULE: Record<string, string> = { INC: 'Requests', REC: 'Records', CNT: 'Contracts', PRB: 'Problems', CHG: 'Changes', AST: 'Assets' };
const isId = (v: any) => /^[A-Z]{2,4}-\d/.test(String(v).trim());
function exploreId(id: any) { const m = ID_MODULE[String(id).split('-')[0]] || 'its module'; toast(`Opening ${id} in ${m}`); }
const asList = (v: any) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

export function WidgetCard({ tile, edit = false, group = null, onRemove, onEdit, onDuplicate, onArmdrag, onPin }: any) {
  useDashStore();

  /* ── Per-widget AI: HOVER the sparkle → a mini AI summary card of this widget with two
   * type-specific suggestive actions; clicking one opens the ServiceOps AI panel (store.ui.aiAsk). */
  const aiBtn = useRef<HTMLButtonElement>(null);
  const [aiHover, setAiHover] = useState(false);
  const [aiPos, setAiPos] = useState({ top: 0, left: 0, flip: false });
  const brief: any = widgetBrief(tile);
  const aiTimer = useRef<any>(null);
  function openAiHover() {
    clearTimeout(aiTimer.current);
    const r = aiBtn.current?.getBoundingClientRect(); if (!r) return;
    const left = Math.max(8, Math.min(r.right - CARD_W, window.innerWidth - CARD_W - 8));
    const flip = r.bottom + 150 > window.innerHeight; // not enough room below → open upward
    setAiPos({ top: flip ? r.top - 8 : r.bottom + 8, left, flip });
    setAiHover(true);
  }
  function closeAiHoverSoon() { clearTimeout(aiTimer.current); aiTimer.current = setTimeout(() => setAiHover(false), 160); }
  function keepAiHover() { clearTimeout(aiTimer.current); }
  function runWidgetAction(a: any) { store.ui.aiAsk = { intent: a.intent, text: a.text }; setAiHover(false); }
  /* THE TWO CTAs — identical to the board's pair, scoped to this tile. The title is carried in
   * the text because the panel resolves scope from an explicit title match. A Free Text tile
   * has no data behind it, so it gets neither. */
  const WIDGET_CTAS = (() => {
    if (tile?.type === 'text') return [];
    const title = tile?.title || 'this widget';
    return [
      { label: 'Deep dive', intent: 'deepdive', icon: 'insights', text: `Deep dive into ${title}` },
      { label: 'What needs attention', intent: 'focus', icon: 'auto-graph', text: `What needs attention in ${title}` },
    ];
  })();
  // When the tile is too small for the header sparkle, the same two ride inside the ⋯ menu.
  function askWidgetAi(cta: any) { setMenu(false); store.ui.aiAsk = { intent: cta.intent, text: cta.text }; }

  /* ── Which clock this widget is on ─────────────────────────────────────────────
   *   1. the widget's own `dateFilter`  2. its GROUP's `dateFilter`  3. the dashboard's global filter
   * A Free Text tile is a NOTE: no data, no time range, no refresh, nothing to summarise. */
  const isNote = tile.type === 'text';
  const groupRange = group?.dateFilter || null;
  const ownRange = tile.dateFilter || null;
  const effRange = ownRange || groupRange; // null = the dashboard's global filter
  const dfSource = ownRange ? 'own' : groupRange ? 'group' : 'none';
  // shown only on a widget whose OWN configuration sets a date filter. Never on a note.
  const showDf = !isNote && !!ownRange;

  /* What the widget SHOWS for its group's range. Only an inherited group range re-reads the data. */
  const dataRange = dfSource === 'group' ? groupRange : null;
  const viewValue = rangeValue(tile.value, dataRange, tile.title, tile.unit);
  const viewChart = rangeChart(tile.chart, dataRange);
  const viewRows: any[] = rangeRows(tile.rows || [], dataRange);

  const dfChipEl = useRef<HTMLButtonElement>(null);
  const [dfOpen, setDfOpen] = useState(false);
  const [dfRect, setDfRect] = useState<any>(null);

  /* The icon stays a plain square and says nothing at rest. Hovering it opens an INSTANT
   * tooltip carrying the range, the window it resolves to, and where it came from. */
  const [dfTipOpen, setDfTipOpen] = useState(false);
  const [dfTipPos, setDfTipPos] = useState({ top: 0, left: 0 });
  const dfTip = (() => {
    if (!effRange) return { name: 'No time range set', stamps: '', from: 'Click to put this widget on its own range' };
    const { start, end } = (windowFor as any)(effRange);
    return {
      name: effRange,
      stamps: `${stampFor(start)} → ${stampFor(end)}`,
      from: dfSource === 'group' ? `Inherited from the “${group.name}” group` : 'This widget’s own range',
    };
  })();
  function showDfTip() {
    const r = dfChipEl.current?.getBoundingClientRect(); if (!r) return;
    setDfTipPos({ top: r.bottom + 7, left: Math.max(8, Math.min(r.left + r.width / 2 - TIP_W / 2, window.innerWidth - TIP_W - 8)) });
    setDfTipOpen(true);
  }
  // what the popover's escape row returns to
  const dfFollowLabel = !ownRange ? null : groupRange ? `Follow the “${group.name}” group filter` : 'Follow dashboard filter';
  const dfNote = dfSource === 'group' && !ownRange
    ? `This widget currently follows the “${group.name}” group filter. Picking a range here puts this widget on its own clock.`
    : '';
  function toggleDf() {
    if (dfOpen) { setDfOpen(false); return; }
    if (!dfChipEl.current) return;
    setDfRect(rectOf(dfChipEl.current));
    setDfOpen(true);
  }
  function pickDf(range: string) { tile.dateFilter = range; setDfOpen(false); toast(`“${tile.title}” → ${range}`); }
  function clearDf() {
    tile.dateFilter = null;
    setDfOpen(false);
    toast(groupRange ? `“${tile.title}” follows the “${group.name}” group filter` : `“${tile.title}” follows the dashboard filter`);
  }

  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuEl = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  /* Submenus fly out away from the nearer screen edge, so they can't run off it. */
  const [subLeft, setSubLeft] = useState(true);
  const cardEl = useRef<HTMLDivElement>(null);
  const bodyEl = useRef<HTMLDivElement>(null);

  /* The menu opens clear of the WIDGET, off the card's right edge — not just off the button, or it
   * still clips the corner of the chart it is acting on. Too close to the right of the screen → it
   * flips to the LEFT of the ⋯ button instead. */
  function placeMenu() {
    const r = menuBtn.current?.getBoundingClientRect();
    if (!r) return;
    const card = cardEl.current?.getBoundingClientRect();
    const m = menuEl.current?.getBoundingClientRect();
    const w = m?.width || MENU_W;
    const h = m?.height || MENU_H;
    const rightAnchor = (card?.right ?? r.right) + GAP;
    const fitsRight = rightAnchor + w + EDGE <= window.innerWidth;
    const left = fitsRight ? rightAnchor : Math.max(EDGE, r.left - GAP - w);
    // top-align with the button, but never let a long menu run off the bottom
    const top = Math.max(EDGE, Math.min(r.top, window.innerHeight - h - EDGE));
    setMenuPos({ top, left });
    setSubLeft(window.innerWidth - (left + w) < SUB_W + GAP);
  }
  const [exportOpen, setExportOpen] = useState(false);
  const [aiSubOpen, setAiSubOpen] = useState(false); // the ⋯ menu's "AI Insights" flyout
  const [typeOpen, setTypeOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false); // the Move-to-group SUBMENU (hover)
  function closeMenu() { setMenu(false); setExportOpen(false); setTypeOpen(false); setMoveOpen(false); }
  function toggleMenu() {
    if (menu) { setMenu(false); setExportOpen(false); setTypeOpen(false); return; }
    setMenu(true);
    placeMenu(); // estimate, so it never paints at 0,0 — corrected against the rendered size below
  }
  useLayoutEffect(() => { if (menu) placeMenu(); }, [menu]);

  /* Legend visibility is a property of the WIDGET, set in its configuration. Undefined means on. */
  const showLegend = tile.legend !== false;

  /* Switch the chart type in place, from the tile. A predefined pie is frozen, so the submenu is
   * disabled rather than empty. The dashboard's snapshot watcher picks it up, so Ctrl+Z reverts. */
  const chartTypes: any[] = typesFor(tile);
  const typeFrozen = isFrozen(tile);
  const typeFrozenWhy = frozenReason(tile);
  const disabledFor = (ct: any) => whyDisabled(ct, tile.chart);
  function setKind(ct: any) {
    if (disabledFor(ct)) return;
    if (tile.chart.kind === ct.id) { setMenu(false); return; }
    tile.chart.kind = ct.id;
    /* `chart.donut` overrides the kind when present, so switching inside the part-of-whole family
     * has to move it too, or the two halves of the same fact disagree. */
    if (ct.id === 'pie' || ct.id === 'donut') tile.chart.donut = ct.id === 'donut';
    setMenu(false); setTypeOpen(false);
    toast(`“${tile.title}” → ${ct.label}`);
  }

  const [tableSearch, setTableSearch] = useState('');
  /* The Shortcut filter bar (TableFilterBar): conditions are ANDed; an unfinished chip filters nothing. */
  const [tableConds, setTableConds] = useState<any[]>([]);
  const filterFields = conditionFields(tile.columns || [], viewRows);
  // Rows are filtered HERE rather than inside DataTable: one matcher owns condition semantics
  // for both the tile and the full-screen view.
  function matchedRows(rows: any[]) {
    if (!tableConds.length) return rows;
    return rows.filter((r) => matchesConds((key: any) => r[+key], tableConds, filterFields));
  }
  const filteredRows = matchedRows(viewRows);
  const hasTableFilters = tableConds.length > 0;

  /* The Shortcut footer's line: "5 out of 100 records are shown". The total is `tile.total`, the
   * count the query matched, falling back to rows.length. Never below the rows actually held. */
  const footTotal = tile.total != null ? Math.max(viewRows.length, rangeValue(tile.total, dataRange, 'total') as any) : viewRows.length;
  const footShown = (() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return filteredRows.length;
    return filteredRows.filter((r) => r.some((c: any) => String(c ?? '').toLowerCase().includes(q))).length;
  })();
  const footText = (() => {
    if (!footTotal) return 'No records to show';
    const noun = footTotal === 1 ? 'record' : 'records';
    const verb = footShown === 1 ? 'is' : 'are';
    return `${footShown} out of ${footTotal} ${noun} ${verb} shown`;
  })();

  const [present, setPresent] = useState(false);
  /* Who a restricted widget reaches. */
  const techList = asList(tile.techAccess);
  const groupList = asList(tile.groupAccess);
  const audienceCount = techList.length + groupList.length;

  const [infoHover, setInfoHover] = useState(false);
  const infoEl = useRef<HTMLSpanElement>(null);
  const [infoPos, setInfoPos] = useState({ top: 0, left: 0 });
  function showInfo() {
    const r = infoEl.current?.getBoundingClientRect();
    if (r) setInfoPos({ top: r.bottom + 7, left: Math.min(r.left - 6, window.innerWidth - 256) });
    setInfoHover(true);
  }

  // Measure the real rendered width so actions collapse as the tile is resized smaller.
  const [cardW, setCardW] = useState(9999);
  // The chart is given the body's real height so it tracks the widget size.
  const [chartH, setChartH] = useState(tile.h > 2 ? 340 : tile.h > 1 ? 168 : 120);
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target === cardEl.current) setCardW(e.contentRect.width);
        else if (e.target === bodyEl.current) { const h = Math.round(e.contentRect.height); if (h > 0) setChartH(h); }
      }
    });
    if (cardEl.current) ro.observe(cardEl.current);
    if (bodyEl.current) ro.observe(bodyEl.current);
    return () => ro.disconnect();
  }, []);
  // Below this width the two upfront controls (AI + Refresh) also fold into ⋯.
  const tiny = cardW < 258;

  const [demoLoading, setDemoLoading] = useState(false);
  const demoT = useRef<any>(null);
  function playLoader() {
    clearTimeout(demoT.current);
    setDemoLoading(true);
    demoT.current = setTimeout(() => setDemoLoading(false), LOADER_MS);
  }
  function refresh() {
    if (tile.loaderDemo) { playLoader(); return; }
    setLoading(true); setTimeout(() => setLoading(false), 750);
  }
  useEffect(() => {
    if (tile.loaderDemo) playLoader();
    return () => clearTimeout(demoT.current);
  }, []);

  // provenance: predefined tiles can't be deleted (only "other" actions)
  const prov = tile.prov || 'user';
  const provMeta = PROV[prov] || PROV.user;
  const canEdit = true;
  /* Deletability follows WHO PUT THE TILE HERE: only a `seeded` tile is undeletable. */
  const canDelete = !tile.seeded;

  // Empty-widget states: unconfigured vs error vs no-data vs ok
  const tileState = (() => {
    if (tile.state === 'error') return 'error';
    if (tile.state === 'unconfigured') return 'unconfigured';
    if (tile.type === 'kpi') return tile.value == null || tile.value === '' ? 'nodata' : 'ok';
    /* A note is never "no data in this range" — it has no range and no query. */
    if (tile.type === 'text') return 'ok';
    if (tile.type === 'chart') {
      // the additional PMG-ACT-01 kinds carry a chartSpec and compute their own data
      if (tile.chart?.spec) return 'ok';
      const s = tile.chart?.series || [];
      const total = s.flatMap((x: any) => x.values || []).reduce((a: number, b: number) => a + b, 0);
      return !s.length || total === 0 ? 'nodata' : 'ok';
    }
    return (tile.rows || []).length ? 'ok' : 'nodata';
  })();
  const emptyState = emptyStateFor(tile, tileState);
  function retry() { setLoading(true); setTimeout(() => { tile.state = undefined; setLoading(false); }, 800); }

  function exportAs(f: any) { setMenu(false); setExportOpen(false); toast(`Exporting “${tile.title}” as ${f.id === 'pdf' ? 'PDF' : 'an image'}`); }
  function duplicate() { setMenu(false); onDuplicate?.(tile); }
  // deleting a widget is destructive and one click away — confirm it by name
  const [confirmDel, setConfirmDel] = useState(false);

  /* ── Move to another group — only offered when there IS somewhere else to go. */
  const board = store.dashboards.find((d: any) => (d.tiles || []).includes(tile));
  const moveGroups = (() => {
    const d = board;
    if (!d?.groups?.length) return [];
    return d.groups.map((g: any) => ({ id: g.id, name: g.name, n: d.tiles.filter((t: any) => t.group === g.id).length }));
  })();
  const canMove = moveGroups.some((g: any) => g.id !== tile.group);
  function moveTo(g: any) {
    if (g.id === tile.group) return;
    tile.group = g.id;
    if (board) board.updated = new Date().toISOString();
    setMoveOpen(false); setMenu(false);
    toast(`Moved “${tile.title || 'widget'}” to ${g.name}`, 'success');
  }
  const [emailOpen, setEmailOpen] = useState(false);       // Export ▸ Email as PDF
  const [scheduleOpen, setScheduleOpen] = useState(false); // recurring delivery of this one widget
  // a disabled schedule delivers nothing, so it does not light the badge
  const activeSchedules = (tile.schedules || []).filter((s: any) => s.enabled);
  const schTitle = (() => {
    const n = activeSchedules.length;
    return `${n} active schedule${n > 1 ? 's' : ''} — ${activeSchedules.map((s: any) => s.type).join(', ')}\nClick to manage`;
  })();

  const cell = ({ value }: any) =>
    pillClass(value) ? <span className={pillClass(value)}>{value}</span>
      : isId(value) ? <button className="id-link" onClick={(e) => { e.stopPropagation(); exploreId(value); }}>{value}</button>
        : value;

  const aiCard = (onAct: (a: any) => void) => (
    <>
      {/* no widget name here: you're hovering that widget, so repeating it is noise */}
      <div className="wai-h"><span className="wai-spark"><Icon name="sparkles" size={16} /></span> AI insights</div>
      <p className="wai-sum">{brief.summary}</p>
      {WIDGET_CTAS.length > 0 && (
        <div className="wai-acts ai-ctas-fill">
          {WIDGET_CTAS.map((a) => (
            <button key={a.label} className={`ai-cta ${a.intent === 'deepdive' ? 'primary' : ''}`} onClick={() => onAct(a)}>
              <Icon name={a.icon} size={13} /><span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  const cardCls = [
    'dc-WidgetCard tile card', `span-${tile.w || 3}`, `rows-${tile.h || 1}`,
    menu || dfOpen || aiHover ? 'acting' : '', isNote ? 'note' : '', isNote && tile.ft?.bg === 'Transparent' ? 'clear' : '',
  ].filter(Boolean).join(' ');

  return (
    /* `acting` holds the cluster open while a popover this header owns is up: the menu and the
       date popover are portalled, so moving the pointer into them drops :hover. */
    <div ref={cardEl} className={cardCls}>
      {/* Standardized header — the HEADER is the drag handle on every widget: pressing anywhere
          in it that isn't a control arms the drag. A note's header is its transparent top lane. */}
      <header
        className={`thead ${isNote ? 'note-lane' : ''}`}
        onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('button, input, a, .info, .sch-mark')) onArmdrag?.(tile); }}
      >
        <div className="left">
          {tile.pinned && <span className="pinbadge" title="Pinned"><Icon name="pin" size={12} /></span>}
          <span className="title ellip">{tile.title}</span>
          <span ref={infoEl} className="info" onMouseEnter={showInfo} onMouseLeave={() => setInfoHover(false)}>
            <Icon name="info" size={14} />
          </span>
          {/* a scheduled widget says so at rest, the same way an overridden date does */}
          {activeSchedules.length > 0 && (
            <button className="sch-mark" title={schTitle} onClick={(e) => { e.stopPropagation(); setScheduleOpen(true); }}>
              <Icon name="calendar2" size={13} />
            </button>
          )}
        </div>
        {/* Right side: the calendar is the ONLY thing at rest; on hover the cluster grows around it. */}
        <div className="ractions">
          {/* AI opens to the LEFT of the calendar */}
          <div className="lrev">
            <div className="r-in">
              {/* a note has no data behind it, so there is nothing to summarise */}
              {!tiny && !isNote && (
                <button
                  ref={aiBtn} className={`ti ai ${aiHover ? 'on' : ''}`}
                  onMouseEnter={openAiHover} onMouseLeave={closeAiHoverSoon}
                  onClick={(e) => { e.stopPropagation(); openAiHover(); }} title="AI summary of this widget"
                ><Icon name="sparkles" size={15} /></button>
              )}
            </div>
          </div>
          {showDf && (
            <button
              ref={dfChipEl} className={`ti df-btn ${dfSource} ${dfOpen || dfSource !== 'none' ? 'on' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleDf(); }} onMouseEnter={showDfTip} onMouseLeave={() => setDfTipOpen(false)}
            >
              <Icon name="calendar" size={13} />
            </button>
          )}
          {/* Refresh and ⋯ open to its RIGHT */}
          <div className="right">
            <div className="r-in">
              {/* nothing to re-fetch on a note either */}
              {!tiny && !isNote && (
                <button className="ti" onClick={refresh} title="Refresh"><Icon name="refresh" size={15} className={loading ? 'spin' : ''} /></button>
              )}
              <div className="mwrap">
                <button ref={menuBtn} className="ti" onClick={(e) => { e.stopPropagation(); toggleMenu(); }} title="More"><Icon name="dots-v" size={15} /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* the date icon's instant tooltip — portalled so the card's overflow cannot clip it */}
      {dfTipOpen && !dfOpen && (
        <DashPortal>
          <span className="dc-WidgetCard tt df-tt" style={{ top: dfTipPos.top + 'px', left: dfTipPos.left + 'px' }}>
            <b className="dft-name">{dfTip.name}</b>
            {dfTip.stamps && <span className="dft-stamps">{dfTip.stamps}</span>}
            <span className="dft-from">{dfTip.from}</span>
          </span>
        </DashPortal>
      )}

      {/* the shared two-pane picker, the same one the topbar and a group header open */}
      {dfOpen && (
        <TimeRangePopover
          value={effRange} rect={dfRect} followLabel={dfFollowLabel} note={dfNote}
          onPick={pickDf} onClear={clearDf} onClose={() => setDfOpen(false)}
        />
      )}

      {/* per-widget AI: hover mini-summary card, portalled so it overlays the board */}
      {aiHover && (
        <DashPortal>
          <div
            className={`dc-WidgetCard wai-card aic ${aiPos.flip ? 'up' : ''}`}
            style={{ top: aiPos.top + 'px', left: aiPos.left + 'px' }}
            onMouseEnter={keepAiHover} onMouseLeave={closeAiHoverSoon}
          >
            {aiCard(runWidgetAction)}
          </div>
        </DashPortal>
      )}

      {/* info tooltip: portalled so it isn't clipped by the card's overflow */}
      {infoHover && (
        <DashPortal>
          <span className="dc-WidgetCard tt tt-stack info-tt" style={{ top: infoPos.top + 'px', left: infoPos.left + 'px' }}>
            {/* description leads; provenance rides below it as a pill */}
            <span className="tt-desc">{tile.info || 'No description has been added for this widget yet.'}</span>
            <span className={`tt-tag ${prov}`}>{provMeta.label}</span>
            {/* Restricted only, folded below a rule as a second fact about the widget. */}
            {tile.access === 'restricted' && (
              <span className="tt-acc">
                <span className="tt-acc-h"><Icon name="users" size={12} /> Shared with {audienceCount}</span>
                {groupList.length > 0 && <span className="tt-acc-row">{groupList.join(' · ')}</span>}
                {techList.length > 0 && <span className="tt-acc-row">{techList.join(' · ')}</span>}
                {!audienceCount && <span className="tt-acc-row">Nobody added yet — only you can see it.</span>}
              </span>
            )}
          </span>
        </DashPortal>
      )}

      {/* ⋯ menu: portalled so it overlays the card instead of being clipped by overflow */}
      {menu && (
        <DashPortal>
          <div className="dc-WidgetCard">
            <div className="backdrop" onClick={closeMenu} />
            <div ref={menuEl} className={`menu tile-menu ${!subLeft ? 'sub-right' : ''}`} style={{ top: menuPos.top + 'px', left: menuPos.left + 'px' }} onClick={(e) => e.stopPropagation()}>
              {/* AI first, ruled off from the rest — present here only on a tile too small for the
                  header sparkle. One item: hovering it flies out the SAME summary card. */}
              {WIDGET_CTAS.length > 0 && tiny && (
                <div
                  className="menu-item sub ai"
                  onMouseEnter={() => { setAiSubOpen(true); setTypeOpen(false); setExportOpen(false); setMoveOpen(false); }}
                  onMouseLeave={() => setAiSubOpen(false)}
                >
                  <span className="mi-l"><Icon name="sparkles" size={15} /> AI Insights</span><Icon name="chevron-right" size={14} className="mi-c" />
                  {aiSubOpen && <div className="submenu ai-sub">{aiCard(askWidgetAi)}</div>}
                </div>
              )}
              {WIDGET_CTAS.length > 0 && tiny && <div className="menu-sep" />}
              {/* Widget actions: Refresh · Edit · Chart Type · Full screen · Duplicate. Refresh appears
                  here ONLY on a tile too narrow to show it in its header. */}
              {tiny && <button className="menu-item" onClick={() => { setMenu(false); refresh(); }}><Icon name="refresh" size={15} /> Refresh</button>}
              {canEdit && <button className="menu-item" onClick={() => { setMenu(false); onEdit?.(tile); }}><Icon name="edit" size={15} /> Edit</button>}
              {/* Chart type → submenu; a predefined pie is frozen, so the item is disabled with the reason. */}
              {tile.type === 'chart' && tile.chart && (
                <div
                  className={`menu-item sub ${typeFrozen ? 'dis' : ''}`} title={typeFrozen ? typeFrozenWhy : ''}
                  onMouseEnter={() => { setTypeOpen(!typeFrozen); setExportOpen(false); setMoveOpen(false); }}
                  onMouseLeave={() => setTypeOpen(false)}
                >
                  <span className="mi-l"><Icon name="chart-bar" size={15} /> Chart type</span><Icon name="chevron-right" size={14} className="mi-c" />
                  {typeOpen && (
                    <div className="submenu types">
                      {chartTypes.map((ct) => (
                        <button
                          key={ct.id} className={`menu-item ct ${tile.chart.kind === ct.id ? 'on' : ''}`}
                          disabled={!!disabledFor(ct)} title={disabledFor(ct) || `Show as ${ct.label}`}
                          onClick={() => setKind(ct)}
                        >
                          <Icon name={ct.icon} size={16} /> {ct.label}
                          {tile.chart.kind === ct.id && <Icon name="check" size={14} className="ct-ck" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button className="menu-item" onClick={() => { setMenu(false); setPresent(true); }}><Icon name="maximize-tile" size={15} /> Full screen</button>
              <button className="menu-item" onClick={duplicate}><Icon name="copy" size={15} /> Duplicate</button>
              {/* Move to group → submenu, the same shape as Export */}
              {canMove && (
                <div className="menu-item sub" onMouseEnter={() => { setMoveOpen(true); setExportOpen(false); setTypeOpen(false); }} onMouseLeave={() => setMoveOpen(false)}>
                  <span className="mi-l"><Icon name="arrow-right" size={15} /> {moveGroups.some((g: any) => g.id === tile.group) ? 'Move to another group' : 'Move to group'}</span><Icon name="chevron-right" size={14} className="mi-c" />
                  {moveOpen && (
                    <div className="submenu mv-sub">
                      {moveGroups.map((g: any) => (
                        <button
                          key={g.id} className={`menu-item mv-row ${g.id === tile.group ? 'cur' : ''}`}
                          disabled={g.id === tile.group} title={g.id === tile.group ? 'This widget is already here' : `Move to ${g.name}`}
                          onClick={() => moveTo(g)}
                        >
                          <span className="mv-dot" />
                          <span className="mv-nm">{g.name}</span>
                          <span className="mv-n">{g.n}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* divider between the widget's own actions and the export group */}
              <div className="menu-sep" />
              {/* Export → submenu (Image / PDF / Email as PDF) */}
              <div className="menu-item sub" onMouseEnter={() => { setExportOpen(true); setTypeOpen(false); setMoveOpen(false); }} onMouseLeave={() => setExportOpen(false)}>
                <span className="mi-l"><Icon name="export" size={15} /> Export</span><Icon name="chevron-right" size={14} className="mi-c" />
                {exportOpen && (
                  <div className="submenu ex">
                    {EXPORTS.map((f) => <button key={f.id} className="menu-item" onClick={() => exportAs(f)}><Icon name={f.icon} size={15} /> {f.label}</button>)}
                    {/* Emailing produces the same PDF; ruled off because it opens a dialog. */}
                    <div className="menu-sep" />
                    <button className="menu-item" onClick={() => { setMenu(false); setExportOpen(false); setEmailOpen(true); }}><Icon name="mail" size={15} /> Email as PDF</button>
                  </div>
                )}
              </div>
              {/* Schedule is absent on a NOTE: a note has no data to re-render. */}
              {!isNote && <button className="menu-item" onClick={() => { setMenu(false); setScheduleOpen(true); }}><Icon name="calendar2" size={15} /> Schedule</button>}
              {canDelete && (
                <>
                  <div className="menu-sep" />
                  <button className="menu-item danger" onClick={() => { setMenu(false); setConfirmDel(true); }}><Icon name="trash" size={15} /> Delete card</button>
                </>
              )}
            </div>
          </div>
        </DashPortal>
      )}

      {/* Body */}
      <div ref={bodyEl} className="tbody">
        {demoLoading ? (
          /* the Chart Morph loader, centred, while a loaderDemo widget "loads" — the MONOCHROME one */
          <div className="demo-loader"><ChartLoader variant="morph" mono smooth size={60} /></div>
        ) : loading ? (
          <div className="loading">
            <div className="skeleton" style={{ height: '60%', width: '80%' }} />
            <div className="skeleton" style={{ height: '14px', width: '50%', marginTop: '10px' }} />
          </div>
        ) : tileState !== 'ok' ? (
          /* empty-widget states: unconfigured / error / no-data. The wording lives in data/emptyStates.js. */
          <WidgetEmpty
            state={emptyState} kind={tileState}
            canAct={tileState === 'error' || canEdit}
            onAct={(a: string) => (a === 'retry' ? retry() : onEdit?.(tile))}
          />
        ) : tile.type === 'kpi' ? (
          <div className="kpi">
            {/* The number alone — the ▲/▼ % against an unstated period was withdrawn. */}
            <div className="kpinum">{viewValue}{tile.unit && <span className="unit">{tile.unit}</span>}</div>
          </div>
        ) : tile.type === 'chart' ? (
          tile.chart ? <ChartTile chart={viewChart} legend={showLegend} dataLabels={tile.dataLabels === true} height={chartH} /> : null
        ) : tile.type === 'text' ? (
          <FreeTextTile content={tile.content} ft={tile.ft} />
        ) : (
          <div className="stbl">
            {/* No filter bar on the board tile — search and filter both live in Full screen, where
                the entire record set is present and narrowing it means something. */}
            <div className="stbl-scroll">
              <DataTable columns={tile.columns} rows={filteredRows} search={tableSearch} filtered={hasTableFilters} onClearFilters={() => setTableConds([])} slotCell={cell} />
            </div>
            {/* Footer: what the table holds, and the way to all of it. "View all" opens Full screen. */}
            <div className="sfoot">
              <span className="sfoot-t">{footText}</span>
              <button className="sfoot-a" onClick={() => setPresent(true)}>View all <Icon name="chevron-right" size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Email as PDF: preview + screenshot-style markup + recipients */}
      {emailOpen && <DashPortal><EmailWidgetModal tile={tile} onClose={() => setEmailOpen(false)} /></DashPortal>}
      {scheduleOpen && <DashPortal><ScheduleDialog d={tile} onClose={() => setScheduleOpen(false)} /></DashPortal>}
      {confirmDel && (
        <ConfirmDialog
          title="Delete this widget?"
          target={tile.title}
          message="will be removed from this dashboard. The widget stays in the library, so you can add it back."
          confirmLabel="Delete widget"
          onConfirm={() => { setConfirmDel(false); onRemove?.(tile); }}
          onCancel={() => setConfirmDel(false)}
        />
      )}

      {/* Present mode (single tile) */}
      {present && (
        <DashPortal>
          <div className="dc-WidgetCard">
            <div className="overlay" onClick={(e) => e.target === e.currentTarget && setPresent(false)}>
              <div className="present">
                {/* Full screen carries the actions that still MEAN something at this size: refresh and collapse. */}
                <div className="phead">
                  <b>{tile.title}</b>
                  <div className="phead-a">
                    <button className="btn btn-icon" title="Refresh" onClick={refresh}><Icon name="refresh" size={17} className={loading ? 'spin' : ''} /></button>
                    <button className="btn btn-icon" title="Exit full screen" onClick={() => setPresent(false)}><Icon name="minimize-tile" size={17} /></button>
                  </div>
                </div>
                <div className={`pbody ${tile.type === 'shortcut' ? 'tbl' : ''}`}>
                  {tile.type === 'chart' ? (
                    <ChartTile chart={viewChart} legend={showLegend} dataLabels={tile.dataLabels === true} height={620} />
                  ) : tile.type === 'kpi' ? (
                    <div className="kpi big"><div className="kpinum">{viewValue}<span className="unit">{tile.unit}</span></div></div>
                  ) : tile.type === 'text' ? (
                    <FreeTextTile content={tile.content} ft={tile.ft} />
                  ) : (
                    <div className="stbl big">
                      {/* full screen: the same bar, always there, and the whole record set scrolls */}
                      <TableFilterBar
                        columns={tile.columns || []} rows={viewRows}
                        modelValue={tableConds} onUpdateModelValue={setTableConds}
                        search={tableSearch} onUpdateSearch={setTableSearch}
                        onClose={() => { setTableConds([]); setTableSearch(''); }}
                      />
                      <div className="stbl-scroll">
                        <DataTable columns={tile.columns} rows={filteredRows} search={tableSearch} filtered={hasTableFilters} onClearFilters={() => setTableConds([])} slotCell={cell} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashPortal>
      )}
    </div>
  );
}
