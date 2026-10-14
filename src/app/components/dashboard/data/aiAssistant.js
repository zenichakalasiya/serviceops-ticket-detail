/**
 * aiAssistant — the brain of the ONE unified AI Assistant.
 *
 * Everything the assistant can do (summarize · explain · investigate · build) is
 * a mode routed from a single input, so the four research problems (P1–P4) are
 * solved by one feature, not four surfaces. Grounded + no-LLM: a deterministic
 * layer (aiEngine) computes; this module only routes intent and maps a
 * description → widget spec against a governed catalog.
 */
import { anomalies } from './aiEngine.js'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

// Governed catalog (Q3) — the only fields the assistant may reference. Anything
// outside it is flagged, never invented.
export const CATALOG = ['Priority', 'Status', 'SLA', 'Team', 'Type', 'Backlog', 'Created date', 'Assignee', 'Module']

export const KINDS = [
  { id: 'bar', label: 'Column', icon: 'chart-bar' },
  { id: 'line', label: 'Line', icon: 'chart-line' },
  { id: 'donut', label: 'Doughnut', icon: 'chart-donut' },
]

// Suggested prompts — one per problem, so the demo shows one feature covering all four.
export const SUGGESTIONS = [
  { label: 'What needs my attention?', intent: 'summary' },
  { label: 'Why did Overdue spike?', intent: 'explain' },
  { label: 'Show the P1s breaching today', intent: 'drill' },
  { label: 'Create: SLA breaches this week by team', intent: 'create' },
]

// ---- intent routing (keyword-based; a small on-prem model swaps in later) ----
export function routeIntent(text) {
  const t = text.toLowerCase().trim()
  // these read like "summarise" but are different questions, so they go first
  if (/status (?:update|report)|draft an update|write an update|comms update/.test(t)) return 'status'
  if (/recovery plan|action plan|remediation plan|get (?:us |this )?back on track|plan to (?:fix|recover)/.test(t)) return 'plan'
  if (/work on first|start with|where do i start|what should i do first|order my|my queue/.test(t)) return 'worklist'
  // 'changes' had no rule at all — it only ever worked from a button
  if (/what.?s? changed|changed since|since (?:my )?last visit|what.?s new|any (?:new )?changes/.test(t)) return 'changes'
  // "create" must need a build verb — matching a bare "by priority" used to hijack
  // "explain the trend in Open Requests By Priority" into the widget builder.
  if (/^(create|build|make|add|generate|draft)\b|new widget|a widget|widget for|trend chart|chart (of|for)/.test(t)) return 'create'
  /* Intent comes from the VERB, not the topic. "overdue" and "breach" are subjects —
   * they appear just as often in "why did overdue spike" as in "show the overdue
   * list" — so matching them for drill hijacked every explain question about them.
   * Explain is checked first because its markers (why / explain / cause) are
   * unambiguous, and drill keeps only the words that genuinely ask to see records. */
  if (/\bwhy\b|explain|anomal|spike|spiked|surge|cause|\btrend\b|tell me about|break ?down/.test(t)) return 'explain'
  if (/investigate|\blist\b|\bshow\b|which|drill|\bp1\b|due today|records|top offenders|breaching today/.test(t)) return 'drill'
  /* "Summarise this dashboard" and "what needs attention" are different questions:
   * the first wants the written description, the second the ranked problem list.
   * Matching a bare "summar" for the latter answered the wrong one. */
  if (/summar(?:ise|ize|y)|describe this (?:dashboard|board)|overview of/.test(t)) return 'analyzing'
  if (/attention|focus|going on|what.?s wrong|needs? action|what.?s the status/.test(t)) return 'summary'
  return 'explain'   // a question about a widget explains it, rather than dumping a generic summary
}

