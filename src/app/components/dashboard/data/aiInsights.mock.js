/**
 * Mock insights for the AI-insights placement lab.
 *
 * Five grounded-looking insights, each tied to a real Helpdesk Overview widget by title.
 * The shared AiInsightsPanel renders these; selecting one expands its detail inline.
 *
 * Shape: { id, title, detail, widgetTitle, severity }
 *   title      — the one-line insight (sentence case, no trailing period)
 *   detail     — a single explanatory line, revealed when the row is expanded
 *   widgetTitle— the exact title of the widget it relates to (for the "from …" line)
 *   severity   — 'bad' | 'warn' | 'good' — drives the leading dot only, not the accent
 *
 * This is the ONLY data source for the panel — no API, no engine call. Swap or extend
 * these five entries and every variant updates together.
 */
export const AI_INSIGHTS = [
  {
    id: 'overdue-wow',
    title: 'Overdue requests up 14% week over week',
    detail: '18 open requests are past their SLA due date, up from 16 last week — the fastest-rising counter on the board.',
    widgetTitle: 'Overdue Requests',
    severity: 'bad',
  },
  {
    id: 'urgent-spike',
    title: 'Urgent open requests spiked 20%',
    detail: '6 urgent requests are open, well above the usual 4–5 — worth clearing before they age into breaches.',
    widgetTitle: 'Urgent Open Requests',
    severity: 'bad',
  },
  {
    id: 'pending-largest',
    title: 'Pending is the largest open state',
    detail: '30% of open requests sit in Pending — the biggest slice of the status mix, and where work is stalling.',
    widgetTitle: 'Open Requests By Status',
    severity: 'warn',
  },
  {
    id: 'tech-load',
    title: 'yash carries the heaviest technician load',
    detail: '34 open requests are assigned to yash — the top of the distribution and ~2× the team median.',
    widgetTitle: 'Open Requests By Technician',
    severity: 'warn',
  },
  {
    id: 'unassigned-easing',
    title: 'Unassigned queue is easing',
    detail: '12 requests await an owner, down 6% week over week — assignment is keeping pace with intake.',
    widgetTitle: 'Unassigned Requests',
    severity: 'good',
  },
]

// The lead insight (shown in the Variant A popover) and the "N more" remainder count.
export const leadInsight = AI_INSIGHTS[0]
export const insightCount = AI_INSIGHTS.length
