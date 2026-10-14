/* DashboardView — the board: header (title · fav · info), time filter, auto refresh, export,
 * the AI chip and the ⋯ menu; the KPI/widget grid with drag-reorder and bottom-right resize;
 * collapsible widget groups (with the Groups navigator, sticky headers, a per-group date
 * filter, marquee / shift-click select behind its flag); the AI entry points; and every
 * dialog the board opens.
 *
 * Port notes:
 *  · The product header has no Ask AI and no dark-mode toggle, so both sit at the right end
 *    of THIS board's header toolbar (dark mode is Dashboard-only). The tour is in the ⋯ menu.
 *  · The prototype's `.main` scroller is the page's own scroll container (DashboardPage).
 *  · The grouping/legend DEMO switch bars (`showGroupDemo` / `showLegendDemo`, both false in
 *    the prototype) and the alternative grouping designs behind constant-false flags (auto-
 *    group, row inserters, hover chip, sections) were not ported — they cannot render. The
 *    marquee / shift-click select machinery IS ported, behind `gUseMarquee` (false, as in the
 *    prototype). */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './DashboardView.css';
import { Icon, ConfirmDialog, DashPortal } from '../ui/primitives';
import { WidgetCard } from './WidgetCard';
import { TimeFilter } from './TimeFilter';
import { AutoRefresh } from './AutoRefresh';
import { DashboardMenu } from './DashboardMenu';
import { AddWidgetModal } from './AddWidgetModal';
import { WidgetBuilderModal } from './WidgetBuilderModal';
import { PresentMode } from './PresentMode';
import { HistoryDialog } from './HistoryDialog';
import { ExportDialog } from './ExportDialog';
import { ScheduleDialog } from './ScheduleDialog';
import { TimeRangePopover } from './TimeRangePopover';
import { GroupEditDrawer } from './GroupEditDrawer';
import { EmptyGroupArt } from './EmptyGroupArt';
import { EmptyBoardArt } from './EmptyBoardArt';
import { AiSummaryCard } from './AiSummaryCard';
import { AiInsightChip } from './AiInsightChip';
import { AiInsightCard } from './AiInsightCard';
import { AiAssistant } from './AiAssistant';
import { grpHeadVars, grpStyleOf } from '../data/groups.js';
import { demoBoard } from '../data/aiDemo.js';
import { store, byId, recordView, toggleFavorite, removeTile, toast } from '../store.js';
import { useDashStore } from '../reactivity.js';
import { router, useDashRoute } from '../nav.js';
import { uid } from '../data/mock.js';
import { windowFor, stampFor } from '../data/timeRanges.js';

/** The anchor rect a TimeRangePopover is placed from (TimeRangePopover.vue's `rectOf`). */
function rectOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height };
}
const initials = (n: any) => String(n).trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const nowIso = () => new Date().toISOString();

/* Grouping is down to TWO methods: the Add-New-Widget panel's Empty group and the empty-
 * state "or create a group". Marquee-drag and Shift-click select-to-group were removed: a
 * press-and-drag on empty board space is too easy to do by accident. The machinery is left
 * behind this flag. */
const gUseMarquee = false;
const gShowEmptyGroupCta = true; // empty-state "or create a group"
const gShowFabGroup = false;     // sidebar Empty group covers this instead
const gRightClick = false;

const UG = '__ug';
const GAP = 16;
const GD_W = 300;
const FONT_PX: any = { S: 12, M: 13, L: 15 };

/* A chart KIND is not a builder TYPE id (see the prototype for the bug this fixed). */
const KIND_TO_TYPE: any = {
  line: { id: 'line', label: 'Line' },
  area: { id: 'line', label: 'Line' },        // an area chart is a line with a fill
  hbar: { id: 'bar', label: 'Bar' },          // "Bar" = horizontal
  bar: { id: 'column', label: 'Column' },     // "Column" = vertical
  pie: { id: 'pie', label: 'Pie' },
  donut: { id: 'pie', label: 'Pie' },
  funnel: { id: 'pie', label: 'Pie' },
  pyramid: { id: 'pie', label: 'Pie' },
};
function typeForTile(t: any) {
  if (t.type === 'kpi') return { id: 'kpi', label: 'KPI', type: 'kpi', kind: null };
  if (t.type === 'shortcut') return { id: 'shortcut', label: 'Shortcut', type: 'shortcut', kind: null };
  // A note has no chart — without this it opened the Column builder over text content.
  if (t.type === 'text') return { id: 'text', label: 'Free Text', type: 'text', kind: null };
  const kind = t.chart?.kind || 'bar';
  const m = KIND_TO_TYPE[kind] || KIND_TO_TYPE.bar;
  return { id: m.id, label: m.label, type: 'chart', kind };
}

