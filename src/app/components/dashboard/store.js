import { reactive, computed } from './reactivity.js'
import { toast as sonner } from 'sonner'
import { seed, uid, CATEGORIES } from './data/mock.js'

const data = seed()

export const store = reactive({
  folders: data.folders,
  dashboards: data.dashboards,
  library: data.library,
  modules: data.modules,
  owners: data.owners,
  categories: [...CATEGORIES],
  currentUser: 'Aarav Mehta',
  toasts: [],

  /* ── Global dashboard appearance ──────────────────────────────────────────────
   * ONE layout for every board this user opens. Layout used to be per-dashboard,
   * which meant setting your preferred density was a job you redid on each board
   * and could never finish — nine boards, nine copies of the same preference.
   *
   * A board may still override any of these (the Layout section in Edit Dashboard
   * writes the same field names onto the dashboard). Resolution is
   * `dashboard.<field> ?? store.layout.<field>`, so a board is "inherit" until
   * somebody deliberately makes it otherwise — which is what lets a NOC wallboard
   * be denser than a leadership summary without forcing everyone to choose.
   *
   * Sizes are the guide's integer type scale (§2), not the old 12.5/13.5. */
  layout: {
    titleSize: 'M',     // S 12px · M 13px · L 15px — the widget title
    cardPad: 12,        // padding inside a widget card
    hGap: 14,           // space between widgets, horizontally
    vGap: 14,           // …and vertically
    rowHeight: 140,     // one grid row
    boardMargin: 16,    // the board's own gutter against the app frame
  },
  ui: { createOpen: false, cloneTarget: null, editTarget: null, pendingAddWidget: false, irisAddWidget: false, theme: 'light', listingOpen: true, listingQuery: '', groupStyle: 1, listStyle: 1, legendStyle: 6,
    // AI entry-point demo: which surface reveals the AI Summary/Assistant, and whether the panel is open.
    // Entry ids live in src/data/aiEntries.js; one at a time, switched from the on-board demo bar.
    // aiAsk lets any component (topbar, a widget) request the panel run an intent — the board forwards it.
    aiEntry: 'card', aiPanelOpen: false, aiAsk: null,
    // AI-insights PLACEMENT demo (shown to management): which of the three entry placements
    // is live on the board — 'A' header chip · 'B' KPI-row card · 'C' banner (default/baseline).
    aiPlacement: 'A',
    // builder demo: which Manual / Query Based design is live — 'cards' (A) · 'banner' (D) · 'pill'
    modeUi: 'cards',
    // AI-insights placement lab: the shared panel's open + pinned state. Persists "per user"
    // via the store, the app's own mechanism (there is no localStorage layer anywhere).
    aiInsightsOpen: false, aiInsightsPinned: false,
    // Two-sidebar shell: which module the rail has selected, whether the rail shows labels,
    // and whether the listing sidebar is open. listingOpen already exists below.
    activeModule: 'dashboard', railExpanded: false, activeSub: null, activeView: null,
    // a widget TITLE the AI panel asked the board to spotlight (scroll + flash) while it
    // narrates the answer — so "investigate" points at the real tile instead of a table.
    aiHighlight: null,
    // { title, type } — a widget to scroll to and flash once the board has loaded
    focusTile: null,
    // guided spotlight tour of the revamped dashboard (top bar → "Take a tour")
    tourOpen: false,
    /* The layout drawer's open state, and the scope its opener MEANT. The two entries
     * are asking different questions: the board's ⋯ menu is about THAT board, the Manage
     * toolbar is about all of them — so each preselects its own answer rather than
     * making the user restate what they already said by choosing that entry.
     *   'this' → the open dashboard only   ·   'all' → the global layout */
    layoutOpen: false, layoutScope: 'all' },
  // global view-time controls (per the rebuilt Time Filter + Auto-Refresh)
  timeFilter: { preset: 'last30', label: 'Last 30 days', from: null, to: null },
  autoRefresh: { interval: 'off', label: 'Off' },
})

