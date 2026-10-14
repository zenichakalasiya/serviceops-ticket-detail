/**
 * rangeData — what a widget SHOWS once a group (or the widget itself) sets a time range.
 *
 * The prototype has no backend, so a range can't re-run a query. Instead the seeded data
 * is treated as the dashboard's default window and re-shaped deterministically for the
 * chosen one: counts scale with the window's length (a day holds far fewer tickets than
 * a quarter), every point gets its own small, stable wobble so the shape changes too, and
 * a record table keeps the share of its rows that the window would plausibly hold.
 * The same range always yields the same numbers, so switching back and forth is stable.
 *
 * Only the widget → group chain uses this. With no range set a widget shows its data as
 * seeded (the dashboard filter), exactly as before.
 */
import { windowFor } from './timeRanges.js'

const BASE_DAYS = 30 // the seeded data reads as "last 30 days"

// a stable 0..1 from a string — same range + same point → same wobble
function hash01(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 10000) / 10000
}

/** How much of the seeded window this range holds (count multiplier). null = no range. */
export function rangeK(range) {
  if (!range) return null
  const { start, end } = windowFor(range)
  const days = Math.max(1 / 24, (end - start) / 86400000)
  return Math.min(4, Math.max(0.06, days / BASE_DAYS))
}

/**
 * One value re-read for the range. Whole-number counts scale with the window; a rate,
 * duration or average (a unit, or a fraction) only wobbles — a percentage doesn't grow
 * because the window got longer.
 */
export function rangeValue(v, range, key = '', unit = '') {
  const k = rangeK(range)
  if (k == null || typeof v !== 'number') return v
  const wob = 0.82 + hash01(`${range}|${key}`) * 0.36 // ±18%
  const isCount = Number.isInteger(v) && !unit
  if (!isCount) {
    // keep the value's own precision, and a percentage can't pass 100
    const r = Number.isInteger(v) ? Math.round(v * wob) : Math.round(v * wob * 10) / 10
    return unit === '%' ? Math.min(100, r) : r
  }
  return Math.max(0, Math.round(v * k * wob))
}

/** A legacy series chart ({labels, series}) re-read for the range; the chart itself is not mutated. */
export function rangeChart(chart, range) {
  if (!chart || rangeK(range) == null || !Array.isArray(chart.series)) return chart
  return {
    ...chart,
    series: chart.series.map((s) => ({
      ...s,
      values: (s.values || []).map((v, i) => rangeValue(v, range, `${s.name}|${chart.labels?.[i] ?? i}`)),
    })),
  }
}

/** The rows a record table would hold for the range: a stable subset, never empty. */
export function rangeRows(rows, range) {
  const k = rangeK(range)
  if (k == null || !rows?.length || k >= 1) return rows
  const keep = Math.min(1, 0.25 + k * 1.1)
  const out = rows.filter((r, i) => hash01(`${range}|row${i}`) < keep)
  return out.length ? out : rows.slice(0, 1)
}