export function DashboardView({ id: idProp }: any) {
  useDashStore();
  const route = useDashRoute();
  const id = idProp ?? route.params.id;
  const d: any = byId(id);

  // per-instance mutable state the Vue setup kept in plain `let`s
  const R = useRef<any>({ pinned: null, restoredFor: null, scroller: null, resizeCtx: null, mqPending: null, mqStart: null, flashT: null, applying: false, hist: { undo: [], redo: [], last: undefined, prev: null } }).current;

  const [edit, setEdit] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [descHover, setDescHover] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [revealing, setRevealing] = useState(false); // brief window after load → staggered reveal
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [editTile, setEditTile] = useState<any>(null); // tile open in the builder (edit mode)
  const [dupTile, setDupTile] = useState<any>(null);   // tile being duplicated
  const [fabMenu, setFabMenu] = useState(false);       // FAB slide-up
  const gridEl = useRef<HTMLDivElement>(null);
  const rootEl = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(true); loadingRef.current = loadingBoard;
  const flashTile = (tid: string, ms: number) => { setHighlightId(tid); setTimeout(() => setHighlightId((h) => (h === tid ? null : h)), ms); };
  const scrollToTile = (tid: string) => document.querySelector(`[data-tile="${tid}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const touch = () => { d.updated = nowIso(); setDirty(true); };

  /* How many named recipients a RESTRICTED board has. */
  const sharedCount = (d?.techAccess || []).length + (d?.groupAccess || []).length;

  // ---- drag-to-reorder / drag-into-group (armed from each card's 6-dot handle) ----
  const [dragArmed, setDragArmed] = useState<string | null>(null);
  const [dragId, setDragIdS] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const setDragId = (v: string | null) => { dragIdRef.current = v; setDragIdS(v); };
  const [dropGroup, setDropGroup] = useState<any>(undefined); // undefined=none, null=ungrouped
  /* Layout Lock freezes position AND size. */
  const layoutLocked = d?.layoutLock === true;
  function armDrag(t: any) {
    if (layoutLocked) return;
    setDragArmed(t.id);
    window.addEventListener('mouseup', () => { if (dragIdRef.current == null) setDragArmed(null); }, { once: true });
  }
  const onDragStart = (t: any) => setDragId(t.id);
  const onDragEnd = () => { setDragArmed(null); setDragId(null); setDropGroup(undefined); };
  function onDropTile(target: any) { // dropped onto another tile → reorder + adopt its group
    const arr = d.tiles;
    const from = arr.findIndex((x: any) => x.id === dragIdRef.current);
    if (from < 0 || arr[from].id === target.id) return;
    const [m] = arr.splice(from, 1);
    m.group = target.group ?? null;
    arr.splice(arr.findIndex((x: any) => x.id === target.id), 0, m);
    touch();
  }
  function onDropGroup(gid: any) { // dropped onto a section → move into that group (end)
    const arr = d.tiles;
    const from = arr.findIndex((x: any) => x.id === dragIdRef.current);
    if (from < 0) return;
    const [m] = arr.splice(from, 1);
    m.group = gid;
    arr.push(m);
    setDropGroup(undefined);
    touch();
  }

  // ---- widget groups (Grafana-style collapsible rows) + pin ----
  function tilesIn(gid: any) {
    const ids = new Set((d.groups || []).map((g: any) => g.id));
    return d.tiles
      .filter((t: any) => ((t.group && ids.has(t.group)) ? t.group : null) === gid)
      .sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)); // pinned float to top
  }
  const [addToGroup, setAddToGroup] = useState<string | null>(null); // group a new widget lands in
  // A new group is just that group, empty. Widgets already on the board stay where they are.
  function addGroup() {
    if (!d.groups) d.groups = [];
    const g = { id: uid('g'), name: `New group ${d.groups.length + 1}`, collapsed: false, dateFilter: null };
    d.groups.push(g);
    setDirty(true);
    return g.id;
  }
  // "Empty Group" card in the Add-Widget flow → make a genuinely empty group, then close.
  function onNewGroup() {
    addGroup();
    setShowAdd(false); setAddToGroup(null);
    toast('Empty group added — use its “Add widget” button to fill it', 'success');
  }

  const ap = store.ui.aiPlacement;

  // ---- AI: the Summary card is always upfront; every CTA opens the ServiceOps AI side panel.
  // The AI reads the board you are ACTUALLY on.
  const aiBoard = d || demoBoard();
  const [aiRole, setAiRole] = useState('technician');
  const aiPanel = useRef<any>(null);
  // the panel mounts on the render after it is opened — wait for its handle, then run
  const withPanel = (fn: (p: any) => void, n = 20) => {
    if (aiPanel.current) fn(aiPanel.current);
    else if (n > 0) setTimeout(() => withPanel(fn, n - 1), 25);
  };
  const openAi = () => { store.ui.aiPanelOpen = true; };
  // The card CTAs carry an explicit intent + a natural-language label, run directly.
  function onCardAsk(intent: string, text?: string) {
    store.ui.aiPanelOpen = true;
    if (intent && intent !== 'open') withPanel((p) => p.trigger?.(intent, text));
  }
  // a widget can request an intent from anywhere; forward it into the panel
  useEffect(() => {
    const a = store.ui.aiAsk;
    if (!a) return;
    store.ui.aiPanelOpen = true;
    withPanel((p) => { p.trigger?.(a.intent, a.text); store.ui.aiAsk = null; });
  }, [store.ui.aiAsk]);
  // The AI panel "spotlights" a widget by title — scroll to the matching tile and flash it.
  useEffect(() => {
    const title = store.ui.aiHighlight;
    if (!title) return;
    const t = (d?.tiles || []).find((x: any) => x.title === title);
    store.ui.aiHighlight = null;
    if (!t) return;
    requestAnimationFrame(() => { scrollToTile(t.id); flashTile(t.id, 2600); });
  }, [store.ui.aiHighlight]);

  // ---- per-tile group menu (B: right-click — off) ----
  const [tileMenu, setTileMenu] = useState<any>({ open: false, tile: null, top: 0, left: 0 });
  function openTileMenu(t: any, e: any) {
    e.preventDefault(); e.stopPropagation();
    setTileMenu({ open: true, tile: t, top: Math.min(e.clientY, window.innerHeight - 240), left: Math.min(e.clientX, window.innerWidth - 220) });
  }
  const closeTileMenu = () => setTileMenu((m: any) => ({ ...m, open: false }));
  const onCellContext = (t: any, e: any) => { if (gRightClick) openTileMenu(t, e); };
  function tileNewGroup(t: any) {
    if (!d.groups) d.groups = [];
    const g = { id: uid('g'), name: `New group ${d.groups.length + 1}`, collapsed: false, dateFilter: null };
    d.groups.push(g); t.group = g.id;
    setEditingGroup(g.id);
    touch(); closeTileMenu();
    toast(`Grouped “${t.title}”`, 'success');
  }
  function tileToGroup(t: any, gid: string) { t.group = gid; touch(); closeTileMenu(); toast(`Moved “${t.title}”`, 'success'); }
  function tileUngroup(t: any) { t.group = null; touch(); closeTileMenu(); }

  // ---- New group by direct MARQUEE drag (behind gUseMarquee) ----
  const [selecting, setSelecting] = useState(false);
  const [groupPicks, setGroupPicksS] = useState<Set<string>>(() => new Set());
  const picksRef = useRef<Set<string>>(groupPicks);
  const setGroupPicks = (s: Set<string>) => { picksRef.current = s; setGroupPicksS(s); };
  const [showGroupCta, setShowGroupCta] = useState(false);
  const [marquee, setMarquee] = useState({ active: false, l: 0, t: 0, w: 0, h: 0 });
  // container-first: a labeled "Add group" makes an empty, collapsible group you fill later.
  function insertEmptyGroup(i: number) {
    if (!d.groups) d.groups = [];
    const g = { id: uid('g'), name: `New group ${d.groups.length + 1}`, collapsed: false, dateFilter: null };
    d.groups.splice(i, 0, g);
    touch();
    setEditingGroup(g.id); // drop straight into rename
    return g.id;
  }
  function addEmptyGroup() { insertEmptyGroup((d.groups || []).length); toast('Empty group added — drag widgets in, or use its “Add widget” button', 'success'); }
  function togglePick(tid: string) {
    const s = new Set<string>(picksRef.current); s.has(tid) ? s.delete(tid) : s.add(tid); setGroupPicks(s);
    setShowGroupCta(s.size > 0);
  }
  function boardMouseDown(e: any) {
    if (!gUseMarquee) return;
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, textarea, select, .note-lane, .resize, .grp-head')) return;
    // a widget's header is its drag handle — a plain press there moves the tile
    if (!(e.shiftKey || e.ctrlKey || e.metaKey) && e.target.closest('.thead')) return;
    // Shift / Ctrl / ⌘ + click on an ungrouped tile toggles it into the selection
    const cell = e.target.closest('.cell[data-tile]');
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && cell && !cell.closest('.group')) {
      togglePick(cell.getAttribute('data-tile')); e.preventDefault(); return;
    }
    R.mqPending = { x: e.clientX, y: e.clientY };
    window.addEventListener('mousemove', mqPendingMove);
    window.addEventListener('mouseup', mqPendingUp);
  }
  function mqPendingMove(e: MouseEvent) {
    if (!R.mqPending) return;
    if (Math.abs(e.clientX - R.mqPending.x) < 5 && Math.abs(e.clientY - R.mqPending.y) < 5) return;
    R.mqStart = R.mqPending; R.mqPending = null;
    window.removeEventListener('mousemove', mqPendingMove);
    window.removeEventListener('mouseup', mqPendingUp);
    setSelecting(true); setShowGroupCta(false); setGroupPicks(new Set());
    setMarquee({ active: true, l: R.mqStart.x, t: R.mqStart.y, w: 0, h: 0 });
    window.addEventListener('mousemove', mqMove);
    window.addEventListener('mouseup', mqUp);
    mqMove(e);
  }
  function mqPendingUp() {
    window.removeEventListener('mousemove', mqPendingMove);
    window.removeEventListener('mouseup', mqPendingUp);
    R.mqPending = null;
  }
  function mqMove(e: MouseEvent) {
    const l = Math.min(R.mqStart.x, e.clientX), t = Math.min(R.mqStart.y, e.clientY);
    const w = Math.abs(e.clientX - R.mqStart.x), h = Math.abs(e.clientY - R.mqStart.y);
    setMarquee({ active: true, l, t, w, h });
    const box = { left: l, top: t, right: l + w, bottom: t + h };
    const s = new Set<string>();
    gridEl.current?.querySelectorAll('.ug-wrap [data-tile]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!(r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom)) s.add(el.getAttribute('data-tile')!);
    });
    setGroupPicks(s);
  }
  function mqUp() {
    window.removeEventListener('mousemove', mqMove);
    window.removeEventListener('mouseup', mqUp);
    setSelecting(false);
    setMarquee((m) => ({ ...m, active: false }));
    if (picksRef.current.size) setShowGroupCta(true);
    else clearPicks();
  }
  function clearPicks() { setGroupPicks(new Set()); setShowGroupCta(false); }
  function createGroupFromPicks() {
    const picks = picksRef.current;
    if (!picks.size) { clearPicks(); return; }
    if (!d.groups) d.groups = [];
    const g = { id: uid('g'), name: `New group ${d.groups.length + 1}`, collapsed: false, dateFilter: null };
    d.groups.push(g);
    const n = picks.size;
    // remember each tile's previous group so the action can be undone cleanly
    const prev = d.tiles.filter((t: any) => picks.has(t.id)).map((t: any) => ({ id: t.id, group: t.group ?? null }));
    prev.forEach((p: any) => { const t = d.tiles.find((x: any) => x.id === p.id); if (t) t.group = g.id; });
    touch();
    toast(`Grouped ${n} widget${n > 1 ? 's' : ''} — the rest stay on the dashboard`, 'success', {
      label: 'Undo',
      fn: () => {
        prev.forEach((p: any) => { const t = d.tiles.find((x: any) => x.id === p.id); if (t) t.group = p.group; });
        d.groups = d.groups.filter((x: any) => x.id !== g.id);
        setDirty(true);
      },
    });
    clearPicks();
  }
  function addWidgetToGroup(gid: string) { setAddToGroup(gid); setShowAdd(true); }
  function ungroup(g: any) {
    const n = tilesIn(g.id).length;
    d.tiles.forEach((t: any) => { if (t.group === g.id) t.group = null; });
    d.groups = d.groups.filter((x: any) => x.id !== g.id);
    setDirty(true);
    toast(n ? `Ungrouped “${g.name}” — its ${n} widget${n === 1 ? '' : 's'} stay on the dashboard` : `Removed the empty group “${g.name}”`, 'success');
  }

  /* ── The group ⋯ menu: Edit · Clone · Ungroup · Delete ──
   * Teleported and placed in viewport coords — the group's rounded body clips anything inside. */
  const [gMenu, setGMenu] = useState<any>({ open: false, g: null, top: 0, left: 0 });
  function openGroupMenu(g: any, e: any) {
    const r = e.currentTarget.getBoundingClientRect();
    /* Flips ABOVE the button when there is no room below. */
    const W = 188, H = 172, G = 6;
    const top = window.innerHeight - r.bottom >= H + G ? r.bottom + G : Math.max(8, r.top - H - G);
    setGMenu({ open: true, g, top, left: Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8)) });
  }
  const closeGroupMenu = () => setGMenu((m: any) => ({ ...m, open: false }));
  const [editGroupTarget, setEditGroupTarget] = useState<any>(null);
  function editGroup(g: any) { closeGroupMenu(); setEditGroupTarget(g); }
  /* A clone looks like its source and lands directly below it. The widgets are copies with fresh ids. */
  function cloneGroup(g: any) {
    closeGroupMenu();
    const names = new Set(d.groups.map((x: any) => x.name));
    let name = `Copy of ${g.name}`, n = 2;
    while (names.has(name)) name = `Copy of ${g.name} (${n++})`;
    const copy = { ...JSON.parse(JSON.stringify(g)), id: uid('g'), name, collapsed: false };
    d.groups.splice(d.groups.indexOf(g) + 1, 0, copy);
    const src = tilesIn(g.id);
    src.forEach((t: any) => d.tiles.push({ ...JSON.parse(JSON.stringify(t)), id: uid('t'), group: copy.id, seeded: false }));
    touch();
    toast(`Cloned as “${name}” with ${src.length} widget${src.length === 1 ? '' : 's'}`, 'success');
  }
  function ungroupFromMenu(g: any) { closeGroupMenu(); ungroup(g); }
  /* Delete takes the widgets WITH it. A seeded widget cannot be removed, so it is released
     onto the board instead, and the toast says so. */
  const [delGroupTarget, setDelGroupTarget] = useState<any>(null);
  function askDeleteGroup(g: any) { closeGroupMenu(); setDelGroupTarget(g); }
  function deleteGroup() {
    const g = delGroupTarget; setDelGroupTarget(null);
    if (!g) return;
    const inG = tilesIn(g.id);
    const kept = inG.filter((t: any) => t.seeded);
    kept.forEach((t: any) => { t.group = null; });
    d.tiles = d.tiles.filter((t: any) => t.group !== g.id || t.seeded);
    d.groups = d.groups.filter((x: any) => x.id !== g.id);
    touch();
    toast(kept.length
      ? `Deleted “${g.name}” — ${kept.length} predefined widget${kept.length === 1 ? '' : 's'} moved to the dashboard, the rest removed`
      : `Deleted “${g.name}” and its ${inG.length} widget${inG.length === 1 ? '' : 's'}`, 'success');
  }

  /* ── Sticky group headers + the Groups navigator ──
   * A header sticks 16px under the sticky TOOLBAR; the toolbar's height is measured and
   * published as --bar-h. The Groups navigator names the section under the sticky line. */
  const headEl = useRef<HTMLElement>(null);
  const [barH, setBarH] = useState(0);
  const barHRef = useRef(0); barHRef.current = barH;
  const stickLine = () => (R.scroller ? R.scroller.getBoundingClientRect().top : 0) + barHRef.current + GAP;
  const [stuckIds, setStuckIds] = useState<Set<string>>(() => new Set());
  const stuckRef = useRef(stuckIds); stuckRef.current = stuckIds;
  const [gdTip, setGdTip] = useState<any>(null);

  const sections: any[] = (() => {
    const gs = d?.groups || [];
    if (!gs.length) return [];
    const out: any[] = [];
    const loose = tilesIn(null).length;
    if (loose) out.push({ id: UG, name: 'Ungrouped widgets', n: loose });
    gs.forEach((g: any) => out.push({ id: g.id, name: g.name, n: tilesIn(g.id).length }));
    return out;
  })();
  const [curSec, setCurSecS] = useState<string | null>(null);
  const curSecRef = useRef<string | null>(null);
  const setCurSec = (v: string | null) => { curSecRef.current = v; setCurSecS(v); };
  const curSection = sections.find((s) => s.id === curSec) || sections[0] || null;
  const posKey = () => `sod:lastSection:${d?.id}`;
  function rememberSection(sid: string) { try { localStorage.setItem(posKey(), sid); } catch { /* private mode etc. */ } }

  // latest-render closures for listeners registered once
  const L = useRef<any>({});

  function spySection(line: number) {
    const sc = R.scroller;
    if (!sc || !sections.length) return;
    let cur = sections[0].id;
    if (R.pinned && sections.some((s) => s.id === R.pinned)) cur = R.pinned;
    else if (sc.scrollTop > 0 && sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 2) {
      cur = sections[sections.length - 1].id; // at the very bottom: the last one
    } else {
      for (const s of sections) {
        const el = sc.querySelector(`[data-gid="${s.id}"]`);
        if (el && el.getBoundingClientRect().top <= line + 4) cur = s.id;
      }
    }
    if (cur !== curSecRef.current) {
      setCurSec(cur);
      // not until this board's own restore has run
      if (R.restoredFor === d?.id) rememberSection(cur);
    }
  }
  function markStuck() {
    const sc = R.scroller;
    if (!sc) return;
    setGdTip(null); // a fixed hover card would drift off its chip
    const line = stickLine();
    const next = new Set<string>();
    sc.querySelectorAll('.group[data-gid]').forEach((sec: any) => {
      const r = sec.getBoundingClientRect();
      if (r.top < line - 0.5 && r.bottom > line) next.add(sec.dataset.gid);
    });
    const cur = stuckRef.current;
    if (next.size !== cur.size || [...next].some((x) => !cur.has(x))) setStuckIds(next);
    spySection(line);
  }

  const [gNav, setGNav] = useState(false);
  const [gNavQ, setGNavQ] = useState('');
  const gNavInput = useRef<HTMLInputElement>(null);
  const navList = gNavQ.trim() ? sections.filter((s) => s.name.toLowerCase().includes(gNavQ.trim().toLowerCase())) : sections;
  function openNav(focus = false) {
    setGNavQ('');
    setGNav(true);
    if (focus) requestAnimationFrame(() => gNavInput.current?.focus());
  }
  const allExpanded = (d?.groups || []).every((g: any) => !g.collapsed);
  function collapseAll(v: boolean) {
    (d.groups || []).forEach((g: any) => { g.collapsed = v; });
    setGNav(false);
    toast(v ? 'All groups collapsed' : 'All groups expanded');
    requestAnimationFrame(() => L.current.markStuck());
  }

  const [flashGid, setFlashGid] = useState<string | null>(null);
  function jumpToGroup(gid: string, { glide = true, flash = true } = {}) {
    setGNav(false);
    const g = (d.groups || []).find((x: any) => x.id === gid);
    if (gid !== UG && !g) return;
    if (g?.collapsed) g.collapsed = false;
    R.pinned = gid;
    if (curSecRef.current !== gid) { setCurSec(gid); rememberSection(gid); }
    requestAnimationFrame(() => {
      const sc = R.scroller;
      const sec = sc?.querySelector(`[data-gid="${gid}"]`);
      if (!sec || !sc) return;
      const y = sc.scrollTop + sec.getBoundingClientRect().top - stickLine();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sc.scrollTo({ top: Math.max(0, y), behavior: glide && !reduce ? 'smooth' : 'auto' });
      if (!flash || gid === UG) return;
      clearTimeout(R.flashT); setFlashGid(null);
      // flash once the glide has (about) landed, so the highlight is seen, not scrolled past
      R.flashT = setTimeout(() => { setFlashGid(gid); R.flashT = setTimeout(() => setFlashGid(null), 1200); }, glide && !reduce ? 420 : 0);
    });
  }
  function stepSection(dir: number) {
    const list = sections;
    if (!list.length) return;
    const i = Math.max(0, list.findIndex((s) => s.id === curSection?.id));
    const t = list[Math.min(list.length - 1, Math.max(0, i + dir))];
    if (t && t.id !== curSection?.id) jumpToGroup(t.id);
  }
  /* Back to where you were: once the board has rendered, jump (no glide, no pulse). */
  function restoreSection() {
    if (!d || R.restoredFor === d.id) return;
    R.restoredFor = d.id;
    let sid = null;
    try { sid = localStorage.getItem(posKey()); } catch { /* ignore */ }
    if (sid && sections.some((s) => s.id === sid) && sid !== sections[0]?.id) {
      setTimeout(() => L.current.jumpToGroup(sid, { glide: false, flash: false }), 60);
    }
  }

  /* ── Reordering groups: drag a group by its header ── */
  const [gDragArmed, setGDragArmed] = useState<string | null>(null);
  const [dragGroupId, setDragGroupIdS] = useState<string | null>(null);
  const dragGroupRef = useRef<string | null>(null);
  const setDragGroupId = (v: string | null) => { dragGroupRef.current = v; setDragGroupIdS(v); };
  const [dropBefore, setDropBefore] = useState<string | null>(null);
  function armGroupDrag(g: any) {
    setGDragArmed(g.id);
    window.addEventListener('mouseup', () => { if (!dragGroupRef.current) setGDragArmed(null); }, { once: true });
  }
  function onGroupDragStart(g: any, e: any) {
    if (gDragArmed !== g.id) { e.preventDefault(); return; }
    setDragGroupId(g.id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onGroupDragEnd() { setDragGroupId(null); setGDragArmed(null); setDropBefore(null); }
  function onSectionDragOver(g: any) {
    if (dragGroupRef.current) { setDropBefore(dragGroupRef.current === g.id ? null : g.id); return; }
    setDropGroup(g.id);
  }
  function onSectionDrop(g: any) {
    if (!dragGroupRef.current) { onDropGroup(g.id); return; }
    const arr = d.groups;
    const from = arr.findIndex((x: any) => x.id === dragGroupRef.current);
    const to = arr.findIndex((x: any) => x.id === g.id);
    if (from >= 0 && to >= 0 && from !== to) {
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      touch();
    }
    onGroupDragEnd();
  }
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  /* ── A group's date filter ──
   * Set once in the group header; every widget in that group reads it instead of the
   * dashboard's global filter. A widget that set its OWN range keeps it — widget → group →
   * dashboard, most specific wins. WidgetCard resolves that chain. */
  const [gdOpen, setGdOpen] = useState<string | null>(null);
  const [gdRect, setGdRect] = useState<any>(null);
  const gdGroup = (d?.groups || []).find((g: any) => g.id === gdOpen) || null;
  function toggleGroupDate(g: any, e: any) {
    if (gdOpen === g.id) { setGdOpen(null); return; }
    setGdRect(rectOf(e.currentTarget));
    setGdOpen(g.id);
  }
  function pickGroupDate(range: any) {
    const g = gdGroup; if (!g) return;
    g.dateFilter = range;
    setGdOpen(null); setDirty(true);
    toast(`“${g.name}” → ${range}`);
  }
  function clearGroupDate() {
    const g = gdGroup; if (!g) return;
    g.dateFilter = null;
    setGdOpen(null); setDirty(true);
    toast(`“${g.name}” follows the dashboard filter`);
  }
  function groupDateTitle(g: any) {
    const n = tilesIn(g.id).length;
    if (!g.dateFilter) return `Set one time range for all ${n} widget${n === 1 ? '' : 's'} in “${g.name}”`;
    const { start, end } = (windowFor as any)(g.dateFilter);
    return `${(stampFor as any)(start)} → ${(stampFor as any)(end)}\nEvery widget in “${g.name}” reads this instead of the dashboard filter`;
  }
  // how many widgets in this group opted out with a range of their own
  const ownDated = (gid: string) => tilesIn(gid).filter((t: any) => t.dateFilter).length;
  function showGdTip(g: any, e: any) {
    if (gdOpen) return;
    const r = e.currentTarget.getBoundingClientRect();
    setGdTip({ g, top: r.bottom + 8, left: Math.max(8, Math.min(r.right - GD_W, window.innerWidth - GD_W - 8)) });
  }
  function onPin(t: any) { t.pinned = !t.pinned; touch(); toast(t.pinned ? `Pinned “${t.title}”` : `Unpinned “${t.title}”`); }

  /* ---- layout: the board's own value, else the GLOBAL one ---- */
  const lay = (k: string, fallback?: string) => d?.[k] ?? (store.layout as any)[fallback ?? k];
  const boardVars: any = {
    '--tile-title': (FONT_PX[lay('headerFont', 'titleSize')] || 13) + 'px',
    // read by WidgetCard's .tbody
    '--tile-pad': lay('cardPad') + 'px',
  };
  const gridStyle = { columnGap: lay('hGap') + 'px', rowGap: lay('vGap') + 'px' };
  // the board's gutter against the app frame
  const boardPad = lay('boardMargin') + 'px';

  // ---- per-tile size (default span/height) + drag-to-resize from bottom-right ----
  function cellStyle(t: any) {
    const w = Math.min(12, Math.max(2, t.w || 3));
    const h = Math.max(1, t.h || 1);
    const base = lay('rowHeight');
    return { gridColumn: `span ${w}`, minHeight: (base + (h - 1) * 110) + 'px' };
  }
  function startResize(e: any, t: any) {
    if (layoutLocked) return;
    const grid = gridEl.current; if (!grid) return;
    const gap = 14, col = (grid.getBoundingClientRect().width - gap * 11) / 12;
    R.resizeCtx = { t, startX: e.clientX, startY: e.clientY, w0: t.w || 3, h0: t.h || 1, col, gap };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
  }
  function onResizeMove(e: MouseEvent) {
    if (!R.resizeCtx) return;
    const { t, startX, startY, w0, h0, col, gap } = R.resizeCtx;
    t.w = Math.min(12, Math.max(2, w0 + Math.round((e.clientX - startX) / (col + gap))));
    t.h = Math.min(4, Math.max(1, h0 + Math.round((e.clientY - startY) / 110)));
  }
  function onResizeUp() {
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', onResizeUp);
    if (R.resizeCtx) { d.updated = nowIso(); setDirty(true); R.resizeCtx = null; }
  }

  // After a widget is created, smooth-scroll to it (it's appended last) + briefly highlight.
  function onWidgetCreated(tid: string) {
    setShowAdd(false);
    requestAnimationFrame(() => { scrollToTile(tid); flashTile(tid, 1800); });
  }

  // Loading + reveal + (for a brand-new empty board) auto-open Add-Widget.
  // Runs on mount AND on every dashboard switch.
  function loadBoard() {
    setLoadingBoard(true); loadingRef.current = true;
    R.restoredFor = null; R.pinned = null; setCurSec(null); // a (re)opened board restores its own section
    recordView(d);
    setTimeout(() => {
      setLoadingBoard(false); loadingRef.current = false;
      setRevealing(true); // widgets fade/slide in with staggered data
      setTimeout(() => setRevealing(false), 1100);
      if (store.ui.pendingAddWidget) { // new empty board → slide Add-Widget in smoothly
        store.ui.pendingAddWidget = false; setAddToGroup(null);
        setTimeout(() => setShowAdd(true), 260);
      }
      L.current.focusPendingTile();
      requestAnimationFrame(() => { L.current.markStuck(); L.current.restoreSection(); });
    }, 600);
  }
  useEffect(() => { if (d) loadBoard(); }, [id]);
  /* Iris's "Add a widget" follow-up — it navigates to the board first, then asks for the drawer */
  useEffect(() => {
    if (!store.ui.irisAddWidget) return;
    store.ui.irisAddWidget = false; setAddToGroup(null);
    setTimeout(() => setShowAdd(true), loadingRef.current ? 900 : 60);
  }, [store.ui.irisAddWidget]);

  /* Someone asked to be taken to a specific widget — from the "used on N dashboards" badge.
   * Run AFTER the skeleton, or we'd scroll to a widget that isn't in the DOM yet. */
  function focusPendingTile() {
    const f = store.ui.focusTile;
    if (!f) return;
    store.ui.focusTile = null;
    const t = (d?.tiles || []).find((x: any) => x.title === f.title && x.type === f.type);
    if (!t) { toast(`“${f.title}” isn’t on this dashboard any more`, 'warn'); return; }
    requestAnimationFrame(() => { scrollToTile(t.id); flashTile(t.id, 2200); });
  }
  /* Jumping to a widget on the board you're ALREADY on never reloads, so the flag has to be
   * watched as well as read on load — but only act when the tile is actually here. */
  useEffect(() => {
    const f = store.ui.focusTile;
    if (!f || loadingRef.current) return;
    const here = (d?.tiles || []).some((x: any) => x.title === f.title && x.type === f.type);
    if (here) focusPendingTile();
  }, [store.ui.focusTile]);

  /* Manual refresh replays the whole entrance. An auto tick does not: it would strobe a wallboard. */
  const onRefresh = (isManual: boolean) => { if (isManual) loadBoard(); };

  // ---- Undo / Redo (dashboard tiles + groups history) ----
  const snap = d ? JSON.stringify({ tiles: d.tiles || [], groups: d.groups || [] }) : '';
  useEffect(() => {
    const h = R.hist;
    if (R.applying) { R.applying = false; h.prev = snap; return; }
    // first run and any dashboard switch just (re)binds this board's history
    if (d?.id !== h.last) { h.last = d?.id; h.undo = []; h.redo = []; h.prev = snap; return; }
    if (h.prev !== snap) {
      h.undo.push(h.prev);
      if (h.undo.length > 60) h.undo.shift();
      h.redo = [];
      h.prev = snap;
    }
  }, [snap, d?.id]);
  function applySnap(json: string) {
    const s = JSON.parse(json);
    R.applying = true;
    d.tiles = s.tiles; d.groups = s.groups;
    d.updated = nowIso(); setDirty(true);
  }
  function undo() { const h = R.hist; if (!h.undo.length) return; h.redo.push(h.prev); applySnap(h.undo.pop()); toast('Undo'); }
  function redo() { const h = R.hist; if (!h.redo.length) return; h.undo.push(h.prev); applySnap(h.redo.pop()); toast('Redo'); }
  function onKey(e: KeyboardEvent) {
    const t: any = e.target;
    if (e.key === 'Escape' && gNav) { setGNav(false); return; }
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    // Undo / Redo keep their shortcuts — the toolbar buttons gave their place to Groups
    if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
    else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); }
    // Groups navigator: Alt+↓ / Alt+↑ step between sections, G opens the list
    else if (sections.length && e.altKey && e.key === 'ArrowDown') { e.preventDefault(); stepSection(1); }
    else if (sections.length && e.altKey && e.key === 'ArrowUp') { e.preventDefault(); stepSection(-1); }
    else if (sections.length && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'g' || e.key === 'G')) { e.preventDefault(); openNav(true); }
  }

  L.current = { markStuck, restoreSection, jumpToGroup, focusPendingTile, onKey };

  // scroller listeners + toolbar height, once
  useEffect(() => {
    const sc = rootEl.current?.closest('.main') || document.querySelector('.dash-root .main');
    R.scroller = sc;
    const onScroll = () => L.current.markStuck();
    const unpin = () => { R.pinned = null; };
    sc?.addEventListener('scroll', onScroll, { passive: true });
    ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach((ev) => sc?.addEventListener(ev, unpin, { passive: true }));
    const onKeyW = (e: KeyboardEvent) => L.current.onKey(e);
    window.addEventListener('keydown', onKeyW);
    return () => {
      sc?.removeEventListener('scroll', onScroll);
      ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach((ev) => sc?.removeEventListener(ev, unpin));
      window.removeEventListener('keydown', onKeyW);
    };
  }, [!!d]);
  useLayoutEffect(() => {
    const el = headEl.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setBarH(el.offsetHeight || 0); L.current.markStuck(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [!!d]);

  function onRemove(t: any) { removeTile(d, t); setDirty(true); }
  // Open the builder pre-filled with this tile, in edit mode (with live preview).
  const onEditTile = (t: any) => setEditTile(t);
  function onTileSaved({ id: tid, place }: any) {
    setEditTile(null);
    toast('Widget updated', 'success');
    requestAnimationFrame(() => { if (place) scrollToTile(tid); flashTile(tid, 1500); });
  }
  // Duplicate → open the builder pre-filled with the tile, then clone it in place.
  const onDuplicate = (t: any) => setDupTile(t);
  function onTileDuplicated({ tile, afterId }: any) {
    const i = d.tiles.findIndex((x: any) => x.id === afterId);
    d.tiles.splice(i < 0 ? d.tiles.length : i + 1, 0, tile);
    d.updated = nowIso();
    setDupTile(null);
    setDirty(true);
    requestAnimationFrame(() => { scrollToTile(tile.id); flashTile(tile.id, 1500); });
    toast(`Duplicated “${tile.title}”`, 'success');
  }
  function saveEdit() { setDirty(false); setEdit(false); toast('Layout saved', 'success'); }
  function discard() { if (dirty && !confirm('Discard unsaved changes?')) return; setDirty(false); setEdit(false); }
  const toggleTheme = () => { store.ui.theme = store.ui.theme === 'dark' ? 'light' : 'dark'; };

  if (!d) {
    return (
      <div className="dc-DashboardView missing">
        <Icon name="search" size={28} className="muted" />
        <p>Dashboard not found.</p>
        <button className="btn" onClick={() => router.push('/dashboards')}>Back to Discover</button>
      </div>
    );
  }

  const cellProps = (t: any, grp: any) => ({
    'data-tile': t.id,
    className: `cell ${layoutLocked ? 'locked' : ''} ${highlightId === t.id ? 'flash' : ''} ${dragId === t.id ? 'dragging' : ''} ${!grp && groupPicks.has(t.id) ? 'pick-on' : ''}`,
    style: cellStyle(t),
    draggable: dragArmed === t.id && (grp || !selecting),
    onDragStart: () => onDragStart(t),
    onDragEnd,
    onDragOver: (e: any) => e.preventDefault(),
    onDrop: (e: any) => { e.stopPropagation(); e.preventDefault(); onDropTile(t); },
    onContextMenu: (e: any) => onCellContext(t, e),
  });
  const renderCell = (t: any, grp: any) => (
    <div key={t.id} {...cellProps(t, grp)}>
      {/* `group` is what lets the tile inherit this group's date filter */}
      <WidgetCard tile={t} edit={edit} group={grp} onRemove={onRemove} onEdit={onEditTile} onDuplicate={onDuplicate} onPin={onPin} onArmdrag={armDrag} />
      {!layoutLocked && <span className="resize" title="Drag to resize" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); startResize(e, t); }} />}
    </div>
  );

  return (
    <div ref={rootEl} className="dc-DashboardView board" style={{ ...boardVars, '--bar-h': barH + 'px' } as any}>
      {/* Header */}
      <header ref={headEl as any} className="bhead">
        <div className="bh-left">
          {/* collapse / expand the listing sidebar, beside the title */}
          <button className="listing-toggle" title={store.ui.listingOpen ? 'Collapse dashboard listing' : 'Expand dashboard listing'}
            onClick={() => { store.ui.listingOpen = !store.ui.listingOpen; }}>
            <Icon name={store.ui.listingOpen ? 'panel-close' : 'panel-left'} size={18} />
          </button>
          <button className={`star ${d.favorite ? 'on' : ''}`} onClick={() => toggleFavorite(d)}><Icon name={d.favorite ? 'star-fill' : 'star'} size={17} /></button>
          <div className="titles">
            <div className="t-row">
              <h1>{d.name}</h1>
              {/* ONE card beside the title, holding everything the board is: its description,
                  what kind of board it is, and — on a Restricted board — who it reaches. */}
              <span className="dinfo" onMouseEnter={() => setDescHover(true)} onMouseLeave={() => setDescHover(false)}>
                <Icon name="info" size={15} />
                {descHover && (
                  <span className="tt tt-stack dinfo-tt">
                    <span className="tt-desc">{d.description || 'No description has been added for this dashboard yet.'}</span>
                    {(d.predefined || d.default) && (
                      <span className="tt-tags">
                        {d.predefined && <span className="tt-tag predefined">Predefined</span>}
                        {d.default && <span className="tt-tag def"><Icon name="default-home" size={11} /> Default</span>}
                      </span>
                    )}
                    {/* Restricted only: Public reaches everyone and Private reaches nobody. */}
                    {d.access === 'restricted' && (
                      <span className="tt-acc">
                        <span className="tt-acc-h"><Icon name="users" size={12} /> Shared with {sharedCount}</span>
                        {(d.groupAccess || []).length > 0 && <span className="tt-acc-row">{d.groupAccess.join(' · ')}</span>}
                        {(d.techAccess || []).length > 0 && <span className="tt-acc-row">{d.techAccess.join(' · ')}</span>}
                        {!sharedCount && <span className="tt-acc-row">Nobody added yet — only you can open it.</span>}
                      </span>
                    )}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="bh-right">
          {/* The Groups navigator. Only on a board that has groups. It names the section you
              are in; the list jumps anywhere, and the footer folds or opens every group. */}
          {sections.length > 0 && (
            <div className="pop-wrap gnav-wrap">
              <button className={`gnav-btn ${gNav ? 'on' : ''}`} title="Jump to a group (G) · Alt+↑/↓ to step" aria-haspopup="menu" aria-expanded={gNav}
                onClick={(e) => { e.stopPropagation(); gNav ? setGNav(false) : openNav(); }}>
                <Icon name="grid" size={15} />
                <span className="gnav-cur">Groups</span>
                <Icon name="chevron-down" size={14} className="gnav-chev" />
              </button>
              {gNav && <div className="backdrop" onClick={() => setGNav(false)} />}
              {gNav && (
                <div className="menu gnav-pop" onClick={(e) => e.stopPropagation()}>
                  {sections.length > 6 && (
                    <div className="gnav-search">
                      <Icon name="search" size={14} />
                      <input ref={gNavInput} value={gNavQ} onChange={(e) => setGNavQ(e.target.value)} placeholder="Find a group…"
                        onKeyDown={(e) => { if (e.key === 'Enter' && navList[0]) jumpToGroup(navList[0].id); }} />
                    </div>
                  )}
                  <div className="gnav-list">
                    {navList.map((s) => (
                      <button key={s.id} className={`menu-item gnav-row ${s.id === curSection?.id ? 'cur' : ''} ${s.id === UG ? 'ug' : ''}`}
                        onClick={() => (s.id === curSection?.id ? setGNav(false) : jumpToGroup(s.id))}>
                        <span className="gnav-dot" />
                        <span className="gnav-nm">{s.name}</span>
                        <span className="gnav-n">{s.n}</span>
                      </button>
                    ))}
                    {!navList.length && <div className="gnav-none">No group matches “{gNavQ}”</div>}
                  </div>
                  <div className="gnav-foot">
                    {/* ONE action, the one that applies */}
                    {allExpanded
                      ? <button className="gnav-act" onClick={() => collapseAll(true)}><Icon name="chevron-up" size={14} /> Collapse all</button>
                      : <button className="gnav-act" onClick={() => collapseAll(false)}><Icon name="chevron-down" size={14} /> Expand all</button>}
                    <span className="gnav-keys"><kbd>G</kbd> <kbd>Alt ↑↓</kbd></span>
                  </div>
                </div>
              )}
            </div>
          )}
          <TimeFilter />
          <AutoRefresh onRefresh={onRefresh} />
          {/* One button where Share and Download used to sit side by side. */}
          <div className="pop-wrap">
            <button className={`btn ico-only ${showExport ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); setShowExport(!showExport); }} title="Export"><Icon name="export" size={17} /></button>
            {showExport && <ExportDialog d={d} onClose={() => setShowExport(false)} />}
          </div>
          {/* A: the AI-insights chip lives in the header, immediately left of the ⋯ menu */}
          {!loadingBoard && ap === 'A' && <AiInsightChip board={aiBoard} onAsk={onCardAsk} />}
          <DashboardMenu d={d} align="right" toolbar onPresent={() => setPresenting(true)} onSchedule={() => setShowSchedule(true)} onHistory={() => setShowHistory(true)} />
          {/* Port: the product header has no Ask AI and no dark-mode toggle — both live here,
              at the end of the board's own toolbar (dark mode is Dashboard-only). */}
          <span className="vsep" />
          <button className="askai" onClick={openAi}><Icon name="sparkles" size={15} /> Ask AI</button>
          <button className="ic theme-ic" title={store.ui.theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
            <Icon name={store.ui.theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </header>

      {/* Edit banner (unsaved-changes guard, P2·4) */}
      {edit && (
        <div className="editbar">
          <Icon name="edit" size={15} /> <b>Editing</b> — drag, add or remove tiles.
          {dirty && <span className="unsaved">● Unsaved changes</span>}
          <div className="grow" />
          <button className="btn btn-sm" onClick={discard}>Discard</button>
          <button className="btn btn-sm btn-primary" onClick={saveEdit}><Icon name="check" size={14} /> Save</button>
        </div>
      )}

      {/* Body */}
      <div className="bbody" style={{ paddingLeft: boardPad, paddingRight: boardPad, paddingTop: boardPad }}>
        {/* C (baseline): the collapsible "AI insights" banner, upfront above the grid. */}
        {!loadingBoard && ap === 'C' && <AiSummaryCard board={aiBoard} onAsk={onCardAsk} />}

        {loadingBoard ? (
          /* loading skeleton (P2·9) */
          <div className="grid">
            {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className={`card sk ${n <= 4 ? 'span-3' : 'span-6'}`}><div className="skeleton" style={{ height: '100%' }} /></div>)}
          </div>
        ) : !d.tiles.length && !(d.groups && d.groups.length) ? (
          /* empty state */
          <div className="empty">
            <EmptyBoardArt className="empty-ill" width={220} />
            <h3>Your dashboard is empty</h3>
            <p>Add a <b>Widget</b>, <b>KPI</b> or <b>Shortcut</b> to start visualizing your data.</p>
            <div className="empty-cta">
              <button className="btn btn-primary big-cta" onClick={() => setShowAdd(true)}><Icon name="plus" size={17} /> Add Widget</button>
              {gShowEmptyGroupCta && <button className="btn big-cta ghost" onClick={addEmptyGroup}><Icon name="new-group" size={16} /> or create a group</button>}
            </div>
          </div>
        ) : (
          /* tiles (ungrouped + collapsible groups) */
          <div className={`board-groups ${selecting ? 'selecting' : ''} ${revealing ? 'revealing' : ''}`} ref={gridEl} onMouseDown={boardMouseDown}>
            {/* ungrouped */}
            {tilesIn(null).length > 0 && (
              <div className="ug-wrap" data-gid={UG}>
                <div className={`grid ${dropGroup === null ? 'drop-into' : ''}`} style={gridStyle}
                  onDragOver={(e) => { e.preventDefault(); setDropGroup(null); }} onDrop={() => onDropGroup(null)}>
                  {/* B: a wide AI card takes the first slot of the KPI row */}
                  {ap === 'B' && <div className="cell ai-cell"><AiInsightCard board={aiBoard} onAsk={onCardAsk} /></div>}
                  {tilesIn(null).map((t: any) => renderCell(t, null))}
                </div>
              </div>
            )}

            {/* groups */}
            {(d.groups || []).map((g: any) => {
              const st = grpStyleOf(g);
              const inG = tilesIn(g.id);
              return (
                <section key={g.id}
                  className={`group ${dropGroup === g.id && !dragGroupId ? 'drop-into' : ''} ${g.collapsed ? 'collapsed' : ''} ${st.pad === false ? 'no-pad' : ''} ${dropBefore === g.id ? 'g-drop-before' : ''} ${dragGroupId === g.id ? 'g-dragging' : ''} ${flashGid === g.id ? 'g-flash' : ''}`}
                  style={grpHeadVars(g) as any} data-gid={g.id}
                  onDragOver={(e) => { e.preventDefault(); onSectionDragOver(g); }} onDrop={() => onSectionDrop(g)}>
                  {/* The header is a BAND with three zones: collapse left, the title (centred by
                      default), the actions right. The header itself is the drag handle. */}
                  <header
                    className={`grp-head ${st.align === 'left' ? 'gh-left-align' : ''} ${gMenu.open && gMenu.g === g ? 'acting' : ''} ${stuckIds.has(g.id) ? 'stuck' : ''}`}
                    draggable={gDragArmed === g.id}
                    onMouseDown={(e: any) => { if (!e.target.closest('button, input')) armGroupDrag(g); }}
                    onDragStart={(e) => onGroupDragStart(g, e)} onDragEnd={onGroupDragEnd}>
                    <div className="gh-l">
                      <button className="gh-tog" title={g.collapsed ? 'Expand this group' : 'Collapse this group'} onClick={() => { g.collapsed = !g.collapsed; }}>
                        <Icon name={g.collapsed ? 'chevron-right' : 'chevron-down'} size={16} />
                      </button>
                    </div>
                    <div className="gh-t">
                      {/* focused on mount: a new group opens straight into rename */}
                      {editingGroup === g.id ? (
                        <input className="grp-name-input" value={g.name} onChange={(e) => { g.name = e.target.value; }}
                          ref={(el) => { if (el && !el.dataset.f) { el.dataset.f = '1'; el.focus(); el.select(); } }}
                          onBlur={() => setEditingGroup(null)} onKeyUp={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingGroup(null); }} />
                      ) : (
                        <b className="grp-name" title="Rename group" onClick={() => setEditingGroup(g.id)}>{g.name}</b>
                      )}
                      {st.share === 'private' && <span className="gh-lock" title="Private group — only you can see it"><Icon name="lock" size={12} /></span>}
                    </div>
                    <div className="gh-r">
                      {/* The group's own time range — always on the header; once set it wears the
                          filled calendar tint and its hover card says what it does. */}
                      <button className={`gh-act gh-date ${g.dateFilter ? 'on' : ''}`} aria-label={groupDateTitle(g)}
                        title={g.dateFilter ? undefined : groupDateTitle(g)}
                        onClick={(e) => { e.stopPropagation(); setGdTip(null); toggleGroupDate(g, e); }}
                        onMouseEnter={(e) => { if (g.dateFilter) showGdTip(g, e); }} onMouseLeave={() => setGdTip(null)}>
                        <Icon name="calendar" size={13} />
                      </button>
                      <button className="gh-act gh-hov" title="Add a widget to this group" onClick={() => addWidgetToGroup(g.id)}><Icon name="plus" size={16} /></button>
                      <button className="gh-act gh-hov" title="Group actions" onClick={(e) => { e.stopPropagation(); openGroupMenu(g, e); }}><Icon name="dots-v" size={16} /></button>
                    </div>
                  </header>
                  {!g.collapsed && (
                    <div className="grp-body">
                      <div className="grid" style={gridStyle}>
                        {inG.map((t: any) => renderCell(t, g))}
                        {/* An empty group is a drop well that says what it is for. */}
                        {!inG.length && (
                          <div className="grp-empty" style={{ minHeight: Math.round(lay('rowHeight') * 0.6) + 'px' }}>
                            <EmptyGroupArt className="ge-art" width={132} />
                            <p className="ge-sub">No widgets yet — drag one here, or add a widget.</p>
                            <button className="btn btn-sm" onClick={() => addWidgetToGroup(g.id)}><Icon name="plus" size={14} /> Add widget</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
            {/* No standing "New Group" panel at the board's end — a group is created from the
                Add Widget drawer's Empty Group card. */}
          </div>
        )}
      </div>

      {/* a group's ⋯ menu — Edit · Clone · Ungroup, then Delete apart */}
      {gMenu.open && (
        <DashPortal>
          <div className="dc-DashboardView">
            <div className="backdrop" onClick={closeGroupMenu} />
            <div className="menu grp-menu" style={{ top: gMenu.top + 'px', left: gMenu.left + 'px' }} onClick={(e) => e.stopPropagation()}>
              <button className="menu-item" onClick={() => editGroup(gMenu.g)}><Icon name="edit" size={15} /> Edit group</button>
              <button className="menu-item" onClick={() => cloneGroup(gMenu.g)}><Icon name="copy" size={15} /> Clone group</button>
              <button className="menu-item" onClick={() => ungroupFromMenu(gMenu.g)}><Icon name="ungroup" size={15} /> Ungroup</button>
              <div className="menu-sep" />
              <button className="menu-item danger" onClick={() => askDeleteGroup(gMenu.g)}><Icon name="trash" size={15} /> Delete group</button>
            </div>
          </div>
        </DashPortal>
      )}
      {/* group date chip — hover card */}
      {gdTip && (
        <DashPortal>
          <div className="dc-DashboardView">
            <div className="gd-tip" style={{ top: gdTip.top + 'px', left: gdTip.left + 'px', width: GD_W + 'px' }} role="tooltip">
              <Icon name="info" size={14} />
              <span>
                All {tilesIn(gdTip.g.id).length} widget{tilesIn(gdTip.g.id).length === 1 ? '' : 's'} in
                “{gdTip.g.name}” use <b>{gdTip.g.dateFilter}</b> instead of the dashboard filter{ownDated(gdTip.g.id) ? <>, except {ownDated(gdTip.g.id)} on {ownDated(gdTip.g.id) === 1 ? 'its' : 'their'} own range</> : null}.
              </span>
            </div>
          </div>
        </DashPortal>
      )}
      {editGroupTarget && <GroupEditDrawer group={editGroupTarget} onClose={() => { setEditGroupTarget(null); setDirty(true); }} />}
      {delGroupTarget && (
        <ConfirmDialog
          title="Delete this group?"
          target={delGroupTarget.name}
          message={`and the ${tilesIn(delGroupTarget.id).length} widget${tilesIn(delGroupTarget.id).length === 1 ? '' : 's'} in it will be removed from this dashboard. To keep the widgets, use Ungroup instead.`}
          confirmLabel="Delete group"
          onConfirm={deleteGroup} onCancel={() => setDelGroupTarget(null)}
        />
      )}

      {/* per-tile group menu (B: right-click — behind its flag) */}
      {tileMenu.open && (
        <DashPortal>
          <div className="dc-DashboardView">
            <div className="backdrop" onClick={closeTileMenu} />
            <div className="menu tile-grp-menu" style={{ top: tileMenu.top + 'px', left: tileMenu.left + 'px' }} onClick={(e) => e.stopPropagation()}>
              <button className="menu-item" onClick={() => tileNewGroup(tileMenu.tile)}><Icon name="new-group" size={15} /> New group with this</button>
              {(d.groups || []).length > 0 && (
                <>
                  <div className="menu-sep" />
                  <div className="menu-label">Add to group</div>
                  {d.groups.map((g: any) => <button key={g.id} className="menu-item" onClick={() => tileToGroup(tileMenu.tile, g.id)}><Icon name="folder" size={15} /> {g.name}</button>)}
                </>
              )}
              {tileMenu.tile && tileMenu.tile.group && (
                <>
                  <div className="menu-sep" />
                  <button className="menu-item danger" onClick={() => tileUngroup(tileMenu.tile)}><Icon name="ungroup" size={15} /> Remove from group</button>
                </>
              )}
            </div>
          </div>
        </DashPortal>
      )}

      {/* rubber-band selection rectangle (fixed to viewport) */}
      {marquee.active && (
        <DashPortal>
          <div className="dc-DashboardView"><div className="marquee" style={{ left: marquee.l + 'px', top: marquee.t + 'px', width: marquee.w + 'px', height: marquee.h + 'px' }} /></div>
        </DashPortal>
      )}
      {/* post-release confirm CTA → convert the selected widgets into a group */}
      {showGroupCta && groupPicks.size > 0 && (
        <DashPortal>
          <div className="dc-DashboardView">
            <div className="group-cta">
              <span className="gc-count">{groupPicks.size} widget{groupPicks.size > 1 ? 's' : ''} selected</span>
              <button className="btn btn-sm btn-primary" onClick={createGroupFromPicks}>Create Group</button>
              <button className="btn btn-sm" onClick={clearPicks}>Cancel</button>
            </div>
          </div>
        </DashPortal>
      )}

      {/* Floating Add FAB (bottom-right) → slide-up: Generate with AI / Create Dashboard / Create Widget */}
      <div className="fab-wrap">
        {fabMenu && <div className="fab-backdrop" onClick={() => setFabMenu(false)} />}
        {fabMenu && (
          <div className="fab-menu fab-in">
            {/* compact outlined pills, a small glyph inline; AI keeps its gradient edge and violet label */}
            <button className="fab-opt ai" onClick={() => { setFabMenu(false); onCardAsk('createstart', 'Generate with AI'); }}>
              <Icon name="sparkles" size={18} /> Generate With AI
            </button>
            <button className="fab-opt" onClick={() => { setFabMenu(false); store.ui.cloneTarget = null; store.ui.editTarget = null; store.ui.createOpen = true; }}>
              <Icon name="layout" size={18} /> Create Dashboard
            </button>
            <button className="fab-opt" onClick={() => { setFabMenu(false); setAddToGroup(null); setShowAdd(true); }}>
              <Icon name="chart-bar" size={18} /> Create Widget
            </button>
            {gShowFabGroup && <button className="fab-opt" onClick={() => { setFabMenu(false); addEmptyGroup(); }}><Icon name="new-group" size={18} /> Empty Group</button>}
          </div>
        )}
        <button className={`fab ${fabMenu ? 'on' : ''}`} onClick={() => setFabMenu(!fabMenu)} title={fabMenu ? 'Close' : 'Add'} aria-label="Add">
          <Icon name={fabMenu ? 'x' : 'plus'} size={22} />
        </button>
      </div>

      {/* the docked assistant panel — the shared destination every entry opens into */}
      {store.ui.aiPanelOpen && (
        <DashPortal>
          <div className="dc-DashboardView">
            <div className="ai-dock">
              <AiAssistant ref={aiPanel} board={aiBoard} role={aiRole} open={store.ui.aiPanelOpen}
                onUpdateOpen={(v: boolean) => { store.ui.aiPanelOpen = v; }} onRole={setAiRole} />
            </div>
          </div>
        </DashPortal>
      )}

      {/* a group's time range — the same picker a widget and the topbar open */}
      {gdOpen && gdGroup && (
        <TimeRangePopover value={gdGroup.dateFilter} rect={gdRect}
          followLabel={gdGroup.dateFilter ? 'Follow dashboard filter' : null}
          note={`Applies to all ${tilesIn(gdGroup.id).length} widget${tilesIn(gdGroup.id).length === 1 ? '' : 's'} in “${gdGroup.name}”. A widget with its own range keeps it.`}
          onPick={pickGroupDate} onClear={clearGroupDate} onClose={() => setGdOpen(null)} />
      )}

      {showAdd && <AddWidgetModal d={d} group={addToGroup} onClose={() => { setShowAdd(false); setAddToGroup(null); }} onCreated={onWidgetCreated} onNewgroup={onNewGroup} />}
      {editTile && <WidgetBuilderModal d={d} type={typeForTile(editTile)} existing={editTile} onClose={() => setEditTile(null)} onSaved={onTileSaved} />}
      {/* Duplicate: builder pre-filled with the tile; save creates a new copy in place */}
      {dupTile && <WidgetBuilderModal d={d} type={typeForTile(dupTile)} existing={dupTile} duplicate onClose={() => setDupTile(null)} onDuplicated={onTileDuplicated} />}
      {showSchedule && <ScheduleDialog d={d} onClose={() => setShowSchedule(false)} />}
      {showHistory && <HistoryDialog d={d} onClose={() => setShowHistory(false)} />}
      {presenting && <PresentMode startId={d.id} onClose={() => setPresenting(false)} />}
    </div>
  );
}