// ---------- getters ----------
// live = shown in the sidebar/nav → excludes archived AND unpublished (enabled === false)
export const live = computed(() => store.dashboards.filter((d) => !d.archived && d.enabled !== false))
// manageable = everything in the Manage page → excludes only archived (unpublished still listed)
export const manageable = computed(() => store.dashboards.filter((d) => !d.archived))
export const archived = computed(() => store.dashboards.filter((d) => d.archived))
export const favorites = computed(() => live.value.filter((d) => d.favorite))
export const recents = computed(() =>
  live.value.filter((d) => d.viewedAt).slice().sort((a, b) => (a.viewedAt < b.viewedAt ? 1 : -1)).slice(0, 6))

export const byId = (id) => store.dashboards.find((d) => d.id === id)
export const folderName = (id) => store.folders.find((f) => f.id === id)?.name || 'Unfiled'

// ---------- toasts ----------
let tId = 0
/* Toasts go through the PRODUCT's sonner toaster (success green / error red from theme.css), not
   the Dashboard's own stack — one toast language across the app. Same signature as before. */
export function toast(message, kind = 'info', action = null) {
  const opts = action ? { action: { label: action.label, onClick: () => action.fn?.() }, duration: 6000 } : { duration: 3200 }
  if (kind === 'success') sonner.success(message, opts)
  else if (kind === 'error' || kind === 'danger') sonner.error(message, opts)
  else sonner(message, opts)
}
export function dismissToast(id) { store.toasts = store.toasts.filter((t) => t.id !== id) }

/* ---------- layout editing ------------------------------------------------------
 *
 * The layout drawer previews on the REAL board — no scrim, so you judge spacing
 * against your own widgets rather than a mock. That is what makes Cancel a real
 * job: the board has already moved by the time you press it, so cancelling has to
 * put everything back exactly as it was.
 *
 * The snapshot covers every board, not just the one on screen. It's six numbers
 * each, and it means a board switch or a scope change mid-edit can't leave a
 * change stranded outside the undo.
 */

/* A global layout key and its per-dashboard counterpart — the EDITABLE ones only.
 * Only `titleSize` differs in name: a board has carried `headerFont` since before this
 * setting existed, and renaming a stored field to tidy a map would strand every board
 * that already has one.
 *
 * `cardPad` and `boardMargin` are deliberately absent. They still live in store.layout
 * and the board still renders from them; they are fixed product values now, not
 * settings, so nothing may pin, snapshot or reset them. */
export const LAYOUT_FIELD = {
  titleSize: 'headerFont', hGap: 'hGap', vGap: 'vGap', rowHeight: 'rowHeight',
}
export const LAYOUT_KEYS = Object.keys(LAYOUT_FIELD)
export const LAYOUT_DEFAULTS = { titleSize: 'M', hGap: 14, vGap: 14, rowHeight: 140 }

let layoutSnap = null

export function beginLayoutEdit() {
  layoutSnap = {
    global: { ...store.layout },
    scope: store.ui.layoutScope,
    // `undefined` here is meaningful — it records "this board had NO override",
    // which cancel must restore by deleting the key, not by writing undefined into it
    boards: store.dashboards.map((d) => [d, LAYOUT_KEYS.map((k) => d[LAYOUT_FIELD[k]])]),
  }
}

export function commitLayoutEdit() { layoutSnap = null }

/* Reading and writing a layout value under whichever scope is in force. These live
 * here, not in the panel, because the drawer's HEADER drives Reset while the panel
 * body drives the sliders — two components, one set of rules. */
export const layoutValue = (dash, k) =>
  (store.ui.layoutScope === 'all' || !dash ? store.layout[k] : (dash[LAYOUT_FIELD[k]] ?? store.layout[k]))

