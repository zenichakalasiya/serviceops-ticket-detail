/**
 * emptyStates.js — what a widget SAYS when it has nothing to draw.
 *
 * One table, two renderers: the real tile (`WidgetCard` → `WidgetEmpty`) and the
 * catalogue at /empty-states (removed 2026-09-29). A second copy of this wording is how the product and its
 * own reference page start out agreeing and stop three commits later.
 *
 * ── How the copy is written ─────────────────────────────────────────────────────
 * Two lines, and they have different jobs:
 *
 *   TITLE  names the absence in THIS chart's own terms. A funnel with no data has not
 *          "got no data", it has no stages; a gauge has nothing to measure; a pie has
 *          no shares to split. Naming the shape of the gap is what tells someone the
 *          widget is working and the period is simply quiet — the single most common
 *          misreading of an empty tile is "this is broken".
 *
 *   SUB    gives ONE next step, and only one the person can actually take from here.
 *          Two remedies exist and the split is deliberate:
 *            · time-shaped charts (line, gauge, funnel, histogram…) → widen the window,
 *              because their emptiness is nearly always the period being too short;
 *            · condition-shaped charts (bar, pie, heatmap, shortcut…) → widen the window
 *              OR ease a condition, because a filter that matches nothing is just as
 *              likely as a quiet week.
 *          Consistency here is a feature: one remedy learned once travels to every tile.
 *
 * No blame ("you have no data"), no jargon ("query returned 0 rows"), no apology for a
 * state that is usually correct. Nothing promises a fix the widget cannot perform.
 *
 * `art` is the ChartIcon name, which is NOT always the renderer's kind id: the product
 * calls the horizontal one Bar and the vertical one Column, the renderer calls them
 * 'hbar' and 'bar' (see data/chartTypes.js). Keeping the icon name in this table is what
 * stops that swap being re-derived — and re-derived wrongly — at the call site.
 */

/* Keyed by the RENDERER's kind id, the thing a tile actually stores in chart.kind. */
export const EMPTY_BY_KIND = {
  line: {
    art: 'line',
    title: 'No trend to plot yet',
    sub: 'Nothing was logged in this period. Try a longer time range.',
  },
  multiline: {
    art: 'multiline',
    title: 'No trends to compare',
    sub: 'None of these series have activity in this period. Try a longer time range.',
  },
  // 'hbar' is the product's Bar — horizontal, so it ranks.
  hbar: {
    art: 'bar',
    title: 'Nothing to rank yet',
    sub: 'No records matched, so there is nothing to line up. Widen the time range or ease a condition.',
  },
  // 'bar' is the product's Column — vertical, so it compares.
  bar: {
    art: 'column',
    title: 'Nothing to compare yet',
    sub: 'No records matched in this period. Widen the time range or ease a condition.',
  },
  pie: {
    art: 'pie',
    title: 'No breakdown to show',
    sub: 'Nothing matched, so there are no shares to split. Widen the time range or ease a condition.',
  },
  donut: {
    art: 'donut',
    title: 'No breakdown to show',
    sub: 'Nothing matched, so there are no shares to split. Widen the time range or ease a condition.',
  },
  stack: {
    art: 'stack',
    title: 'Nothing to stack yet',
    sub: 'No records matched, so there are no segments to build. Widen the time range or ease a condition.',
  },
  grouped: {
    art: 'grouped',
    title: 'No groups to compare',
    sub: 'No records matched in this period. Widen the time range or ease a condition.',
  },
  combo: {
    art: 'combo',
    title: 'No data to plot',
    sub: 'Neither the bars nor the line have anything in this period. Try a longer time range.',
  },
  gauge: {
    art: 'gauge',
    title: 'Nothing to measure yet',
    sub: 'This period has no readings to score against the target. Try a longer time range.',
  },
  hist: {
    art: 'hist',
    title: 'No distribution yet',
    sub: 'There are too few records in this period to sort into buckets. Try a longer time range.',
  },
  heatmap: {
    art: 'heatmap',
    title: 'No matrix to fill',
    sub: 'No records landed in any cell for this period. Widen the time range or ease a condition.',
  },
  funnel: {
    art: 'funnel',
    title: 'No stages to show',
    sub: 'Nothing entered this flow in the selected period. Try a longer time range.',
  },
  mapbubble: {
    art: 'mapbubble',
    title: 'No locations to plot',
    sub: 'No records in this period carry a site. Widen the time range, or check the site field is set.',
  },
}

/* Keyed by tile TYPE, for the two families that are not charts. A Free Text tile is
   deliberately absent: a note has no query and no time range, so an empty one is an
   empty note and FreeTextTile says so in its own words. */
export const EMPTY_BY_TYPE = {
  kpi: {
    art: 'kpi',
    title: 'Nothing to count yet',
    sub: 'No records match this KPI in the selected period.',
  },
  shortcut: {
    art: 'shortcut',
    title: 'No records to list',
    sub: 'Nothing matches these conditions right now. Widen the time range or ease a filter.',
  },
}

/* The two states that are NOT an empty period. They take a plain semantic glyph rather
   than the tile's chart artwork, because neither is about the shape of the widget —
   one is a system fault and the other is unfinished setup, and drawing a pie on either
   would say "your pie is empty" when the pie was never the problem. Each carries the
   one action that resolves it. */
export const EMPTY_BY_STATE = {
  error: {
    icon: 'alert',
    title: 'Couldn’t load this widget',
    sub: 'The data source didn’t respond. Try again in a moment.',
    action: 'retry',
  },
  unconfigured: {
    icon: 'settings',
    title: 'Not set up yet',
    sub: 'Choose a module and a measure, and this widget starts filling itself.',
    action: 'configure',
  },
}

/* The fallback is Column's, not a generic one: an unknown kind is far likelier to be a
   new cartesian chart than anything else, and a wrong-but-plausible shape costs less
   than "No data" with no shape at all. */
const FALLBACK = EMPTY_BY_KIND.bar

/**
 * The one resolver. `state` is WidgetCard's tileState — 'nodata' | 'error' |
 * 'unconfigured' — and only 'nodata' varies by what the tile draws.
 */
export function emptyStateFor(tile, state = 'nodata') {
  if (state !== 'nodata') return EMPTY_BY_STATE[state] || EMPTY_BY_STATE.error
  if (tile?.type === 'kpi') return EMPTY_BY_TYPE.kpi
  if (tile?.type === 'shortcut') return EMPTY_BY_TYPE.shortcut
  return EMPTY_BY_KIND[tile?.chart?.kind] || FALLBACK
}
