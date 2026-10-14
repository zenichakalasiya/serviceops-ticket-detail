/* The one list of quick ranges, and the one function that turns a range into a real
 * window. Both the topbar's global Time Filter and a widget's own date override read
 * from here.
 *
 * They used to keep separate lists: the topbar offered minutes and hours, the widget
 * offered only whole days. Giving the widget the topbar's popover without this would
 * have let a user pick "Last 1 hour" on a tile and silently get a whole day, because
 * the widget's own switch had no case for it and fell through to Today. A picker that
 * offers a range it cannot honour is worse than one that never offered it.
 */

export const QUICK = [
  { k: 'last5m', label: 'Last 5 minutes', mins: 5 },
  { k: 'last15m', label: 'Last 15 minutes', mins: 15 },
  { k: 'last30m', label: 'Last 30 minutes', mins: 30 },
  { k: 'last1h', label: 'Last 1 hour', mins: 60 },
  { k: 'last3h', label: 'Last 3 hours', mins: 180 },
  { k: 'last6h', label: 'Last 6 hours', mins: 360 },
  { k: 'last12h', label: 'Last 12 hours', mins: 720 },
  { k: 'last24h', label: 'Last 24 hours', mins: 1440 },
  { k: 'last2d', label: 'Last 2 days', days: 2 },
  { k: 'last7', label: 'Last 7 days', days: 7 },
  { k: 'last30', label: 'Last 30 days', days: 30 },
  { k: 'today', label: 'Today', days: 0 },
  { k: 'yesterday', label: 'Yesterday', days: 1, only: true },
  { k: 'week', label: 'This week', to: 'week' },
  { k: 'month', label: 'This month', to: 'month' },
  { k: 'qtr', label: 'This quarter', to: 'qtr' },
  { k: 'ytd', label: 'Year to date', to: 'ytd' },
]

const BY_LABEL = new Map(QUICK.map((q) => [q.label, q]))
// a widget stores an absolute range as "DD/MM/YY – DD/MM/YY"
const ABS_RE = /^(\d{2})\/(\d{2})\/(\d{2})\s*[–-]\s*(\d{2})\/(\d{2})\/(\d{2})$/

/** Resolve a stored range (a QUICK label, or an absolute "DD/MM/YY – DD/MM/YY") to a
 *  real {start, end}. Every caller goes through this, so a named range and a custom one
 *  can never drift apart. */
export function windowFor(range) {
  const now = new Date()
  const m = ABS_RE.exec(range || '')
  if (m) {
    const s = new Date(2000 + +m[3], +m[2] - 1, +m[1]); s.setHours(0, 0, 0, 0)
    const e = new Date(2000 + +m[6], +m[5] - 1, +m[4]); e.setHours(23, 59, 0, 0)
    return { start: s, end: e }
  }
  const q = BY_LABEL.get(range)
  // a sub-day range is measured back from NOW, not from midnight — "Last 1 hour" at
  // 09:20 means 08:20→09:20, and rounding it to a day would be a different question
  if (q?.mins) return { start: new Date(now.getTime() - q.mins * 60000), end: now }

  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(); end.setHours(23, 59, 0, 0)
  if (!q) return { start, end }                       // unknown → today
  if (q.only) {                                        // Yesterday: that day alone
    start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1)
    return { start, end }
  }
  if (q.days) { start.setDate(start.getDate() - q.days); return { start, end } }
  switch (q.to) {
    // ISO weeks start Monday; getDay() is 0 on Sunday, which would jump a whole week
    case 'week': start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1)); break
    case 'month': start.setDate(1); break
    case 'qtr': start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1); break
    case 'ytd': start.setMonth(0, 1); break
    default: break                                     // Today
  }
  return { start, end }
}

const MIN = 60000, HOUR = 3600000, DAY = 86400000

/** How far back this range reaches, in words — 'today', '3 hours ago', '7 days ago',
 *  '2 months ago'. This answers the question the calendar icon raises; the range's
 *  proper name ("Last 30 days") is a label, not an answer. */
export function relativeFor(range) {
  const { start } = windowFor(range)
  const q = BY_LABEL.get(range)
  if (q?.mins) {
    if (q.mins < 60) return `${q.mins} min ago`
    const h = Math.round(q.mins / 60)
    return `${h} hour${h > 1 ? 's' : ''} ago`
  }
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.round((midnight - start) / DAY))
  if (!days) return 'today'
  if (days === 1) return '1 day ago'
  // past ~6 weeks a day count stops being readable — "2 months ago" lands immediately
  if (days < 45) return `${days} days ago`
  const mo = Math.round(days / 30)
  return `${mo} month${mo > 1 ? 's' : ''} ago`
}

export const stampFor = (d) =>
  d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