/* Opening the drawer must not, on its own, pin the board — that would make merely
 * LOOKING at the settings an edit. The board is pinned lazily, on the first real
 * change, and then pinned COMPLETELY: all six fields, not only the one being moved.
 * Half-pinning would leave the untouched fields still following the global, so a
 * later global change would drift a board somebody had deliberately scoped. */
function pinBoardLayout(dash) {
  LAYOUT_KEYS.forEach((k) => { if (dash[LAYOUT_FIELD[k]] == null) dash[LAYOUT_FIELD[k]] = store.layout[k] })
}
export function setLayoutValue(dash, k, v) {
  if (store.ui.layoutScope === 'all') { store.layout[k] = v; return }
  if (!dash) return
  pinBoardLayout(dash)
  dash[LAYOUT_FIELD[k]] = v
}

export const isLayoutDefault = (dash) => LAYOUT_KEYS.every((k) => layoutValue(dash, k) === LAYOUT_DEFAULTS[k])
// part of the draft, so Cancel undoes a Reset too
export function resetLayoutValues(dash) { LAYOUT_KEYS.forEach((k) => setLayoutValue(dash, k, LAYOUT_DEFAULTS[k])) }

export function cancelLayoutEdit() {
  if (!layoutSnap) return
  Object.assign(store.layout, layoutSnap.global)
  layoutSnap.boards.forEach(([d, vals]) => {
    LAYOUT_KEYS.forEach((k, i) => {
      const f = LAYOUT_FIELD[k]
      if (vals[i] === undefined) delete d[f]
      else d[f] = vals[i]
    })
  })
  store.ui.layoutScope = layoutSnap.scope
  layoutSnap = null
}

// ---------- dashboard actions ----------
export function toggleFavorite(d) {
  d.favorite = !d.favorite
  toast(d.favorite ? `Added “${d.name}” to Favorites` : `Removed “${d.name}” from Favorites`)
}
export function markDefault(d) {
  store.dashboards.forEach((x) => (x.default = false))
  d.default = true
  toast(`“${d.name}” is now your default dashboard`)
}
/* Predefined dashboards ship with the product. They cannot be archived or deleted,
 * and nothing can be removed from them — only added. The UI hides these actions;
 * these guards make sure a stray call can't route around it. */
export function archiveDashboard(d) {
  if (d.predefined) { toast(`“${d.name}” is a predefined dashboard — it can't be deleted`, 'warn'); return false }
  d.archived = true
  // archived boards live in Manage dashboards → Archive, where they can be restored or deleted permanently
  toast(`Archived “${d.name}” — it’s in the Archive tab`, 'warn', { label: 'Open Archive', fn: () => { location.hash = '#/dashboards?tab=archive' } })
  return true
}
export function restoreDashboard(d) {
  d.archived = false
  toast(`Restored “${d.name}”`, 'success')
}
// Enable/disable toggle = Published / Unpublished. Unpublished dashboards drop out of
// the sidebar (live) and shared technicians lose access until republished.
export function togglePublished(d) {
  d.enabled = d.enabled === false
  if (d.enabled) toast(`Published “${d.name}” — it's visible again`, 'success')
  else toast(`Unpublished “${d.name}” — hidden from listings; shared people can no longer access it`, 'warn')
}
/* Bulk publish / unpublish. Reports what it actually did rather than what was
 * selected — quietly doing nothing to the already-published ones would leave the
 * user unsure whether the action fired at all. */
export function setPublished(list, on) {
  const changed = list.filter((d) => (d.enabled !== false) !== on)
  changed.forEach((d) => { d.enabled = on })
  if (!changed.length) { toast(`Already ${on ? 'published' : 'unpublished'}`, 'warn'); return }
  const n = changed.length
  toast(
    on
      ? `Published ${n} dashboard${n > 1 ? 's' : ''} — visible again`
      : `Unpublished ${n} dashboard${n > 1 ? 's' : ''} — hidden from listings; shared people lose access`,
    on ? 'success' : 'warn',
  )
}

