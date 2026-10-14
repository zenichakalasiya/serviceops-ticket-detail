// Curated demo board for the AI Capabilities showcase (/ai).
// Separate from the seeded dashboards so the AI demo is stable and the anomaly
// story is baked in. KPI tiles carry `history` (prior periods, oldest→newest,
// excluding the current value) so the deterministic engine can compute a z-score
// — the product's KPIs don't normally store this; it's what makes P3-B real.
import { kpi, chart, shortcut } from './mock.js'

const TECHS = ['yash', 'RW', 'Juli Gopani', 'Sakshi', 'ahmedraza', 'Rosy', 'Keya', 'Jerry', 'Stuti', 'Nikhil', 'Unassigned']

// The worklist — also the record source the Deep-dive drills into (tier-1 honest drill).
// "Due" drives breach-imminence facts; several P1s due today make the breach story.
const OPEN_ROWS = [
  ['VPN down for finance team', 'Arnav Desai', 'P1', 'In Progress', 'Today 4:00 PM'],
  ['Email delivery delayed', 'Sarah Chen', 'P1', 'Open', 'Today 6:00 PM'],
  ['Payroll app 500 error', 'Neha Gupta', 'P1', 'In Progress', 'Today 5:15 PM'],
  ['SSO login failing for HR', 'Rahul Shukla', 'P1', 'Open', 'Today 5:30 PM'],
  ['Printer fleet offline – 3rd floor', 'Karan Mehta', 'P2', 'Open', 'Tomorrow'],
  ['CRM API timeouts', 'Divya Rao', 'P1', 'In Progress', 'Today 7:00 PM'],
  ['Wi-Fi outage – Pune office', 'Ishita Bose', 'P1', 'Open', 'Today 8:00 PM'],
]

// Mirrors the real "Helpdesk Dashboard": 6 request counters, 3 grouped charts, 3 lists.
// KPI `history` (prior periods, oldest→newest) lets the engine compute a z-score anomaly.
export function demoBoard() {
  return {
    id: 'ai-demo',
    name: 'Helpdesk Overview',
    role: 'technician',
    tiles: [
      // Overdue: 18 against a ~11 baseline → a clear statistical outlier (the anomaly).
      { ...kpi('Overdue Requests', 18, '', { dir: 'up', pct: 64 }, 'bad', 'Open requests past their SLA due date.'),
        history: [9, 11, 10, 12, 11, 13, 10], metric: 'overdue', w: 2, h: 1 },
      { ...kpi('Requests Due In the 24 Hours', 24, '', { dir: 'up', pct: 9 }, 'warn', 'Open requests whose SLA due date falls within the next 24 hours.'),
        history: [20, 22, 19, 23, 21, 22, 21], metric: 'due24', w: 2, h: 1 },
      // Open Requests: gently up, in-pattern → NOT an anomaly.
      { ...kpi('Open Requests', 248, '', { dir: 'up', pct: 4 }, 'warn', 'Count of requests in an open state.'),
        history: [236, 241, 238, 245, 240, 244, 239], metric: 'open', w: 2, h: 1 },
      { ...kpi('Unassigned Requests', 12, '', { dir: 'down', pct: 6 }, 'warn', 'Open requests with no technician assigned.'),
        history: [15, 14, 13, 14, 13, 12, 13], metric: 'unassigned', w: 2, h: 1 },
      { ...kpi('My Open Requests', 9, '', { dir: 'up', pct: 3 }, 'good', 'Open requests assigned to me.'), metric: 'mine', w: 2, h: 1 },
      { ...kpi('Urgent Open Requests', 6, '', { dir: 'up', pct: 20 }, 'bad', 'Open requests with priority Urgent.'), metric: 'urgent', w: 2, h: 1 },
      // --- charts ---
      { ...chart('Open Requests By Status', { kind: 'donut', labels: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'], series: [{ name: 'Requests', values: [96, 54, 30, 42, 26] }] }, 'Open requests grouped by status.'), w: 4, h: 2 },
      { ...chart('Open Requests By Priority', { kind: 'donut', labels: ['Low', 'Medium', 'High', 'Urgent'], series: [{ name: 'Requests', values: [120, 78, 34, 16] }] }, 'Open requests grouped by priority.'), w: 4, h: 2 },
      { ...chart('Open Requests By Technician', { kind: 'hbar', labels: TECHS, series: [{ name: 'Total', values: [34, 28, 22, 19, 17, 14, 12, 9, 7, 5, 12] }] }, 'Open requests grouped by assigned technician.'), w: 4, h: 2 },
      // --- worklists (first one is the drill/breach source) ---
      { ...shortcut('My Open Requests', ['Subject', 'Requester', 'Priority', 'Status', 'Due'], OPEN_ROWS, 'Open requests assigned to me.'), w: 4, h: 2 },
      { ...shortcut('My Open Tasks', ['Subject', 'Reference', 'Status', 'Priority'], [['Provision laptop for new joiner', 'TASK-3021', 'Open', 'Medium'], ['Review firewall change', 'TASK-3018', 'In Progress', 'High']], 'Tasks assigned to me that are open.'), w: 4, h: 2 },
      { ...shortcut('My Pending Approvals', ['Requester Name', 'Created Date', 'Subject', 'Type'], [['Priya Nair', '18 Jul 2026', 'New software purchase — Figma', 'Service Request']], 'Approval requests waiting on me.'), w: 4, h: 2 },
    ],
  }
}
