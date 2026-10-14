// Shared by the Manage-all list and the Shortcut tables, so both filter the same way.
//
// A field is worth filtering ON only if its values REPEAT. A column of unique
// values (a ticket ID, a subject line) has as many options as rows, which is a
// list, not a filter — those stay reachable through search instead.
const MAX_OPTIONS = 25

export function fieldsFrom(columns, rows, { max = MAX_OPTIONS } = {}) {
  const n = rows.length
  return columns
    .map((label, i) => {
      const options = [...new Set(rows.map((r) => String(r[i] ?? '').trim()))].filter(Boolean).sort()
      return { key: String(i), label, options }
    })
    .filter((f) => {
      const k = f.options.length
      if (k < 2) return false           // one option matches every row — that filters nothing
      if (k > max) return false         // a haystack, not a filter
      // Every value distinct (an ID, a subject line) → the list IS the data. Picking
      // from it is just choosing rows by hand; that is what search is for.
      if (n > 2 && k === n) return false
      return true
    })
}

// values within a field are OR; fields are AND
export function matchesFilters(getValue, model) {
  return Object.entries(model).every(([key, picked]) =>
    !picked?.length || picked.includes(String(getValue(key) ?? '').trim()))
}

/* ---- typed conditions (the Requests-style filter bar) -------------------------
 * The condition builder offers EVERY column, not just the repeating ones.
 * fieldsFrom's rule — "a column of unique values is a list, not a filter" — was written
 * for a pick-from-values menu, where a 200-option list is useless. With a Contains
 * operator a free-text column is perfectly filterable, so the rule becomes a question of
 * WHICH OPERATORS a column gets, not whether it appears at all. */
export const TEXT_OPS = [
  { value: 'contains', label: 'Contains' },
  { value: 'ncontains', label: 'Does not contain' },
  { value: 'is', label: 'Is' },
  { value: 'isnot', label: 'Is not' },
]
export const ENUM_OPS = [
  { value: 'is', label: 'Is' },
  { value: 'isnot', label: 'Is not' },
]

export function conditionFields(columns, rows, { max = MAX_OPTIONS } = {}) {
  const n = rows.length
  return (columns || []).map((label, i) => {
    const options = [...new Set((rows || []).map((r) => String(r[i] ?? '').trim()))].filter(Boolean).sort()
    const k = options.length
    // enough repetition to pick from, and not simply one option per row
    const enumish = k >= 2 && k <= max && !(n > 2 && k === n)
    return { key: String(i), label, options: enumish ? options : [], type: enumish ? 'enum' : 'text' }
  })
}

/* One chip = one condition, and every chip must match (AND). WITHIN a chip several
 * picked values are OR for `is` and none-of for `is not` — which is exactly what "In"
 * and "Not In" mean, and why the chip relabels itself once it holds more than one. */
export function opLabelFor(cond, field) {
  const multi = (cond?.values || []).length > 1
  if (field?.type === 'enum') {
    return cond.op === 'isnot' ? (multi ? 'Not In' : 'is not') : (multi ? 'In' : 'is')
  }
  return (TEXT_OPS.find((o) => o.value === cond?.op) || {}).label || cond?.op || ''
}
export function condValueText(cond) {
  if (cond?.values?.length) return cond.values.join(', ')
  return cond?.value || ''
}
// a chip with nothing chosen yet filters nothing — it is still being built
export const condReady = (c) => !!(c?.values?.length || String(c?.value ?? '').trim())

export function matchesConds(getValue, conds, fields) {
  return (conds || []).every((c) => {
    if (!condReady(c)) return true
    const field = (fields || []).find((f) => f.key === c.key)
    const cell = String(getValue(c.key) ?? '').trim()
    if (field?.type === 'enum') {
      const hit = (c.values || []).includes(cell)
      return c.op === 'isnot' ? !hit : hit
    }
    const lc = cell.toLowerCase(), lv = String(c.value ?? '').trim().toLowerCase()
    if (c.op === 'ncontains') return !lc.includes(lv)
    if (c.op === 'is') return lc === lv
    if (c.op === 'isnot') return lc !== lv
    return lc.includes(lv)          // contains — the default
  })
}
