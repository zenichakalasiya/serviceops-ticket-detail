// Seed data for the ServiceOps Dashboards revamp prototype.
// Mock only — no backend. Shapes are intentionally close to the real module
// (KPI / Widget / Shortcut tiles; Public/Private/Restricted access; folders/categories).

let _id = 100
export const uid = (p = 'id') => `${p}-${++_id}`

const days = (n) => { const d = new Date(2026, 5, 27); d.setDate(d.getDate() - n); return d.toISOString() }

// ---- sample series helpers ----
const bars = (labels, vals) => ({ kind: 'bar', labels, series: [{ name: 'Tickets', values: vals }] })
const grouped = (labels, a, b) => ({ kind: 'bar', labels, series: [{ name: 'Created', values: a }, { name: 'Resolved', values: b }] })
const line = (labels, vals) => ({ kind: 'line', labels, series: [{ name: 'Volume', values: vals }] })
const area = (labels, vals) => ({ kind: 'area', labels, series: [{ name: 'Volume', values: vals }] })
const donut = (labels, vals) => ({ kind: 'donut', labels, series: [{ name: 'By priority', values: vals }] })

// A deliberately high-cardinality field: 63 technicians with a long tail.
// This is the shape that breaks legends (L105 / L166) — the legend demo needs it.
const FIRST = ['Aarav', 'Meera', 'Rohan', 'Priya', 'Vikram', 'Ananya', 'Karan', 'Divya', 'Arjun', 'Nisha',
  'Siddharth', 'Kavya', 'Rahul', 'Ishita', 'Manav', 'Sneha', 'Aditya', 'Pooja', 'Nikhil', 'Riya',
  'Varun', 'Tanvi', 'Harsh', 'Lakshmi']
const LAST = ['Sharma', 'Iyer', 'Patel', 'Nair', 'Reddy', 'Bose', 'Gupta', 'Menon', 'Rao', 'Shah', 'Verma']
function technicianLoad(n = 63) {
  const labels = [], values = []
  for (let i = 0; i < n; i++) {
    labels.push(`${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`)
    // Zipf-ish decay + a deterministic wobble, so a few carry most of the load.
    values.push(Math.max(1, Math.round(240 / (i + 1.6) + ((i * 37) % 11))))
  }
  // dedupe collisions from the name generator so keys stay unique
  const seen = new Map()
  const uniq = labels.map((l) => {
    const c = (seen.get(l) || 0) + 1; seen.set(l, c)
    return c > 1 ? `${l} (${c})` : l
  })
  return { kind: 'donut', labels: uniq, series: [{ name: 'Tickets', values }] }
}

// ---- tile factories ----
export const kpi = (title, value, unit, delta, status, info) =>
  ({ id: uid('t'), type: 'kpi', title, info, value, unit, delta, status, w: 3, h: 1 })
export const chart = (title, data, info) =>
  ({ id: uid('t'), type: 'chart', title, info, chart: data, w: 6, h: 2 })
export const shortcut = (title, columns, rows, info) =>
  ({ id: uid('t'), type: 'shortcut', title, info, columns, rows, w: 6, h: 2 })
// Free Text tile (§4 Free Text) — banner/annotation text, no data query. Wider than tall.
export const text = (title, content, info) =>
  ({ id: uid('t'), type: 'text', title, info, content, w: 4, h: 1 })


const WK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