// ---- explain / drill helpers: figure out which tile a prompt is about ----
export function tileFromText(board, text) {
  const t = (text || '').toLowerCase()
  // Prefer the MOST SPECIFIC title match: "Open Requests By Priority" must win over
  // "Open Requests", or explaining a chart silently explains the KPI beside it.
  const hits = board.tiles.filter((x) => x.title && t.includes(x.title.toLowerCase()))
  if (hits.length) return hits.sort((a, b) => b.title.length - a.title.length)[0]
  return board.tiles.find((x) => x.metric && t.includes(x.metric))
    || anomalies(board)[0]?.tile
    || board.tiles.find((x) => x.type === 'kpi')
}

/* Scope for the two universal CTAs (Deep dive · What needs attention).
 *
 * Deliberately NOT tileFromText: that one falls back to a best-guess tile, which would
 * silently scope a BOARD-level deep dive to whichever widget happened to match a word in
 * the sentence. Here an explicit title match is the only thing that counts — no title in
 * the text means the question is about the board. Longest match wins, so "Open Requests
 * By Priority" beats "Open Requests". */
export function tileFromTitle(board, text) {
  const t = (text || '').toLowerCase()
  const hits = (board?.tiles || []).filter((x) => x.title && t.includes(x.title.toLowerCase()))
  return hits.length ? hits.sort((a, b) => b.title.length - a.title.length)[0] : null
}

export function factFromText(board, text) {
  const t = (text || '').toLowerCase()
  if (/overdue|anomal|spike|spiked|surge/.test(t)) {
    const a = anomalies(board)[0]
    if (a) return { kind: 'anomaly', tileId: a.tile.id, chip: a.tile.title, text: a.anomaly.text, severity: a.anomaly.severity }
  }
  return { kind: 'breach', chip: 'My Open P1 Requests', text: 'P1 requests breaching SLA today', severity: 'bad' }
}

/* ============================================================================
 * resolveWidget — turn a plain description into a REAL, configured widget.
 *
 * Reads the module, the filters, the grouping dimension, the time window and the
 * form from the user's own words, then generates data shaped like that dimension
 * (a priority split descends; a month series trends; a team split is uneven).
 * Whatever it genuinely cannot infer comes back in `missing`, so the flow can ask
 * instead of guessing. Deterministic: the same sentence always builds the same
 * widget — a language model would only rephrase the title.
 * ========================================================================== */