export function moveDashboardsToCategory(list, category) {
  list.forEach((d) => (d.category = category))
  toast(`Moved ${list.length} dashboard${list.length > 1 ? 's' : ''} to “${category || 'Uncategorized'}”`, 'success')
}
export function archiveMany(list) {
  // bulk is the easiest way to route around a per-row rule — skip predefined boards
  // and SAY SO, rather than silently archiving fewer than the user selected
  const locked = list.filter((d) => d.predefined)
  const ok = list.filter((d) => !d.predefined)
  ok.forEach((d) => (d.archived = true))
  if (ok.length) toast(`Archived ${ok.length} dashboard${ok.length > 1 ? 's' : ''}`, 'warn')
  if (locked.length) toast(`Skipped ${locked.length} predefined dashboard${locked.length > 1 ? 's' : ''} — they can't be deleted`, 'warn')
}
// which live dashboards contain a widget/KPI/shortcut like this library item (title+type)
export function libUsage(lt) {
  return live.value.filter((d) => (d.tiles || []).some((t) => t.title === lt.title && t.type === lt.type))
}
// remove a placed tile matching this library item from a specific dashboard
export function removeTileFromDashboard(dash, lt) {
  const before = dash.tiles.length
  dash.tiles = dash.tiles.filter((t) => !(t.title === lt.title && t.type === lt.type))
  if (dash.tiles.length < before) { dash.updated = new Date().toISOString(); toast(`Removed “${lt.title}” from “${dash.name}”`, 'warn') }
}
export function deleteForever(d) {
  store.dashboards = store.dashboards.filter((x) => x.id !== d.id)
  toast(`Permanently deleted “${d.name}”`, 'danger')
}
export function cloneDashboard(d) {
  const copy = JSON.parse(JSON.stringify(d))
  copy.id = uid('d')
  copy.name = `Copy of ${d.name}`
  copy.predefined = false; copy.certified = false; copy.default = false
  copy.favorite = false; copy.clone = true; copy.clonedFrom = d.id
  copy.owner = store.currentUser; copy.mine = true
  copy.updated = new Date().toISOString(); copy.viewedAt = new Date().toISOString()
  copy.tiles = copy.tiles.map((t) => ({ ...t, id: uid('t') }))
  store.dashboards.unshift(copy)
  toast(`Cloned to “${copy.name}”`)
  return copy
}
/* ---- Rearrange: reset every tile to its default footprint, then pack gap-free.
 *
 * Default footprint is (rows : columns) on the 12-column grid —
 *   KPI 1:4 · Widget 2:4 · Shortcut 2:4
 * Uniform width means three tiles tile a row exactly.
 *
 * A row's height is set by its tallest tile (the grid uses align-items:start),
 * so a 1-row KPI beside a 2-row chart always leaves a dead cell underneath.
 * To leave *no* space, tiles are banded by height — KPIs first, then
 * charts/shortcuts, then anything full-width — and each band's rows are widened
 * to consume all 12 columns, which is what pushes the next band onto a fresh
 * row. Author order is preserved inside each band.
 *
 * The trade: a row that can't hold three tiles stretches the ones it has
 * (two tiles → 6 columns each) rather than keeping w=4 and leaving a hole.
 */
export const DEFAULT_SIZE = { kpi: { w: 4, h: 1 }, chart: { w: 4, h: 2 }, shortcut: { w: 4, h: 2 } }

// Split n tiles into rows. Three-up is the default (w=4); four-up when that
// divides evenly. A trailing row of one looks orphaned, so it borrows a tile
// from the row before it.
function rowsFor(n) {
  const perRow = n % 3 === 0 ? 3 : n % 4 === 0 ? 4 : 3
  const rows = []
  for (let i = 0; i < n; i += perRow) rows.push(Math.min(perRow, n - i))
  const last = rows.length - 1
  if (last > 0 && rows[last] === 1) { rows[last - 1] -= 1; rows[last] = 2 }
  return rows
}

