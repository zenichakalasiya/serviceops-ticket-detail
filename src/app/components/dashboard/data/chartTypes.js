/**
 * chartTypes.js — chart FAMILIES and the rules for converting within one.
 *
 * ── Why families ────────────────────────────────────────────────────────────────
 * A chart type is a way of DRAWING a configured dataset. Two types are
 * interchangeable when they read the same configuration — same dimensions, same
 * measure — so switching between them is a repaint, not a reconfiguration. That
 * relationship is what a family captures.
 *
 * It matters most on a PREDEFINED widget, where the configuration is not the user's
 * to edit: the only safe thing we can offer is "draw this same data differently".
 * Offering Heatmap next to Pie there would be offering a conversion that cannot
 * work, because the heatmap needs two dimensions the pie was never given.
 *
 * ── The groups, and which of them convert ───────────────────────────────────────
 * The picker shows five groups. Only TWO of them are convertible, and only within
 * themselves:
 *
 *   Statistics    Line · Bar · Column          ← interchangeable
 *   Coverage      Pie · Doughnut               ← interchangeable
 *   Multi-Series  Stacked · Grouped · Multi-line · Combo
 *   Advanced      Gauge · Histogram · Heatmap · Funnel
 *   Non-chart     KPI · Shortcut · Free Text
 *
 * Statistics all draw one categorical dimension against one measure, so a switch is
 * a repaint. Coverage's two differ only by an inner radius. Everything else is
 * frozen: each carries configuration nothing else reads — Grouped and Stacked look
 * closest, but they are offered as separate types precisely so the choice is made
 * once, at creation, rather than flipped afterwards.
 *
 * Freezing is expressed the same way throughout: a type in a family of ONE has
 * nothing to become. There is no separate "is it locked" flag to fall out of sync.
 */
import { NEW_KINDS } from './chartOptions.js'

/* Every chart kind, with the family it belongs to. `slice` marks part-of-whole:
 * those encode ONE series as shares, so a multi-series widget can't become one.
 *
 * A family of one is a frozen type. That is why Stacked, Grouped, Multi-line and
 * Combo each sit alone even though they are neighbours in the picker.
 *
 * `area` is deliberately absent. It is not offered anywhere and nothing seeds it;
 * listing it would have put a fourth conversion inside Statistics. Any legacy area
 * tile still RENDERS — this file only decides what a tile may convert to, and an
 * unknown kind resolves to frozen, which is the right answer for it. */
export const CHART_TYPES = [
  // ── Statistics — one category against one value, on an axis
  { id: 'line', label: 'Line', icon: 'chart-line', family: 'statistics', slice: false },
  { id: 'hbar', label: 'Bar', icon: 'chart-hbar', family: 'statistics', slice: false },
  { id: 'bar', label: 'Column', icon: 'chart-bar', family: 'statistics', slice: false },

  // ── Coverage — one series drawn as shares of a total
  { id: 'pie', label: 'Pie', icon: 'chart-pie', family: 'coverage', slice: true },
  { id: 'donut', label: 'Donut', icon: 'chart-donut', family: 'coverage', slice: true },

  // ── Multi-Series — each alone in its family, so each is frozen
  { id: 'stack', label: 'Stacked', icon: 'chart-stack', family: 'stacked', slice: false },
  { id: 'grouped', label: 'Grouped', icon: 'chart-grouped', family: 'grouped', slice: false },
  { id: 'multiline', label: 'Multi-line', icon: 'chart-multiline', family: 'multiline', slice: false },
  { id: 'combo', label: 'Combo', icon: 'chart-combo', family: 'combo', slice: false },

  // ── Advanced — likewise
  { id: 'gauge', label: 'Gauge', icon: 'chart-gauge', family: 'value', slice: false },
  { id: 'hist', label: 'Histogram', icon: 'chart-hist', family: 'distribution', slice: false },
  { id: 'heatmap', label: 'Heatmap', icon: 'chart-heatmap', family: 'matrix', slice: false },
  { id: 'funnel', label: 'Funnel', icon: 'chart-funnel', family: 'stages', slice: true },

  // withdrawn from the pickers; the renderer stays for tiles already built on it
  { id: 'mapbubble', label: 'Map Bubble', icon: 'chart-map', family: 'geo', slice: false },
]

/* `why` completes the sentence "…it <why>", printed when a widget can't convert. */
export const FAMILIES = {
  statistics: { label: 'Statistics', why: 'plots one category against one value, so they read the same configuration' },
  coverage: { label: 'Coverage', why: 'draws one series as shares of a total' },
  stacked: { label: 'Multi-Series', why: 'piles a second field on each category' },
  grouped: { label: 'Multi-Series', why: 'sets a second field side by side within each category' },
  multiline: { label: 'Multi-Series', why: 'plots one line per value of a second field' },
  combo: { label: 'Multi-Series', why: 'pairs a count with an aggregate on a second axis' },
  value: { label: 'Advanced', why: 'reduces the data to one number' },
  distribution: { label: 'Advanced', why: 'bins a numeric field into ranges' },
  matrix: { label: 'Advanced', why: 'crosses two dimensions into a grid' },
  stages: { label: 'Advanced', why: 'counts records reaching each stage of an ordered field' },
  geo: { label: 'Advanced', why: 'positions values on a map' },
}