// Mirrors the real ServiceOps "Helpdesk Dashboard" (predefined) from the .185 instance:
// 6 KPI counters, 3 grouped charts (Status · Priority · Technician), 3 record lists.
// The live instance is near-empty (one test request), so values here are representative
// ITSM figures while every widget's title, type and group-by matches the real board.
function helpdeskTiles() {
  const TECHS = ['yash', 'RW', 'Juli Gopani', 'Sakshi', 'ahmedraza', 'Rosy', 'Keya', 'Jerry', 'Stuti', 'Nikhil', 'Unassigned']
  return [
    { ...kpi('Overdue Requests', 18, '', { dir: 'up', pct: 14 }, 'bad', 'Open requests past their SLA due date.'), w: 2 },
    // `dateFilter` = this widget overrides the dashboard time filter with its own range,
    // and is the ONLY thing that puts a calendar on a tile header. Exactly two tiles carry
    // one — this KPI and the "Open Requests By Priority" widget — so the indicator reads as
    // the exception it is. Give a third tile one and the board stops telling you anything.
    { ...kpi('Requests Due In the 24 Hours', 24, '', { dir: 'up', pct: 9 }, 'warn', 'Open requests whose SLA due date falls within the next 24 hours.'), w: 2, dateFilter: 'Today' },
    { ...kpi('Open Requests', 248, '', { dir: 'up', pct: 4 }, 'warn', 'Count of requests in an open state.'), w: 2 },
    { ...kpi('Unassigned Requests', 12, '', { dir: 'down', pct: 6 }, 'warn', 'Open requests with no technician assigned.'), w: 2 },
    { ...kpi('My Open Requests', 9, '', { dir: 'up', pct: 3 }, 'good', 'Open requests assigned to me.'), w: 2 },
    { ...kpi('Urgent Open Requests', 6, '', { dir: 'up', pct: 20 }, 'bad', 'Open requests with priority Urgent.'), w: 2 },
    { ...chart('Open Requests By Status', { kind: 'donut', labels: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'], series: [{ name: 'Requests', values: [96, 54, 30, 42, 26] }] }, 'Open requests grouped by status.'), w: 4 },
    { ...chart('Open Requests By Priority', { kind: 'donut', labels: ['Low', 'Medium', 'High', 'Urgent'], series: [{ name: 'Requests', values: [120, 78, 34, 16] }] }, 'Open requests grouped by priority.'), w: 4, dateFilter: 'Last 7 days' },
    // Deliberately empty — this is the board's permanent demo of the empty-widget state
    // (see WidgetCard.vue's `tileState`/`WS`). Do not "fix" it by putting values back.
    { ...chart('Open Requests By Technician', { kind: 'hbar', labels: TECHS, series: [{ name: 'Total', values: [] }] }, 'Open requests grouped by assigned technician.'), w: 4 },
    /* The legend problem in the flesh: 63 technicians on a pie. Above HIGH_CARD the
     * tile switches to the rank pill (Top N · Bottom N · range · coverage · All) and
     * pages the side legend to whatever the widget's height can hold. See
     * docs/legend-and-topn-design.md. */
    { ...chart('Requests by Technician — full estate', technicianLoad(), 'Every request grouped by assigned technician — 63 of them. Use the rank pill to bound the list, and page through the rest.'), w: 4 },
    { ...shortcut('My Open Requests', ['Subject', 'Requester', 'Status', 'Priority'],
      [['VPN down for finance team', 'Arnav Desai', 'In Progress', 'Urgent'],
       ['Email delivery delayed', 'Sarah Chen', 'Open', 'High'],
       ['Payroll app 500 error', 'Neha Gupta', 'In Progress', 'High'],
       ['SSO login failing for HR', 'Rahul Shukla', 'Open', 'Medium'],
       ['Wi-Fi outage – Pune office', 'Karan Mehta', 'Open', 'High']],
      'Open requests assigned to me.'), w: 4,
      /* `total` is how many records the Shortcut's query matched; `rows` is the slice the
         tile carries. They differ in the real product — a Shortcut previews the first few
         records of a list that can run to hundreds — and the tile's footer states both.
         A tile without `total` falls back to rows.length. */
      total: 100 },
    { ...shortcut('My Open Tasks', ['Subject', 'Reference', 'Status', 'Priority'],
      [['Provision laptop for new joiner', 'TASK-3021', 'Open', 'Medium'],
       ['Review firewall change', 'TASK-3018', 'In Progress', 'High'],
       ['Patch database servers', 'TASK-3009', 'Open', 'Urgent']],
      'Tasks assigned to me that are open.'), w: 4, total: 24 },
    { ...shortcut('My Pending Approvals', ['Requester Name', 'Created Date', 'Subject', 'Type'],
      [['Priya Nair', '18 Jul 2026', 'New software purchase — Figma', 'Service Request'],
       ['Vikram Deshpande', '17 Jul 2026', 'Access to production DB', 'Change']],
      'Approval requests waiting on me.'), w: 4, total: 7 },
  ]
}
/* A COPY of Helpdesk Overview laid out in groups — the demo board for the grouping
 * features (sticky headers, the Groups navigator, header colours, Move to group). Same
 * thirteen widgets as the original, sorted by what they are about, each group in its own
 * header colour. The original board is left exactly as it is. */
function groupedHelpdesk() {
  const G = [
    { id: uid('g'), name: 'Request Counters', collapsed: false, dateFilter: null, style: { bg: 'Yellow' } },
    { id: uid('g'), name: 'Status & Priority', collapsed: false, dateFilter: null, style: { bg: 'Green' } },
    { id: uid('g'), name: 'Technician Load', collapsed: false, dateFilter: null, style: { bg: 'Blue' } },
    { id: uid('g'), name: 'My Worklists', collapsed: false, dateFilter: null, style: { bg: 'Orange' } },
  ]
  // helpdeskTiles() order: 6 counters · status + priority · the two technician charts · 3 lists
  const slot = (i) => (i < 6 ? 0 : i < 8 ? 1 : i < 10 ? 2 : 3)
  // `loaderDemo`: this one widget plays the Chart Morph loader (components/ui/ChartLoader)
  // before its data shows — on open, and again on every Refresh — so the loader can be
  // judged in place on a real board. Only on this copy; the original board is untouched.
  const base = helpdeskTiles().map((t, i) => ({ ...t, group: G[slot(i)].id, ...(t.title === 'Open Requests By Status' ? { loaderDemo: true } : {}) }))

  /* …then each group filled out to ten with a MIX of widget types, so the board shows the
     whole catalogue in context: counters, gauges, legacy charts (line · column · bar · pie
     · donut · area), the spec-driven kinds (stacked · grouped · multi-line · combo ·
     histogram · funnel · heatmap — these compute from the 48-record dataset in
     records.js), lists and notes. */
  const into = (gi, t) => ({ ...t, group: G[gi].id })
  const spec = (title, s, info, w) => ({ ...chart(title, { kind: s.kind, spec: { conds: [], ...s } }, info), w })
  const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const extra = [
    // ── Request Counters (Yellow): 6 counters + 3 more + a gauge ──
    into(0, { ...kpi('Resolved Today', 38, '', { dir: 'up', pct: 11 }, 'good', 'Requests resolved since midnight.'), w: 3 }),
    into(0, { ...kpi('SLA Compliance', 92, '%', { dir: 'up', pct: 2 }, 'good', 'Share of requests resolved within SLA.'), w: 3 }),
    into(0, { ...kpi('Reopened Requests', 7, '', { dir: 'up', pct: 17 }, 'warn', 'Resolved requests that were reopened.'), w: 3 }),
    into(0, spec('Open Request Load', { kind: 'gauge', measure: { mode: 'count', conds: [] }, gaugeMax: 60, warnAt: 30, badAt: 45, invert: false }, 'Open requests against the team’s comfortable load.', 3)),

    // ── Status & Priority (Green): 2 donuts + 8 ──
    into(1, spec('Status by Priority', { kind: 'stack', xDim: 'Priority', splitDim: 'Status' }, 'Each priority split into its statuses.', 4)),
    into(1, spec('Priority by Team', { kind: 'grouped', xDim: 'Team', splitDim: 'Priority' }, 'Priority mix, team by team.', 6)),
    into(1, spec('Request Lifecycle', { kind: 'funnel', stageField: 'Status' }, 'How far requests have progressed, as a share of all opened.', 6)),
    into(1, spec('Priority × Status', { kind: 'heatmap', heatX: 'Status', heatY: 'Priority', heatFn: 'Count' }, 'Where the work sits — darker cells hold more requests.', 6)),
    into(1, { ...chart('Requests by Category', bars(['Hardware', 'Software', 'Network', 'Access', 'Email'], [42, 58, 27, 35, 19]), 'Open requests grouped by category.'), w: 6 }),
    into(1, { ...chart('Requests by Source', { kind: 'pie', labels: ['Portal', 'Email', 'Phone', 'Chat'], series: [{ name: 'Requests', values: [112, 74, 38, 24] }] }, 'Where requests come in from.'), w: 4 }),
    into(1, { ...kpi('Escalated Requests', 11, '', { dir: 'up', pct: 8 }, 'bad', 'Open requests escalated to a higher tier.'), w: 4 }),
    into(1, { ...text('Status & Priority notes', '## Reading this group\nCounts are **open requests** unless a title says otherwise. The heatmap shows where *Urgent* work piles up.'), w: 4 }),

    // ── Technician Load (Blue): 2 technician charts + 8 ──
    into(2, { ...chart('Top Technicians (Resolved)', { kind: 'hbar', labels: ['Aarav Nair', 'Meera Verma', 'Rohan Gupta', 'Priya Patel', 'Vikram Shah', 'Ananya Bose'], series: [{ name: 'Resolved', values: [46, 38, 31, 27, 22, 19] }] }, 'Requests resolved per technician this period.'), w: 4 }),
    into(2, spec('Requests & Avg Resolution by Priority', { kind: 'combo', xDim: 'Priority', comboFn: 'Average', comboField: 'Resolution time' }, 'Bars count requests; the line is their average resolution time.', 6)),
    into(2, spec('Status by Team', { kind: 'multiline', xDim: 'Team', splitDim: 'Status' }, 'Each status as a line across the teams.', 6)),
    into(2, spec('Resolution Time Distribution', { kind: 'hist', histField: 'Resolution time', histBucket: 4 }, 'How long resolved requests took, in 4-hour buckets.', 6)),
    into(2, spec('Average CSAT', { kind: 'gauge', measure: { mode: 'aggregate', fn: 'Average', field: 'CSAT score', conds: [] }, gaugeMax: 5, warnAt: 3, badAt: 4, invert: true }, 'Average customer satisfaction on resolved requests.', 3)),
    into(2, { ...kpi('Active Technicians', 24, '', { dir: 'up', pct: 4 }, 'good', 'Technicians with at least one open assignment.'), w: 3 }),
    into(2, { ...kpi('Avg Load per Technician', 10.3, '', { dir: 'up', pct: 5 }, 'warn', 'Open requests per active technician.'), w: 3 }),
    into(2, { ...chart('Assignments per Day', line(WEEK, [42, 51, 47, 60, 55, 21, 18]), 'Requests assigned to technicians each day this week.'), w: 6 }),

    // ── My Worklists (Orange): 3 lists + 7 ──
    into(3, { ...shortcut('Recently Resolved by Me', ['Subject', 'Requester', 'Resolved'],
      [['Printer offline — 3rd floor', 'Kiran Rao', '2h ago'], ['Reset MFA for new laptop', 'Asha Menon', '5h ago'], ['Shared drive permissions', 'Dev Patel', 'Yesterday']],
      'Requests I resolved most recently.'), w: 6, total: 18 }),
    into(3, { ...shortcut('Breaching SLA Soon', ['Subject', 'Priority', 'Due in'],
      [['VPN down for finance team', 'Urgent', '35m'], ['Payroll app 500 error', 'High', '1h 20m'], ['SSO login failing for HR', 'Medium', '3h']],
      'My open requests closest to their SLA due time.'), w: 6, total: 6 }),
    into(3, { ...kpi('My Overdue', 2, '', { dir: 'down', pct: 33 }, 'bad', 'My requests past their SLA due date.'), w: 3 }),
    into(3, { ...kpi('Awaiting My Approval', 7, '', { dir: 'up', pct: 16 }, 'warn', 'Approval requests waiting on me.'), w: 3 }),
    into(3, { ...chart('My Resolved per Week', area(['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], [8, 11, 9, 14, 12, 15]), 'Requests I resolved each week.'), w: 6 }),
    into(3, { ...chart('My Requests by Status', donut(['Open', 'In Progress', 'Pending'], [5, 3, 1]), 'My open requests grouped by status.'), w: 4 }),
    into(3, { ...text('Worklist tip', 'Lists show the **first few records** — use *View all* on a list to open the full view.'), w: 4 }),
  ]
  return { groups: G, tiles: [...base, ...extra] }
}
function assetTiles() {
  return [
    kpi('Total Assets', 4820, '', { dir: 'up', pct: 2 }, 'good', 'All managed hardware + software assets.'),
    kpi('Out of Warranty', 312, '', { dir: 'up', pct: 6 }, 'warn', 'Hardware assets past warranty end date.'),
    kpi('Unassigned', 47, '', { dir: 'down', pct: 9 }, 'good', 'Assets with no assigned user.'),
    chart('Assets by Type', bars(['Laptop', 'Desktop', 'Server', 'Mobile', 'Network'], [2100, 1200, 320, 900, 300]), 'Hardware asset count by type.'),
    chart('Patch Compliance', donut(['Compliant', 'Pending', 'Failed'], [3800, 700, 320]), 'Endpoint patch status.'),
    { ...shortcut('Expiring Contracts',
      ['Contract', 'Vendor', 'Value', 'Expires'],
      [['CNT-118', 'Dell', '₹ 12.4L', '14 days'], ['CNT-094', 'Microsoft', '₹ 38.0L', '22 days']],
      'Contracts expiring within 30 days.'), total: 11 },
  ]
}
function execTiles() {
  return [
    kpi('MTTR', 6.4, 'h', { dir: 'down', pct: 7 }, 'good', 'Mean time to resolve this window.'),
    kpi('CSAT', 4.3, '/5', { dir: 'up', pct: 3 }, 'good', 'Average customer satisfaction.'),
    kpi('Backlog', 248, '', { dir: 'up', pct: 4 }, 'warn', 'Open request backlog.'),
    chart('Volume by Month', line(MON, [820, 910, 880, 1020, 990, 1040]), 'Total requests per month.'),
    chart('Requests by Team', bars(['Helpdesk', 'Network', 'Apps', 'Infra'], [420, 210, 300, 110]), 'Open requests by team.'),
  ]
}

// Mirrors the real custom "test 1" dashboard from the .185 instance (a user-built board):
// 10 mixed request/patch counters + one custom line chart ("t1"). Representative values.
function test1Tiles() {
  return [
    { ...kpi('Manual OS Deployments', 3, '', { dir: 'up', pct: 0 }, 'good', 'OS images deployed manually.'), w: 2 },
    { ...kpi('Closed Requests', 142, '', { dir: 'up', pct: 8 }, 'good', 'Requests closed in this window.'), w: 2 },
    { ...kpi('Resolution Violated Requests', 5, '', { dir: 'up', pct: 12 }, 'bad', 'Requests that breached their resolution SLA.'), w: 2 },
    { ...kpi('Completed Patch Deployment (Last 7 Days)', 12, '', { dir: 'up', pct: 15 }, 'good', 'Patch deployments completed in the last 7 days.'), w: 2 },
    { ...kpi('My Open Requests', 9, '', { dir: 'up', pct: 3 }, 'good', 'Open requests assigned to me.'), w: 2 },
    { ...kpi('Installed Patches', 98, '', { dir: 'up', pct: 6 }, 'good', 'Patches installed across the estate.'), w: 2 },
    { ...kpi('Patch Records Expiring This Week', 2, '', { dir: 'up', pct: 0 }, 'warn', 'Patch deployment records expiring within 7 days.'), w: 2 },
    { ...kpi('First Response Violated Requests', 4, '', { dir: 'up', pct: 9 }, 'bad', 'Requests that breached their first-response SLA.'), w: 2 },
    { ...kpi('Passcode-Based OS Deployments', 1, '', { dir: 'up', pct: 0 }, 'good', 'OS deployments using a passcode.'), w: 2 },
    { ...kpi('Open Requests', 248, '', { dir: 'up', pct: 4 }, 'warn', 'Requests in an open state.'), w: 2 },
    { ...chart('t1', line(MON, [12, 18, 15, 22, 19, 24]), 'Custom line chart.'), w: 8 },
  ]
}

// Mirrors the real custom "Vulnerability and Remediation Dashboard" from .185 — captured
// widget-by-widget via Customize: 6 patch/asset counters and 6 patch charts, each with its
// exact group-by dimensions (statuses, categories, severities). The live instance is a
// sparse test setup, so values are representative while every category/series matches.
function vulnRemediationTiles() {
  const DAYS = ['14 Jul', '15 Jul', '16 Jul', '17 Jul', '18 Jul', '19 Jul', '20 Jul']
  return [
    { ...kpi('Pending Patch Installations (Last 24 Hours)', 8, '', { dir: 'up', pct: 12 }, 'warn', 'Patch installations pending in the last 24 hours.'), w: 2 },
    { ...kpi('Failed Patch Installations (Last 24 Hours)', 3, '', { dir: 'up', pct: 0 }, 'bad', 'Patch installations that failed in the last 24 hours.'), w: 2 },
    { ...kpi('Successful Patch Installations (Last 24 Hours)', 42, '', { dir: 'up', pct: 9 }, 'good', 'Patch installations that succeeded in the last 24 hours.'), w: 2 },
    { ...kpi('Completed Patch Deployment (Last 7 Days)', 12, '', { dir: 'up', pct: 15 }, 'good', 'Patch deployments completed in the last 7 days.'), w: 2 },
    { ...kpi('Total Hardware Assets', 2, '', { dir: 'up', pct: 0 }, 'good', 'Managed hardware assets.'), w: 2 },
    { ...kpi('Vulnerable Assets', 5, '', { dir: 'up', pct: 20 }, 'bad', 'Assets with open vulnerabilities awaiting remediation.'), w: 2 },
    { ...chart('Patch Deployment Status Summary (Last 30 Days)', { kind: 'donut', labels: ['Draft', 'Ready to Deploy', 'In Progress', 'Completed', 'Expired', 'Canceled', 'Partial Completed'], series: [{ name: 'Deployments', values: [4, 2, 3, 8, 1, 1, 2] }] }, 'Patch deployments grouped by status over the last 30 days.'), w: 6 },
    { ...chart('Patch Category Distribution per Deployment (Last 7 Days)', { kind: 'bar', labels: ['Tools', 'Feature Packs', 'Service Packs', 'Update Rollups', 'Definition Updates', 'Critical Updates', 'Updates', 'Security Updates', 'Hotfix', 'Upgrades'], series: [{ name: 'Patches', values: [2, 1, 3, 4, 5, 7, 1, 6, 2, 1] }] }, 'Patches grouped by category across deployments in the last 7 days.'), w: 6 },
    { ...chart('Download Status for Last 24 Hours', { kind: 'bar', labels: ['Pending', 'In Progress (File Server)', 'In Progress (Distribution Server)', 'Success', 'Failed', 'Canceled', 'Failed (Check Sum)', 'Pending on DMZ'], series: [{ name: 'Downloads', values: [6, 3, 2, 28, 3, 1, 1, 2] }] }, 'Patch downloads grouped by status in the last 24 hours.'), w: 6 },
    { ...chart('Installation Status for Last 24 Hours', { kind: 'bar', labels: ['Yet To Receive', 'In Progress', 'Success', 'Failed', 'Canceled', 'Not Applicable', 'Not Ready', 'Partially Installed', 'Received', 'Resolving Dependency', 'Downloading', 'Download Success'], series: [{ name: 'Installations', values: [4, 5, 34, 3, 1, 6, 2, 2, 8, 1, 3, 12] }] }, 'Patch installations grouped by status in the last 24 hours.'), w: 6 },
    { ...chart('Daily Report for Severity Deployed Patch Count', { kind: 'bar', labels: DAYS, series: [
      { name: 'Critical', values: [0, 3, 0, 1, 0, 0, 2] },
      { name: 'Important', values: [0, 5, 0, 0, 0, 1, 0] },
      { name: 'Moderate', values: [0, 1, 0, 0, 0, 0, 0] },
      { name: 'Low', values: [0, 0, 0, 1, 0, 0, 0] },
      { name: 'Unspecified', values: [0, 8, 0, 0, 0, 0, 0] },
    ] }, 'Deployed patch count grouped by severity, per day.'), w: 8 },
    { ...chart('Daily Report for Patch Installation Task', { kind: 'line', labels: DAYS, series: [{ name: 'Tasks', values: [0, 5, 0, 0, 0, 0, 0] }] }, 'Patch installation tasks per day.'), w: 4 },
  ]
}

// demo tiles that showcase the empty-widget states (unconfigured / error / no-data)
function demoStateTiles() {
  return [
    { id: uid('t'), type: 'kpi', title: 'Draft KPI', info: 'Not wired to a data source yet.', state: 'unconfigured', value: null, w: 3, h: 1 },
    { id: uid('t'), type: 'chart', title: 'Revenue (load failed)', info: 'Simulated fetch error — hit Retry.', state: 'error', chart: bars(['A', 'B', 'C'], [12, 20, 8]), w: 6, h: 2 },
    shortcut('Escalations (empty)', ['ID', 'Subject', 'Status'], [], 'No records match this query in the current range.'),
  ]
}

// change/version history (per dashboard)
function demoHistory() {
  return [
    { event: 'Update Access Level', date: '2026-04-29', when: '29 Apr 2026 07:38 PM', module: 'Dashboard', user: 'Sakshi', summary: 'Access level updated from Public to Restricted.' },
    { event: 'Update Restricted Group', date: '2026-04-29', when: '29 Apr 2026 07:38 PM', module: 'Dashboard', user: 'Sakshi', summary: "For access level 'Restricted' updated groups to Service Desk." },
    { event: 'Add Widget', date: '2025-05-23', when: '23 May 2025 10:14 AM', module: 'Widget', user: 'Jeremy Draper', summary: 'Added widget “Created vs Resolved”.' },
    { event: 'Rename Dashboard', date: '2024-11-13', when: '13 Nov 2024 11:31 AM', module: 'Dashboard', user: 'Rakesh Rathod', summary: 'Renamed dashboard.' },
    { event: 'Update Access Level', date: '2024-11-13', when: '13 Nov 2024 11:29 AM', module: 'Dashboard', user: 'Rakesh Rathod', summary: 'Access level updated from Public to Restricted.' },
    { event: 'Create Dashboard', date: '2022-12-02', when: '02 Dec 2022 03:21 PM', module: 'Dashboard', user: 'Aarav Mehta', summary: 'Dashboard created.' },
  ]
}
// scheduled deliveries (per dashboard)
function demoSchedules() {
  return [
    { id: uid('sch'), name: 'Weekly SLA report', type: 'Weekly', timeFilter: 'This Week', enabled: true },
    { id: uid('sch'), name: 'Daily digest', type: 'Daily', timeFilter: 'Today', enabled: false },
  ]
}

const owners = ['Aarav Mehta', 'Priya Nair', 'Rohan Iyer', 'Sneha Patil', 'Vikram Deshpande']

export function seed() {
  const folders = [
    { id: 'f-lead', name: 'Leadership', color: '#7b68ee' },
    { id: 'f-noc', name: 'NOC / Ops', color: '#2f80ed' },
    { id: 'f-svc', name: 'Service Desk', color: '#1f9d63' },
    { id: 'f-mine', name: 'My drafts', color: '#d98a0b' },
  ]

  const dashboards = [
    { name: 'Helpdesk Overview', folder: 'f-svc', category: 'Service Desk', owner: 'Aarav Mehta', access: 'public', predefined: true, favorite: true, certified: true, description: 'Predefined service-desk board (mirrors ServiceOps “Helpdesk Dashboard”): request counters, status/priority/technician breakdowns, and my worklists.', tiles: helpdeskTiles(), updated: days(0) },
    { name: 'Executive Summary', folder: 'f-lead', category: 'Leadership', owner: 'Vikram Deshpande', access: 'restricted', predefined: true, favorite: true, description: 'Leadership KPIs — MTTR, CSAT, backlog and volume trends.', tiles: execTiles(), updated: days(1), sharedWithMe: true },
    { name: 'Asset & Patch Health', folder: 'f-noc', category: 'Assets', owner: 'Priya Nair', access: 'public', predefined: true, favorite: false, description: 'Hardware estate, warranty, patch compliance and expiring contracts.', tiles: assetTiles(), updated: days(2) },
    { name: 'Network NOC Wall', folder: 'f-noc', category: 'NOC', owner: 'Rohan Iyer', access: 'restricted', predefined: false, favorite: false, description: 'Operations wallboard for the network team.', tiles: helpdeskTiles().slice(0, 6), updated: days(3), sharedWithMe: true },
    { name: 'Helpdesk Dashboard - 02-12-2022', folder: null, category: '', owner: 'Sneha Patil', access: 'private', predefined: false, favorite: false, description: '', tiles: helpdeskTiles().slice(0, 4), updated: days(540), clone: true },
    { name: 'Asset', folder: null, category: '', owner: 'Sneha Patil', access: 'private', predefined: false, favorite: false, description: '', tiles: assetTiles().slice(0, 3), updated: days(120), clone: true },
    { name: 'test 1', folder: 'f-mine', category: '', owner: 'Aarav Mehta', access: 'private', predefined: false, favorite: false, description: 'Custom board (mirrors the “test 1” dashboard on the ServiceOps instance): mixed request/patch counters and a custom line chart.', tiles: test1Tiles(), updated: days(3), mine: true },
    { name: 'Vulnerability and Remediation Dashboard', folder: 'f-noc', category: 'Patch Management', owner: 'Aarav Mehta', access: 'public', predefined: false, favorite: false, description: 'Custom board (mirrors the “Vulnerability and Remediation Dashboard” on the ServiceOps instance): patch installation/deployment counters plus status, category and severity breakdowns.', tiles: vulnRemediationTiles(), updated: days(1), mine: true },
    { name: 'My SLA drafts', folder: 'f-mine', category: '', owner: 'Aarav Mehta', access: 'private', predefined: false, favorite: false, description: 'Work in progress — includes empty-widget state demos.', tiles: [...execTiles().slice(0, 3), ...demoStateTiles()], updated: days(5), mine: true },
    // a user's copy of Helpdesk Overview, organised into four coloured groups
    // a FIXED id: the generated ones shift whenever a seed gains a tile, and this board's
    // link gets shared (#/dashboard/d-grouped)
    { id: 'd-grouped', name: 'Helpdesk Overview (Grouped)', folder: 'f-svc', category: 'Service Desk', owner: 'Aarav Mehta', access: 'public', predefined: false, favorite: false, description: 'A copy of Helpdesk Overview organised into groups — counters, status & priority, technician load and my worklists — each with its own header colour.', ...groupedHelpdesk(), updated: days(0), mine: true },
  ].map((d, i) => ({
    // the landing board: the grouped copy of Helpdesk Overview (2026-09-24), so a first
    // visit opens on the grouping features; the original keeps everything else it had
    id: uid('d'), enabled: true, archived: false, default: d.name === 'Helpdesk Overview (Grouped)', groups: [],
    history: demoHistory(), schedules: demoSchedules(),
    mine: d.owner === 'Aarav Mehta', viewedAt: i < 3 ? days(i) : null, ...d,
    // Tag each tile's provenance so the dashboard can show a predefined / user / shared icon.
    //
    // `seeded` = this tile SHIPPED WITH a predefined dashboard, so it can't be
    // removed. It is deliberately NOT the same thing as `prov: 'predefined'`:
    //   · seeded predefined tile      → can't delete, restricted edit
    //   · predefined tile the USER added → CAN delete (they placed it), restricted edit
    //   · user tile the USER added       → can delete, full edit
    // Deletability follows who put the tile there; editability follows who owns
    // its definition. Conflating the two is what made the earlier board-level lock
    // wrong — it froze even the widgets the user had added themselves.
    tiles: d.tiles.map((t) => ({
      ...t,
      prov: t.prov || (d.predefined ? 'predefined' : d.sharedWithMe ? 'shared' : 'user'),
      ...(d.predefined && t.prov !== 'user' ? { seeded: true } : {}),
    })),
    // Technician Access Level + Technician Group Access Level (from .185 Manage list)
    techAccess: d.access === 'public' ? ['All technicians']
      : d.access === 'private' ? [d.owner]
      : ['Aarav Mehta', 'Rohan Iyer', 'Sneha Patil'],
    groupAccess: d.access === 'public' ? ['All technician groups']
      : d.access === 'private' ? []
      : ['Service Desk', 'Network Team'],
  }))

  // Library of reusable tiles for the Add-Widget flow
  const modules = ['Request', 'Asset', 'Problem', 'Change', 'Contract', 'Service Catalog']
  const lib = []
  /* Every library item now carries a `desc`, and every chart the `kind` it draws.

     Both exist because the Add-Widget listing shows them: the description sits under the
     title, where the "Widget · Request" line used to be, and the kind decides which chart
     artwork the row wears. A chart with no kind falls back to Column, so an item saved
     from the builder before this field existed still draws something sensible.

     Two items are deliberately left WITHOUT a description — `tete` and `ssss`, the
     junk-named pair. They are what proves the row survives a missing description, which is
     the ordinary case for anything a user saved in a hurry.

     The trailing positional args (fav, sharedAccess) became an options object on the way
     past four: `push(t, title, prov, mod, false, 'view', desc, kind)` is a line nobody can
     read, and half these calls only wanted the last argument. */
  const push = (type, title, prov, module, o = {}) => lib.push({
    id: uid('lt'), type, title, prov, module,
    favorite: !!o.fav, sharedAccess: o.sharedAccess || 'view',
    ...(o.desc ? { desc: o.desc } : {}), ...(o.kind ? { kind: o.kind } : {}),
  })
  // predefined
  push('kpi', 'Open Requests', 'predefined', 'Request', { fav: true, desc: 'Every request not yet resolved or closed, across all groups.' })
  push('kpi', 'SLA Compliance %', 'predefined', 'Request', { fav: true, desc: 'Share of requests resolved inside their SLA target this period.' })
  push('kpi', 'MTTR', 'predefined', 'Request', { desc: 'Mean time to resolve, measured from first assignment to resolution.' })
  push('kpi', 'Out-of-Warranty Assets', 'predefined', 'Asset', { desc: 'Assets whose warranty has lapsed but which are still in service.' })
  push('chart', 'Created vs Resolved', 'predefined', 'Request', { fav: true, kind: 'multiline', desc: 'Daily created against resolved volume — the backlog gap.' })
  push('chart', 'Tickets by Priority', 'predefined', 'Request', { kind: 'donut', desc: 'Open requests split by priority, P1 through P4.' })
  push('chart', 'Assets by Type', 'predefined', 'Asset', { kind: 'column', desc: 'Hardware, software and virtual assets by category.' })
  push('chart', 'Backlog Trend', 'predefined', 'Request', { kind: 'line', desc: 'Unresolved request count over the last 30 days.' })
  push('shortcut', 'My Open P1 Requests', 'predefined', 'Request', { fav: true, desc: 'P1 requests assigned to you, newest first.' })
  push('shortcut', 'Expiring Contracts', 'predefined', 'Contract', { desc: 'Contracts reaching end of term within the next 90 days.' })
  // user-defined (incl. some junk-named to show the predefined badge value)
  push('kpi', 'Network P1s', 'user', 'Request', { desc: 'P1 requests raised against the Network team.' })
  push('kpi', 'sla violetd', 'user', 'Request', { desc: 'Requests that breached their SLA target.' })
  push('chart', 'Changes by Risk', 'user', 'Change', { kind: 'column', desc: 'Change requests grouped by assessed risk level.' })
  push('chart', 'tete', 'user', 'Problem', { kind: 'bar' })
  push('kpi', 'ssss', 'user', 'Request')
  push('shortcut', 'Failing CIs', 'user', 'Asset', { desc: 'Configuration items reporting errors in the last 24 hours.' })
  // shared with me — 3 widgets + 1 KPI (owner grants View or Edit access)
  push('chart', 'Vendor Spend', 'shared', 'Contract', { kind: 'column', desc: 'Contract spend by vendor for the current financial year.' })
  push('chart', 'Change Success Rate', 'shared', 'Change', { sharedAccess: 'edit', kind: 'line', desc: 'Percentage of changes closed successfully, by month.' })
  push('chart', 'Asset Aging', 'shared', 'Asset', { kind: 'hist', desc: 'Assets bucketed by age since purchase date.' })
  push('kpi', 'Patch Compliance %', 'shared', 'Asset', { sharedAccess: 'both', desc: 'Endpoints running the latest approved patch level.' })

  return { folders, dashboards, library: lib, modules, owners }
}

export const ACCESS = {
  public: { label: 'Public', icon: 'globe', chip: 'chip-blue' },
  private: { label: 'Private', icon: 'lock', chip: 'chip' },
  restricted: { label: 'Restricted', icon: 'users', chip: 'chip-amber' },
}
export const CATEGORIES = ['Service Desk', 'Leadership', 'Assets', 'NOC', 'Security', 'Finance', 'Projects']
export const TILE_META = {
  kpi: { label: 'KPI', icon: 'kpi', desc: 'A headline number with target & delta' },
  chart: { label: 'Widget', icon: 'chart-bar', desc: 'A chart — line, bar, column or pie' },
  shortcut: { label: 'Shortcut', icon: 'table', desc: 'A record list / table' },
}
export const ASSET_TYPES = ['Hardware', 'Software', 'Non-IT', 'Consumable']