// Every row must consume all 12 columns. Not just for looks: a band that ends
// mid-row lets the *next* band's first tile flow into the leftover columns, and
// a 1-row KPI beside a 2-row chart leaves a dead cell. Filling each row is what
// forces the next band onto a fresh row.
function widthsFor(len) {
  const base = Math.floor(12 / len), rem = 12 - base * len
  return Array.from({ length: len }, (_, i) => base + (i < rem ? 1 : 0))
}

export function rearrangeTiles(dash, groupId = null) {
  const inScope = (t) => (t.group ?? null) === groupId
  const scoped = dash.tiles.filter(inScope)
  if (scoped.length < 2) { toast('Nothing to rearrange here', 'warn'); return 0 }

  // 1. reset to the default footprint
  scoped.forEach((t) => {
    if (t.wide) { t.w = 12; t.h = 3; return }
    const s = DEFAULT_SIZE[t.type] || DEFAULT_SIZE.chart
    t.w = s.w; t.h = s.h
  })

  // 2. band by height (full-width tiles get their own band, always last)
  const bands = new Map()
  scoped.forEach((t) => {
    const k = t.wide ? 99 : t.h
    if (!bands.has(k)) bands.set(k, [])
    bands.get(k).push(t)
  })

  // 3. size each band row-by-row so every row is exactly 12 columns, then flatten
  const ordered = []
  for (const k of [...bands.keys()].sort((a, b) => a - b)) {
    const band = bands.get(k)
    if (k === 99) { ordered.push(...band); continue }   // full-width tiles own their row
    let i = 0
    for (const len of rowsFor(band.length)) {
      widthsFor(len).forEach((w) => { band[i++].w = w })
    }
    ordered.push(...band)
  }

  // 4. write the new order back into the same slots, leaving other groups untouched
  const next = ordered[Symbol.iterator]()
  dash.tiles = dash.tiles.map((t) => (inScope(t) ? next.next().value : t))

  dash.updated = new Date().toISOString()
  toast(`Rearranged ${scoped.length} widgets — Ctrl+Z to undo`, 'success')
  return scoped.length
}

export function addCategory(name) {
  const n = (name || '').trim()
  if (n && !store.categories.some((c) => c.toLowerCase() === n.toLowerCase())) store.categories.unshift(n)
  return n
}
export function createDashboard({ name, access, category, folder, description, techAccess, groupAccess, makeDefault, layout, layoutLock, tiles }) {
  const d = {
    id: uid('d'), name: name.trim(), access, category: category || '', folder: folder || null,
    description: description || '', owner: store.currentUser, mine: true, predefined: false,
    favorite: false, enabled: true, archived: false, default: false,
    tiles: tiles || [], groups: [], history: [], schedules: [], updated: new Date().toISOString(), viewedAt: new Date().toISOString(),
    techAccess: techAccess || (access === 'public' ? ['All technicians'] : access === 'private' ? [store.currentUser] : []),
    groupAccess: groupAccess || (access === 'public' ? ['All technician groups'] : []),
    // per-dashboard layout (from the create/clone panel)
    /* Layout fields are written ONLY when the creator set them. Left undefined, the
     * board inherits store.layout — so changing the global setting later moves this
     * board too, which is the whole point of a global setting. Writing defaults here
     * would have pinned every new board to 14/14/140 forever. */
    ...(layout?.headerFont ? { headerFont: layout.headerFont } : {}),
    ...(layout?.hGap != null ? { hGap: layout.hGap } : {}),
    ...(layout?.vGap != null ? { vGap: layout.vGap } : {}),
    ...(layout?.rowHeight != null ? { rowHeight: layout.rowHeight } : {}),
    // a per-dashboard freeze on widget position + size (create panel)
    layoutLock: layoutLock === true,
  }
  if (makeDefault) { store.dashboards.forEach((x) => (x.default = false)); d.default = true }
  store.dashboards.unshift(d)
  toast(`Created “${d.name}”`, 'success')
  return d
}
export function recordView(d) { if (d) d.viewedAt = new Date().toISOString() }