const byId = new Map(CHART_TYPES.map((t) => [t.id, t]))
export const typeOf = (kind) => byId.get(kind) || null
export const familyOf = (kind) => byId.get(kind)?.family || null

/** Everything in the same family as this kind — the conversions worth offering. */
export function familyMembers(kind) {
  const fam = familyOf(kind)
  return fam ? CHART_TYPES.filter((t) => t.family === fam) : []
}

/**
 * A widget is FROZEN when it has no sibling to become.
 *
 * Note what this no longer says: it used to freeze every predefined non-bar/line
 * widget outright, which is why a predefined Pie could not become a Doughnut even
 * though that conversion changes nothing but an inner radius. Provenance is not the
 * question — whether the family has another member is.
 */
export function isFrozen(tile) {
  if (tile?.type && tile.type !== 'chart') return true
  return familyMembers(tile?.chart?.kind).length < 2
}

/** What the ⋯ menu / the builder's edit picker may offer: this kind's family. */
export function typesFor(tile) {
  if (isFrozen(tile)) return []
  return familyMembers(tile?.chart?.kind)
}

export function frozenReason(tile) {
  const t = typeOf(tile?.chart?.kind)
  if (!t) return 'This widget can’t be converted to another type'
  const fam = FAMILIES[t.family]
  return `A ${t.label} has no other type that reads the same configuration${fam ? ` — it ${fam.why}` : ''}`
}

/**
 * Why this specific widget can't become that type — null when it can.
 * Rendered as the disabled item's tooltip.
 */
export function whyDisabled(type, chart) {
  // Coverage can only show ONE series. Reachable now that Pie ↔ Doughnut is offered:
  // a two-series pie would have to drop a series to draw, which is data loss, not a
  // repaint. (The old needsSplit gate went with the families it guarded — Stacked and
  // Multi-line are no longer conversion targets, so nothing can ask for them.)
  if (type.slice) {
    const n = (chart?.series || []).length
    if (n > 1) return `${type.label} shows a single series — this widget plots ${n}`
  }
  return null
}

/* Kept for callers that still ask "is this one of the simple kinds?".
 * NEW_KINDS remains the authority for "is this spec-driven?" — see chartOptions.js. */
export const SWITCHABLE_KINDS = ['bar', 'hbar', 'line']
export { NEW_KINDS }

/* ── How the two pickers GROUP the types ─────────────────────────────────────────
 * The Create Widget card grid and the builder's Chart Type row (shown beside the live
 * preview while you configure) both render from this, so a type can't sit under
 * "Advanced" in one and "Multi-Series" in the other.
 *
 * The ids here are the PICKER's ids, not the kind ids used by CHART_TYPES above. The
 * two spaces genuinely differ: the product calls the horizontal one Bar and the
 * vertical one Column, while the renderer calls them 'hbar' and 'bar'. Mapping picker
 * id → kind stays in each component's own type table.
 *
 * Grouping is presentation. `family` above is what decides convertibility, and the two
 * are deliberately separate — Multi-Series reads as one group but each of its members
 * is frozen alone.
 */
/* Grouped by what a chart DOES, and ordered by COMMITMENT: the two convertible groups
   lead, so the choices you can still change your mind about come first; everything below
   Multi-Series is frozen once created. That ordering is the reason to keep the headings —
   flattened into one row, the picker stops telling you which choices are reversible and
   isFrozen() only speaks up after you have already committed.

   One list, two renderers: the Create Widget gallery and the builder's Chart Type row
   both read it, so they can never disagree about which kinds exist or where they sit. */
export const PICKER_GROUPS = [
  { cat: 'Statistics', ids: ['line', 'bar', 'column'] },
  { cat: 'Coverage', ids: ['pie', 'donut'] },
  { cat: 'Multi-Series', ids: ['stack', 'grouped', 'multiline', 'combo'] },
  { cat: 'Advanced', ids: ['gauge', 'hist', 'heatmap', 'funnel'] },
]

/** Slot a flat list of picker types into PICKER_GROUPS, dropping empty groups. */
export function groupPickerTypes(types) {
  return PICKER_GROUPS
    .map((g) => ({ cat: g.cat, types: g.ids.map((id) => types.find((t) => t.id === id)).filter(Boolean) }))
    .filter((g) => g.types.length)
}