export const GROUP_DIMS = [
  { id: 'priority', label: 'Priority', labels: ['Low', 'Medium', 'High', 'Urgent'] },
  { id: 'status', label: 'Status', labels: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'] },
  { id: 'team', label: 'Team', labels: ['Helpdesk', 'Network', 'Apps', 'Infra', 'Field Ops'] },
  { id: 'technician', label: 'Technician', labels: ['yash', 'Juli Gopani', 'ahmedraza', 'Keya', 'Stuti', 'Unassigned'] },
  { id: 'category', label: 'Category', labels: ['Hardware', 'Software', 'Network', 'Access', 'Email'] },
  { id: 'site', label: 'Site', labels: ['Ahmedabad', 'Pune', 'Bengaluru', 'Remote'] },
  { id: 'month', label: 'Month', labels: MON },
  { id: 'day', label: 'Day of week', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
]
const DIM_RE = {
  priority: /\bby priority|per priority|priority (?:split|breakdown|wise)|across priorit/i,
  status: /\bby status|per status|status (?:split|breakdown|wise)/i,
  team: /\bby team|per team|across teams|team ?wise|by group/i,
  technician: /\bby (?:technician|assignee|agent|engineer)|per (?:technician|assignee|agent)|who is working/i,
  category: /\bby category|per category|by type|category ?wise/i,
  site: /\bby (?:site|location|office|region)|per (?:site|location|office)/i,
  month: /\bby month|per month|monthly|over (?:the )?(?:last|past) \d+ months?|month ?wise|over time/i,
  day: /\bby day|per day|daily|day of week|weekday/i,
}
const MODULES = [
  { id: 'asset', label: 'Assets', re: /\basset|hardware|laptop|desktop|server|device|patch|vulnerab/i },
  { id: 'change', label: 'Changes', re: /\bchange|release|deploy|rollout/i },
  { id: 'problem', label: 'Problems', re: /\bproblem|root cause/i },
  { id: 'task', label: 'Tasks', re: /\btask/i },
  { id: 'request', label: 'Requests', re: /.*/ },
]
const FILTERS = [
  { re: /overdue|past due/i, word: 'Overdue', chip: { field: 'Due', op: 'is', value: 'Overdue' } },
  { re: /breach|\bsla\b/i, word: 'SLA-breaching', chip: { field: 'SLA', op: 'is', value: 'Breaching' } },
  { re: /unassigned|no owner|nobody/i, word: 'Unassigned', chip: { field: 'Assignee', op: 'is', value: 'Unassigned' } },
  { re: /\bp1\b|urgent|critical/i, word: 'Urgent', chip: { field: 'Priority', op: '=', value: 'Urgent' } },
  /* Priority LEVELS need the word "priority" nearby (or a P-code) — a bare "high" is
   * far more often "high volume" or "high risk" than a filter on the priority field. */
  { re: /\bp2\b|high[-\s]priority|priorit\w*\s+(?:is\s+|=\s*)?high/i, word: 'High-priority', chip: { field: 'Priority', op: '=', value: 'High' } },
  { re: /\bp3\b|medium[-\s]priority|priorit\w*\s+(?:is\s+|=\s*)?medium/i, word: 'Medium-priority', chip: { field: 'Priority', op: '=', value: 'Medium' } },
  { re: /\bp4\b|low[-\s]priority|priorit\w*\s+(?:is\s+|=\s*)?low/i, word: 'Low-priority', chip: { field: 'Priority', op: '=', value: 'Low' } },
  { re: /\bopen\b|outstanding|backlog/i, word: 'Open', chip: { field: 'Status', op: '=', value: 'Open' } },
  { re: /in[-\s]progress|being worked/i, word: 'In-progress', chip: { field: 'Status', op: '=', value: 'In Progress' } },
  { re: /\bpending\b|on hold|awaiting/i, word: 'Pending', chip: { field: 'Status', op: '=', value: 'Pending' } },
  { re: /escalat\w+/i, word: 'Escalated', chip: { field: 'Escalated', op: 'is', value: 'Yes' } },
  { re: /reopen\w*/i, word: 'Reopened', chip: { field: 'Reopened', op: 'is', value: 'Yes' } },
  { re: /resolved|closed|completed/i, word: 'Resolved', chip: { field: 'Status', op: '=', value: 'Resolved' } },
]
const WINDOWS = [
  { re: /today/i, value: 'Today' },
  { re: /this week|last 7 days/i, value: 'This week' },
  { re: /this month|last 30 days/i, value: 'Last 30 days' },
  { re: /(?:last|past) (\d+) months?/i, value: (m) => `Last ${m[1]} months` },
  { re: /this (?:quarter|year)/i, value: 'This year' },
]
// a stable pseudo-random from the text, so the same prompt always builds the same widget
function seedOf(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h }
function valuesFor(dimId, labels, seed) {
  const r = (i) => (seed >> (i % 11)) * (i + 7) % 97
  if (dimId === 'priority') return labels.map((_, i) => Math.max(6, 130 - i * 34 + (r(i) % 17)))
  if (dimId === 'status') return [96, 54, 30, 42, 26].map((v, i) => Math.max(5, v + (r(i) % 15) - 7))
  if (dimId === 'month' || dimId === 'day') {
    let v = 90 + (seed % 60)
    return labels.map((_, i) => { v = Math.max(12, v + ((r(i) % 29) - 12)); return v })
  }
  // team / technician / category / site — an uneven spread with a clear leader
  return labels.map((_, i) => Math.max(3, 62 - i * 8 + (r(i) % 21)))
}
function detectDim(t) { return GROUP_DIMS.find((d) => DIM_RE[d.id] && DIM_RE[d.id].test(t)) || null }
/* A form the user named OUTRIGHT, as opposed to one we inferred. Needed because
 * "add 4 KPIs: a, b, c, d" states the form once in the preamble — which the
 * splitter strips — so each item would otherwise fall back to a bar chart. */
export function explicitForm(text) {
  const t = String(text || '')
  if (/\bkpis?\b|headline|single number|\bcounters?\b/i.test(t)) return 'kpi'
  if (/\bshortcuts?\b|\btables?\b|\blists?\b|records|rows|worklist/i.test(t)) return 'shortcut'
  if (/\bline chart\b|\btrend line\b/i.test(t)) return 'line'
  if (/\bdoughnut\b|\bdonut\b|\bpie\b/i.test(t)) return 'donut'
  if (/\bbar chart\b/i.test(t)) return 'hbar'
  if (/\bcolumn chart\b/i.test(t)) return 'bar'
  return null
}
// how a KPI of each kind typically reads, so four counters don't all show 128
const KPI_SHAPE = {
  Overdue: { base: 14, spread: 26, status: 'bad', dir: 'up' },
  'SLA-breaching': { base: 8, spread: 18, status: 'bad', dir: 'up' },
  Unassigned: { base: 6, spread: 15, status: 'warn', dir: 'down' },
  Urgent: { base: 4, spread: 13, status: 'bad', dir: 'up' },
  'High-priority': { base: 22, spread: 34, status: 'warn', dir: 'up' },
  'Medium-priority': { base: 48, spread: 60, status: 'info', dir: 'up' },
  'Low-priority': { base: 60, spread: 80, status: 'good', dir: 'down' },
  'In-progress': { base: 40, spread: 55, status: 'info', dir: 'up' },
  Pending: { base: 12, spread: 28, status: 'warn', dir: 'up' },
  Escalated: { base: 5, spread: 14, status: 'bad', dir: 'up' },
  Reopened: { base: 3, spread: 11, status: 'bad', dir: 'up' },
  Open: { base: 160, spread: 130, status: 'warn', dir: 'up' },
  Resolved: { base: 90, spread: 110, status: 'good', dir: 'up' },
}
function kpiFacts(filters, seed) {
  const s = KPI_SHAPE[filters[0]?.word] || { base: 40, spread: 90, status: 'warn', dir: 'up' }
  return { value: s.base + (seed % s.spread), status: s.status, delta: { dir: s.dir, pct: 2 + (seed % 19) } }
}
function detectForm(t, dim) {
  if (/\bkpi\b|headline|how many|total number|single number|counter|^count\b/i.test(t)) return 'kpi'
  if (/\blist\b|\btable\b|records|rows|worklist|shortcut/i.test(t)) return 'shortcut'
  if (dim && (dim.id === 'month' || dim.id === 'day')) return 'line'
  if (/trend|over time|growth/i.test(t)) return 'line'
  if (/share|split|proportion|breakdown|percentage|pie|doughnut|donut/i.test(t)) return 'donut'
  if (dim && dim.id === 'priority') return 'donut'
  return 'bar'
}
export function resolveWidget(text, preferKind) {
  const t = String(text || '').trim()
  const mod = MODULES.find((m) => m.re.test(t))
  const filters = FILTERS.filter((f) => f.re.test(t))
  const dim = detectDim(t)
  const form = preferKind || detectForm(t, dim)
  const winHit = WINDOWS.find((w) => w.re.test(t))
  const win = winHit ? (typeof winHit.value === 'function' ? winHit.value(t.match(winHit.re)) : winHit.value) : null
  const measure = [...new Set(filters.map((f) => f.word))].join(' ')
  const subject = `${measure} ${mod.label}`.trim()
  const needsGroup = ['bar', 'hbar', 'line', 'donut'].includes(form)
  const missing = needsGroup && !dim ? ['groupBy'] : []
  /* A grouping only counts when the form can draw it. A KPI is one number and a record
   * list is rows, so neither carries "by team" into its title or its conditions — this
   * is what stops a form switch leaving behind config that describes the previous form. */
  const grouped = needsGroup && !!dim

  const chips = [
    { field: 'Module', op: '=', value: mod.label },
    ...filters.map((f) => f.chip),
    win ? { field: 'Created date', op: 'in', value: win } : null,
    grouped ? { field: 'Group by', op: '', value: dim.label } : null,
  ].filter(Boolean)

  const title = grouped
    ? `${subject} by ${dim.label.toLowerCase()}`
    : form === 'kpi' ? subject : `${subject}${win ? ` · ${win.toLowerCase()}` : ''}`

  const spec = {
    title, kind: form, module: mod.label, groupBy: grouped ? dim.id : null,
    window: win, filters, chips, missing,
    why: form === 'line' ? 'A line chart shows movement over time.'
      : form === 'donut' ? 'A doughnut shows parts of a whole.'
      : form === 'kpi' ? 'A single number, when the level is what matters.'
      : form === 'shortcut' ? 'The records themselves, as a list you can act on.'
      : 'A column chart compares one value across named groups.',
  }
  if (grouped) {
    const seed = seedOf(t + dim.id)
    spec.chart = { kind: form, labels: [...dim.labels], series: [{ name: subject || 'Count', values: valuesFor(dim.id, dim.labels, seed) }] }
    spec.total = spec.chart.series[0].values.reduce((a, b) => a + b, 0)
  }
  /* An ungrouped KPI still needs a believable number — one that DIFFERS per condition,
   * or four counters all read the same. It must NOT inherit a grouped total: "escalated
   * requests by team" as a KPI counts escalated requests, not every team's rows. */
  if (form === 'kpi') spec.kpi = kpiFacts(filters, seedOf(t))
  return spec
}
/* ----------------------------------------------------------------------------
 * proposeDashboard — the fast path. Rather than asking the user to describe every
 * widget one at a time, read the intent once and propose a whole coherent board
 * they can accept in a single click. Each proposed line is a real resolveWidget
 * spec, so accepting builds exactly what was previewed.
 * -------------------------------------------------------------------------- */
const BOARD_RECIPES = [
  {
    id: 'sla', re: /sla|breach|overdue|response time|escalat/i, category: 'Service Desk',
    items: ['overdue requests as a KPI', 'SLA breaching requests as a KPI', 'unassigned requests as a KPI',
      'SLA breaching requests by team', 'overdue requests by priority', 'a list of the SLA breaching records'],
  },
  {
    id: 'exec', re: /exec|leadership|cxo|board level|mttr|csat|kpi review/i, category: 'Leadership',
    items: ['open requests as a KPI', 'resolved requests as a KPI', 'overdue requests as a KPI',
      'open requests by month', 'resolved requests by team', 'open requests by priority'],
  },
  {
    id: 'asset', re: /asset|patch|hardware|vulnerab|inventory|compliance/i, category: 'Assets',
    items: ['assets as a KPI', 'unassigned assets as a KPI', 'assets by category',
      'assets by site', 'assets by month', 'a list of asset records'],
  },
  {
    id: 'noc', re: /noc|network|wallboard|uptime|availability|monitor/i, category: 'NOC',
    items: ['open requests as a KPI', 'urgent open requests as a KPI', 'open requests by status',
      'open requests by site', 'open requests by day', 'a list of the urgent open records'],
  },
  {
    id: 'workload', re: /workload|team|technician|assign|capacity|who/i, category: 'Service Desk',
    items: ['open requests as a KPI', 'unassigned requests as a KPI', 'open requests by technician',
      'open requests by team', 'overdue requests by technician', 'a list of unassigned records'],
  },
]
const DEFAULT_RECIPE = {
  id: 'general', category: 'Service Desk',
  items: ['open requests as a KPI', 'overdue requests as a KPI', 'unassigned requests as a KPI',
    'open requests by status', 'open requests by priority', 'a list of my open records'],
}
const VIZ_LABEL = { kpi: 'KPI', shortcut: 'Table', bar: 'Column', hbar: 'Bar', line: 'Line', donut: 'Doughnut' }

export function proposeDashboard(intent, variant = 0, size) {
  const recipe = BOARD_RECIPES.find((r) => r.re.test(intent)) || DEFAULT_RECIPE
  // rotating the recipe's own list makes a second look differ from the first
  const rotated = recipe.items.map((t, i) => recipe.items[(i + variant) % recipe.items.length])
  /* "Add a few more" / "trim it" resize the SAME list rather than re-rolling it — a
   * bigger board should still contain the widgets you already approved of. Growing
   * past the recipe wraps back through it with the pool from every other recipe. */
  const pool = [...rotated, ...BOARD_RECIPES.flatMap((r) => r.items).filter((t) => !rotated.includes(t))]
  const items = size ? pool.slice(0, Math.min(size, pool.length)) : rotated
  const widgets = items.map((text) => {
    const spec = resolveWidget(text)
    return {
      text, spec,
      module: spec.module,
      name: spec.title,
      viz: VIZ_LABEL[spec.kind] || spec.kind,
    }
  })
  // how much of the intent we could actually map — honest, not decorative
  const matched = BOARD_RECIPES.some((r) => r.re.test(intent))
  const words = intent.trim().split(/\s+/).length
  const match = Math.min(97, (matched ? 78 : 62) + Math.min(14, words))
  return { category: recipe.category, widgets, match, recipe: recipe.id }
}

/* suggestWidgets — propose widgets to ADD to a board that already exists.
 *
 * proposeDashboard builds a whole new board from an intent; this is the sibling for
 * "add a widget": it reads what the board is ABOUT (its category, then the modules its
 * tiles already use) to pick the right recipe, drops anything whose title is already on
 * the board, and returns real resolveWidget specs. `variant` re-rolls for "suggest
 * different ones". The result is a shortlist the user picks from, not a description they
 * have to type. */
export function suggestWidgets(board, variant = 0) {
  const tiles = board?.tiles || []
  const have = new Set(tiles.map((t) => (t.title || '').toLowerCase().trim()))
  // what is this board about? category first, else the module its tiles lean on.
  const hint = [
    board?.category || '',
    board?.name || '',
    ...tiles.slice(0, 6).map((t) => t.title || ''),
  ].join(' ')
  const recipe = BOARD_RECIPES.find((r) => r.re.test(hint)) || DEFAULT_RECIPE
  // the recipe's own items first, then the pool from every other recipe, rotated by
  // variant so a second look genuinely differs — deduped by resolved title.
  const pool = [...recipe.items, ...BOARD_RECIPES.flatMap((r) => r.items).filter((t) => !recipe.items.includes(t))]
  const rotated = pool.map((_, i) => pool[(i + variant * 3) % pool.length])
  const seen = new Set()
  const widgets = []
  for (const text of rotated) {
    const spec = resolveWidget(text)
    const key = spec.title.toLowerCase().trim()
    if (have.has(key) || seen.has(key)) continue      // don't suggest what's already there
    seen.add(key)
    widgets.push({ text, spec, module: spec.module, name: spec.title, viz: VIZ_LABEL[spec.kind] || spec.kind })
    if (widgets.length >= 5) break
  }
  return { widgets, recipe: recipe.id }
}

// apply an answer for something the description didn't say
export function applyGroupBy(spec, dimId, text) {
  const dim = GROUP_DIMS.find((d) => d.id === dimId)
  if (!dim) return spec
  const next = resolveWidget(`${text} by ${dim.label}`, spec.kind)
  next.missing = []
  return next
}
/* ---- revising a built widget ------------------------------------------------
 * Amending the user's original sentence leaves residue — "... by priority" plus a
 * new "... by team" gives you a widget grouped by whichever the regex hits first.
 * So a revision regenerates the intent from the parts the resolver actually read,
 * applies exactly one change, and re-resolves. Every word written here is one the
 * matchers above are guaranteed to read back. */
export const WINDOW_CHOICES = ['Today', 'This week', 'Last 30 days', 'Last 6 months', 'This year']
export const CONDITION_CHOICES = FILTERS.map((f) => f.word)
export function specToText(spec, over = {}) {
  const words = (over.filters || (spec.filters || []).map((f) => f.word)).map((w) => w.toLowerCase().replace(/-/g, ' '))
  const groupBy = 'groupBy' in over ? over.groupBy : spec.groupBy
  const win = 'window' in over ? over.window : spec.window
  const dim = GROUP_DIMS.find((d) => d.id === groupBy)
  return [
    words.join(' '),
    (over.module || spec.module || 'Requests').toLowerCase(),
    dim ? `by ${dim.label.toLowerCase()}` : '',
    win ? win.toLowerCase() : '',
  ].filter(Boolean).join(' ')
}
export function reviseSpec(spec, change = {}) {
  const over = { ...change }
  // a named condition is ADDED to what's already set, not swapped for it
  if (change.addCondition) {
    over.filters = [...new Set([...(spec.filters || []).map((f) => f.word), change.addCondition])]
    delete over.addCondition
  }
  const next = resolveWidget(specToText(spec, over), change.kind || spec.kind)
  if (change.title) next.title = change.title
  return next
}

// ---- P4: description → widget spec, grounded to the catalog (no-LLM matcher) ----
const clone = (o) => JSON.parse(JSON.stringify(o))
const SPECS = {
  sla: {
    title: 'P1 breaching SLA · by team', kind: 'bar',
    chips: [{ field: 'Priority', op: '=', value: 'P1' }, { field: 'SLA', op: 'is', value: 'Breaching' }, { field: 'Created date', op: 'in', value: 'This week' }, { field: 'Group by', op: '', value: 'Team' }],
    chart: { kind: 'bar', labels: ['Helpdesk', 'Network', 'Apps', 'Infra'], series: [{ name: 'Breaching', values: [6, 4, 2, 1] }] },
    why: 'A column chart compares one value across a few named groups — the clearest read for “by team”.',
  },
  backlog: {
    title: 'Backlog trend · last 6 months', kind: 'line',
    chips: [{ field: 'Backlog', op: '=', value: 'Open' }, { field: 'Created date', op: 'in', value: 'Last 6 months' }],
    chart: { kind: 'line', labels: MON, series: [{ name: 'Backlog', values: [180, 210, 198, 240, 232, 248] }] },
    why: 'A line chart shows movement over time — the right choice for a trend across months.',
  },
  priority: {
    title: 'Open tickets · by priority', kind: 'donut',
    chips: [{ field: 'Status', op: '=', value: 'Open' }, { field: 'Group by', op: '', value: 'Priority' }],
    chart: { kind: 'donut', labels: ['P1', 'P2', 'P3', 'P4'], series: [{ name: 'Priority', values: [18, 64, 120, 46] }] },
    why: 'A doughnut shows parts of a whole — ideal for a share across four priorities.',
  },
  asset: {
    title: 'Assets · by type', kind: 'bar',
    chips: [{ field: 'Module', op: '=', value: 'Asset' }, { field: 'Group by', op: '', value: 'Type' }],
    chart: { kind: 'bar', labels: ['Laptop', 'Desktop', 'Server', 'Mobile', 'Network'], series: [{ name: 'Assets', values: [2100, 1200, 320, 900, 300] }] },
    why: 'A column chart compares counts across categories.',
  },
}
export function specFromText(text) {
  const t = (text || '').toLowerCase()
  if (/sla|breach/.test(t)) return clone(SPECS.sla)
  if (/backlog|trend|month/.test(t)) return clone(SPECS.backlog)
  if (/priorit/.test(t)) return clone(SPECS.priority)
  if (/asset/.test(t)) return clone(SPECS.asset)
  return {
    title: (text || 'New widget').replace(/^create:?\s*/i, '').slice(0, 42) || 'New widget', kind: 'bar',
    chips: [{ field: 'Module', op: '=', value: 'Request' }, { field: 'Created date', op: 'in', value: 'Last 30 days' }],
    chart: { kind: 'bar', labels: ['A', 'B', 'C', 'D'], series: [{ name: 'Count', values: [24, 38, 19, 30] }] },
    why: 'A column chart is a safe default for comparing counts; refine the fields below.',
  }
}