// ---------- tile actions ----------
import { kpi, chart, shortcut } from './data/mock.js'
const sampleFor = (libTile) => {
  const t = libTile.type
  if (t === 'kpi') return kpi(libTile.title, Math.floor(40 + Math.random() * 400), '', { dir: Math.random() > .5 ? 'up' : 'down', pct: +(Math.random() * 12).toFixed(1) }, ['good', 'warn', 'bad'][Math.floor(Math.random() * 3)], `${libTile.title} — from ${libTile.module}.`)
  if (t === 'chart') return chart(libTile.title, { kind: ['bar', 'line', 'donut'][Math.floor(Math.random() * 3)], labels: ['A', 'B', 'C', 'D'], series: [{ name: libTile.title, values: [12, 28, 19, 34].map((v) => v + Math.floor(Math.random() * 10)) }] }, `${libTile.title} — from ${libTile.module}.`)
  return shortcut(libTile.title, ['ID', 'Subject', 'Status'], [['REC-1', 'Sample record', 'Open'], ['REC-2', 'Another record', 'In Progress']], `${libTile.title} — from ${libTile.module}.`)
}
export function addTilesToDashboard(d, libTiles) {
  // carry the library item's provenance (predefined / user / shared) onto the placed tile
  libTiles.forEach((lt) => d.tiles.push({ ...sampleFor(lt), prov: lt.prov || 'user' }))
  d.updated = new Date().toISOString()
  toast(`Added ${libTiles.length} ${libTiles.length === 1 ? 'tile' : 'tiles'} to “${d.name}”`, 'success')
}
export function addBuiltTile(d, tile) {
  d.tiles.push(tile); d.updated = new Date().toISOString()
  toast(`Added “${tile.title}”`, 'success')
}
export function removeTile(d, tile) {
  // Only a SEEDED tile — one that shipped with a predefined dashboard — is
  // undeletable. A widget the user added to that board is theirs to remove,
  // predefined or not. (This used to refuse on the whole board, which froze the
  // user's own widgets along with the shipped ones.)
  if (tile.seeded) { toast(`“${tile.title}” ships with this dashboard — it can't be removed`, 'warn'); return false }
  d.tiles = d.tiles.filter((t) => t.id !== tile.id)
  toast(`Removed “${tile.title}”`)
  return true
}
export function toggleLibFavorite(lt) { lt.favorite = !lt.favorite }
export function duplicateLibTile(lt) {
  const copy = { ...lt, id: uid('lt'), title: `${lt.title} (copy)`, favorite: false }
  const i = store.library.findIndex((x) => x.id === lt.id)
  store.library.splice(i + 1, 0, copy)
  toast(`Duplicated “${lt.title}”`)
}
// soft-delete → Trash tab (reversible)
export function deleteLibTile(lt) { lt.trashed = true; toast(`Moved “${lt.title}” to Trash`, 'warn') }
export function restoreLibTile(lt) { lt.trashed = false; toast(`Restored “${lt.title}”`, 'success') }
export function removeLibTileForever(lt) {
  store.library = store.library.filter((x) => x.id !== lt.id)
  toast(`Permanently deleted “${lt.title}”`, 'danger')
}

export const MAX_BULK_ADD = 8 // bulk-add guardrail

// ---------- starter templates (ClickUp-style template gallery) ----------
const WK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
export const TEMPLATES = [
  { key: 'helpdesk', name: 'Helpdesk', icon: 'inbox', color: '#7b68ee', desc: 'Open volume, SLA, backlog & P1 worklist' },
  { key: 'sla', name: 'SLA & Performance', icon: 'trend', color: '#2f80ed', desc: 'Compliance, MTTR and backlog trend' },
  { key: 'asset', name: 'Asset Health', icon: 'grid', color: '#1f9d63', desc: 'Estate, warranty & patch compliance' },
  { key: 'exec', name: 'Executive', icon: 'sparkles', color: '#d98a0b', desc: 'Leadership KPIs and volume trends' },
  { key: 'blank', name: 'Start from scratch', icon: 'plus', color: '#71748a', desc: 'A blank canvas — add tiles yourself' },
]
export function seedTemplate(d, key) {
  const T = {
    helpdesk: () => [
      kpi('Open Tickets', 248, '', { dir: 'up', pct: 4 }, 'warn', 'Requests in an open state.'),
      kpi('Overdue', 31, '', { dir: 'up', pct: 12 }, 'bad', 'Past SLA due date.'),
      kpi('Resolved Today', 86, '', { dir: 'up', pct: 8 }, 'good', 'Resolved today.'),
      chart('Created vs Resolved', { kind: 'bar', labels: WK, series: [{ name: 'Created', values: [42, 51, 38, 60, 55] }, { name: 'Resolved', values: [39, 48, 41, 57, 50] }] }, 'Daily created vs resolved.'),
      chart('By Priority', { kind: 'donut', labels: ['P1', 'P2', 'P3', 'P4'], series: [{ name: 'Priority', values: [18, 64, 120, 46] }] }, 'Open by priority.'),
      shortcut('My Open P1s', ['ID', 'Subject', 'Status'], [['INC-2041', 'VPN down', 'In Progress'], ['INC-2038', 'Email delayed', 'Open']], 'My P1 requests.'),
    ],
    sla: () => [
      kpi('SLA Compliance', 94.2, '%', { dir: 'down', pct: 1.1 }, 'warn', 'Resolved within SLA.'),
      kpi('MTTR', 6.4, 'h', { dir: 'down', pct: 7 }, 'good', 'Mean time to resolve.'),
      chart('Compliance Trend', { kind: 'line', labels: MON, series: [{ name: 'SLA %', values: [91, 92, 90, 93, 94, 94] }] }, 'SLA % by month.'),
      chart('Backlog', { kind: 'line', labels: MON, series: [{ name: 'Backlog', values: [180, 210, 198, 240, 232, 248] }] }, 'Backlog at month end.'),
    ],
    asset: () => [
      kpi('Total Assets', 4820, '', { dir: 'up', pct: 2 }, 'good', 'All managed assets.'),
      kpi('Out of Warranty', 312, '', { dir: 'up', pct: 6 }, 'warn', 'Past warranty.'),
      chart('Assets by Type', { kind: 'bar', labels: ['Laptop', 'Desktop', 'Server', 'Mobile'], series: [{ name: 'Assets', values: [2100, 1200, 320, 900] }] }, 'By type.'),
      chart('Patch Compliance', { kind: 'donut', labels: ['Compliant', 'Pending', 'Failed'], series: [{ name: 'Patch', values: [3800, 700, 320] }] }, 'Patch status.'),
    ],
    exec: () => [
      kpi('MTTR', 6.4, 'h', { dir: 'down', pct: 7 }, 'good', 'Mean time to resolve.'),
      kpi('CSAT', 4.3, '/5', { dir: 'up', pct: 3 }, 'good', 'Satisfaction.'),
      kpi('Backlog', 248, '', { dir: 'up', pct: 4 }, 'warn', 'Open backlog.'),
      chart('Volume by Month', { kind: 'line', labels: MON, series: [{ name: 'Volume', values: [820, 910, 880, 1020, 990, 1040] }] }, 'Requests per month.'),
    ],
    blank: () => [],
  }
  const tiles = (T[key] || T.blank)()
  tiles.forEach((t) => d.tiles.push(t))
  d.updated = new Date().toISOString()
  if (tiles.length) toast(`Started from “${TEMPLATES.find((x) => x.key === key)?.name}” template`, 'success')
}
