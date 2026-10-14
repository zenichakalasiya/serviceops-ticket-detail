/**
 * AiAssistant — the ONE unified AI feature (solves Problems 1–4 in a single panel).
 *
 * A docked side panel (board stays in view — the Dynatrace Assist / Power BI Copilot
 * pattern). It opens with a proactive role-ranked summary (P1); a single input +
 * suggested prompts route to explain an anomaly (P3), investigate records + act (P2),
 * or build a widget from a description (P4). Every answer is grounded (aiEngine
 * computes; this only narrates), with editable chips, citations, "how calculated",
 * confidence, thumbs, and the on-prem/no-LLM note.
 *
 * React port notes:
 *  · The thread, the draft and every flow flag live in `useRefState` objects, so the
 *    timers that stream answers in keep writing to the SAME objects across renders —
 *    exactly as the Vue refs did. `props` is read through a live proxy for the same reason.
 *  · The composer's text is the one value kept in React state (mirrored to `input.value`),
 *    because a controlled <input> must update synchronously or the caret jumps.
 *  · Product controls: the commit CTAs are `.btn.btn-primary`, secondary ones `.btn`,
 *    and the two segmented choices (chart form, visibility) are the product `pill-track`.
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui/primitives';
import { ChartTile } from './ChartTile';
import { facts as computeFacts, confidence, drillFor, drillNarrative, explainTile, statusUpdate, recoveryPlan, workOrder, changesSinceLastVisit, dashboardSummaryPoints, boardWidgetDigest, deepDiveBoard, deepDiveTile, focusBoard, focusTile, FRESHNESS } from '../data/aiEngine.js';
import { routeIntent, tileFromText, tileFromTitle, factFromText, resolveWidget, applyGroupBy, reviseSpec, explicitForm, proposeDashboard, suggestWidgets, GROUP_DIMS, WINDOW_CHOICES, CONDITION_CHOICES } from '../data/aiAssistant.js';
import { router, useDashRoute } from '../nav.js';
import { store, toast, createDashboard as createDashboardJs } from '../store.js';
const createDashboard: any = createDashboardJs;
import { chart, kpi, shortcut } from '../data/mock.js';
import { useDashStore, useRefState } from '../reactivity.js';
import './AiAssistant.css';

/* ── static vocabularies (module level — they never change) ──────────────────────── */

// grounded reasoning steps — narrate what the engine actually does for each intent
const THINK_STEPS: any = {
  summary: (n) => [`Reading ${n} widgets on this board`, 'Checking SLA, backlog and anomaly signals', 'Ranking what matters for your role'],
  drill: () => ['Finding the widget behind this signal', 'Pulling the records that match', 'Ranking them by urgency', 'Writing a plain-language briefing'],
  explain: () => ['Fetching this metric’s recent history', 'Computing the z-score against its baseline', 'Deciding whether it’s a real anomaly'],
  changes: () => ['Loading your last-visit snapshot', 'Diffing every metric since then', 'Sorting by what moved the most'],
  analyzing: (n) => [`Reading ${n} widgets`, 'Checking SLA, backlog and anomaly signals', 'Composing a plain-language summary'],
  // the two universal CTAs
  deepdive: (scope) => [`Reading everything on ${scope}`, 'Checking each signal against its normal range', 'Working out what is actually happening', 'Writing it up'],
  focus: (scope) => [`Scoring every signal on ${scope}`, 'Ranking by severity and urgency', 'Attaching the next action to each'],
};
const THINK_LABEL: any = { summary: 'Analyzing what needs attention', drill: 'Investigating', explain: 'Explaining this metric', changes: 'Comparing with your last visit', analyzing: 'Analyzing this dashboard', status: 'Drafting a status update', plan: 'Building a recovery plan', worklist: 'Working out what comes first', deepdive: 'Reading the full picture', focus: 'Working out what needs attention' };
const thinkLabel = (b) => THINK_LABEL[b.kind] || 'Thinking';
// only the reasoning steps that have started (so each animates in)
const shownSteps = (b) => (b.steps || []).filter((s) => s.state !== 'pending');

const VIS = [{ v: 'public', label: 'Public — everyone' }, { v: 'private', label: 'Private — just me' }, { v: 'restricted', label: 'Restricted — chosen people' }];

/* ============ AI-guided creation ============================================
 * The user states an INTENT in their own words; the AI drafts from it, names it
 * if they didn't, then asks only the two things it genuinely cannot infer
 * (category, visibility) as numbered question cards. Nothing else blocks them. */
// Presented in the same full-width option style as the panel's greeting, because
// this is the user's first encounter with the creation flow and the options need
// to read as the primary way in — not as afterthought chips.
const DASH_STARTERS = [
  { label: 'A service-desk board for SLA breaches and overdue work', icon: 'flag' },
  { label: 'An executive view of backlog, MTTR and CSAT', icon: 'auto-graph' },
  { label: 'A NOC wallboard for network and asset health', icon: 'layout' },
];
const WIDGET_STARTERS = [
  { label: 'SLA breaches this week by team', icon: 'chart-bar' },
  { label: 'Backlog trend over the last 6 months', icon: 'chart-line' },
  { label: 'Open tickets by priority', icon: 'chart-donut' },
];
/* "Write the prompt for me" — rather than dumping a blank template, the AI states
 * what it needs to know and offers a few ANGLES; picking one writes the whole prompt. */
const PROMPT_HELP: any = {
  dash: {
    intro: 'Happy to write it. A good dashboard prompt answers five things — pick the angle you think in and I’ll write the whole prompt for you.',
    needs: ['Who is it for?', 'What question should it answer every morning?', 'Which 3–4 numbers matter?', 'Over what time window?', 'What should it flag?'],
    approaches: [
      { id: 'role', title: 'Start from a role', body: 'I’ll write it around a persona — an L1 technician, a team lead or an executive.' },
      { id: 'question', title: 'Start from a question', body: 'I’ll write it around the one thing you want answered at the start of each shift.' },
      { id: 'metrics', title: 'Start from the metrics', body: 'I’ll write it around the numbers you already check every day.' },
    ],
    prompts: {
      role: 'Build a dashboard for an L1 service-desk technician who starts their shift by checking what is at risk. Track overdue requests, requests due in the next 24 hours, unassigned work and urgent open requests, broken down by priority and technician, over the last 7 days. Flag anything breaching SLA today.',
      question: 'Build a dashboard that answers “what will breach SLA today, and who is on it?”. Track SLA-breaching and due-soon requests grouped by priority and assignee, over today and the last 7 days. Flag anything that has no owner.',
      metrics: 'Build a dashboard tracking open requests, overdue requests, average resolution time and CSAT, broken down by team and priority, over the last 30 days. Flag any metric that breaks out of its normal range.',
    },
  },
  widget: {
    intro: 'Happy to write it. A widget prompt needs four things — pick how you want to frame it and I’ll write the whole prompt.',
    needs: ['What are we measuring?', 'Grouped by which field?', 'Over what time window?', 'What threshold matters?'],
    approaches: [
      { id: 'compare', title: 'Compare across groups', body: 'One measure split by team, priority or status — best read as a column chart.' },
      { id: 'trend', title: 'Track it over time', body: 'One measure across months or days — best read as a line.' },
      { id: 'share', title: 'Show the share of a whole', body: 'How a total splits across a handful of categories — best read as a doughnut.' },
    ],
    prompts: {
      compare: 'Show the count of SLA-breaching requests grouped by team, over this week, as a column chart. Highlight any team above 5.',
      trend: 'Show open request volume over the last 6 months as a line chart, so I can see whether the backlog is growing.',
      share: 'Show open requests grouped by priority as a doughnut, so I can see the urgent share at a glance.',
    },
  },
};

// name the board from the intent — honouring an explicit "called X", else choosing one
function nameFromIntent(text) {
  const explicit = text.match(/\b(?:called|named|titled)\s+["“']?([^"”'\n.]{2,40})/i);
  if (explicit) return { name: explicit[1].trim(), ours: false };
  const t = text.toLowerCase();
  const hit = (re, n) => (re.test(t) ? n : null);
  const name = hit(/exec|leadership|cxo|board level/, 'Executive Overview')
    || hit(/noc|network|wallboard|uptime/, 'Network Operations')
    || hit(/asset|patch|hardware|inventory|vulnerab/, 'Asset & Patch Health')
    || hit(/sla|breach|overdue/, 'SLA & Overdue Watch')
    || hit(/change|release|deploy/, 'Change & Release')
    || hit(/csat|satisfaction|feedback|quality/, 'Service Quality')
    || hit(/backlog|volume|trend/, 'Backlog & Volume')
    || 'Service Desk Overview';
  return { name, ours: true };
}

// the widget vocabulary we offer — shown as a small palette, and clickable to hint a type
const WIDGET_TYPES = [
  { id: 'bar', label: 'Column', hint: 'Compare across groups' },
  { id: 'hbar', label: 'Bar', hint: 'Long category names' },
  { id: 'line', label: 'Line', hint: 'Trend over time' },
  { id: 'donut', label: 'Doughnut', hint: 'Share of a whole' },
  { id: 'kpi', label: 'KPI', hint: 'One headline number' },
  { id: 'shortcut', label: 'Shortcut', hint: 'Records as a table', icon: 'table' },
];

/* A record list must obey its own conditions. Showing an "Urgent / In Progress" row
 * under a list titled "Unassigned High-priority" is the kind of mismatch that makes
 * the whole preview untrustworthy, so the rows are filtered by the Status/Priority
 * chips and only relabelled if nothing in the pool qualifies. */
const RECORD_POOL = [
  ['VPN down for finance team', 'Arnav Desai', 'In Progress', 'Urgent'],
  ['Email delivery delayed', 'Sarah Chen', 'Open', 'High'],
  ['Payroll app 500 error', 'Neha Gupta', 'In Progress', 'High'],
  ['SSO login failing for HR', 'Rahul Shukla', 'Open', 'Medium'],
  ['Printer offline — 3rd floor', 'Divya Menon', 'Pending', 'Low'],
  ['Laptop won’t boot after update', 'Karan Mehta', 'Open', 'High'],
  ['Shared drive permissions', 'Ishita Rao', 'Pending', 'Medium'],
  ['CRM sync failing overnight', 'Ananya Iyer', 'In Progress', 'Urgent'],
];
function recordRows(spec) {
  const chip = (f) => (spec.chips || []).find((c) => c.field === f)?.value;
  const status = chip('Status');
  const priority = chip('Priority');
  let rows = RECORD_POOL.filter((r) => (!status || r[2] === status) && (!priority || r[3] === priority));
  // nothing in the pool matches → take the first few and make them obey the conditions
  if (rows.length < 3) {
    rows = RECORD_POOL.slice(0, 4).map((r) => [r[0], r[1], status || r[2], priority || r[3]]);
  }
  return rows.slice(0, 4);
}
// turn a resolved spec into a real tile of the right form
function tileFromSpec(spec, text) {
  let tile;
  if (spec.kind === 'kpi') {
    const k = spec.kpi || { value: spec.total || 128, status: 'warn', delta: { dir: 'up', pct: 6 } };
    tile = (kpi as any)(spec.title, k.value, '', k.delta, k.status, text);
  } else if (spec.kind === 'shortcut') {
    tile = (shortcut as any)(spec.title, ['Subject', 'Requester', 'Status', 'Priority'], recordRows(spec), text);
  } else {
    tile = (chart as any)(spec.title, { ...spec.chart, kind: spec.kind }, text);
  }
  tile.prov = 'user';
  tile._chips = spec.chips || [];
  return tile;
}
/* "Add three widgets: X, Y and Z" should build three. Only split on separators the
 * user clearly meant as a list — a bare "and" is far more often part of one phrase
 * ("SLA breaches and overdue work") than a list boundary, so it's only trusted when
 * a count was stated. */
const NUM_WORDS: any = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
function statedCount(text) {
  const d = text.match(/\b(\d+)\s+(?:more\s+)?(widgets?|kpis?|charts?|shortcuts?|tiles?)\b/i);
  if (d) return Math.min(parseInt(d[1], 10), 8);
  const w = text.match(/\b(two|three|four|five|six|seven|eight)\s+(?:more\s+)?(?:widgets?|kpis?|charts?|shortcuts?|tiles?)\b/i);
  return w ? NUM_WORDS[w[1].toLowerCase()] : null;
}
function isDescriptive(s) {
  const t = s.trim().toLowerCase();
  if (t.length < 6) return false;
  return !/^(widgets?|kpis?|charts?|shortcuts?|tiles?|please|thanks|them|those|these)$/.test(t);
}
function splitWidgetRequests(text) {
  // drop a leading "create 3 widgets:" style preamble
  const body = String(text).replace(
    /^\s*(?:please\s+)?(?:can you\s+)?(?:create|add|build|make|generate|put)\s+(?:me\s+)?(?:\d+|a|an|some|a few|two|three|four|five|six|seven|eight)?\s*(?:more\s+)?(?:widgets?|kpis?|charts?|shortcuts?|tiles?)?\s*(?:that|which|for|showing|to show|:|—|-)?\s*/i, '');
  const strong = /\s*(?:\r?\n+|;|•|•|\s\d+[.)]\s+)\s*/;
  let parts = body.split(strong);
  // a stated count licenses comma / "and" splitting too
  if (parts.length < 2 && statedCount(text)) parts = body.split(/\s*,\s*and\s+|\s*,\s*|\s+and\s+/i);
  parts = parts.map((s) => s.trim().replace(/^[-–—]\s*/, '')).filter(isDescriptive);
  return parts.length ? parts : (isDescriptive(body) ? [body.trim()] : []);
}

/* The inline switch row under the preview. Every form the module supports is here —
 * a KPI and a record list are as much "a different way to draw this" as Bar vs Line,
 * so making them a switch (rather than a re-ask) is what keeps the flow one step. */
const WIDGET_KINDS = [
  { id: 'bar', label: 'Column' }, { id: 'hbar', label: 'Bar' },
  { id: 'line', label: 'Line' }, { id: 'donut', label: 'Doughnut' },
  { id: 'kpi', label: 'KPI' }, { id: 'shortcut', label: 'Table' },
];
const VIZ_WORD: any = { bar: 'Column chart', hbar: 'Bar chart', line: 'Line chart', donut: 'Doughnut chart', kpi: 'KPI', shortcut: 'Record list' };

/* Spell the configuration back, so "added" is verifiable rather than a claim. Each
 * form is described as what it actually does — a record list doesn't count or group
 * anything, and a KPI has nothing to group BY, so neither should claim it. */
function configLines(build) {
  const chips = build.chips || [];
  const kind = build.chart.kind;
  const val = (f) => chips.find((c) => new RegExp(f, 'i').test(c.field))?.value;
  const filters = chips.filter((c) => !/^group by$/i.test(c.field));
  const matching = filters.length ? ' matching the conditions below' : '';
  const groupBy = kind === 'kpi' || kind === 'shortcut'
    ? null
    : val('group by') || (build.chart.labels?.length ? 'the categories on its axis' : null);
  const out = [
    { k: 'Source', v: val('module') || 'Requests' },
    {
      k: kind === 'shortcut' ? 'Shows' : 'Measure',
      v: kind === 'shortcut' ? `The records themselves${matching}` : `Count of records${matching}`,
    },
    groupBy ? { k: 'Grouped by', v: groupBy } : null,
    kind === 'shortcut' ? { k: 'Columns', v: 'Subject, Requester, Status, Priority' } : null,
    { k: 'Window', v: val('created date') || 'the dashboard time filter' },
    { k: 'Drawn as', v: VIZ_WORD[kind] || kind },
  ].filter(Boolean);
  return { rows: out, filters };
}

// ---- contextual Follow ups (change with the block / what the user asked) ----
/* Follow-ups are for answers that INVITE a next question — a summary, a diff, an
 * explanation, an investigation. A templated note or a generated widget already
 * ends with its own actions, so piling generic follow-ups underneath is noise. */
const FOLLOWUP_KINDS = ['summary', 'changes', 'analyzing', 'widgets', 'explain', 'drill', 'status', 'plan', 'worklist', 'deepdive', 'focus'];
function isAnswer(b) {
  if (!FOLLOWUP_KINDS.includes(b.kind)) return false;
  if (b.phase && b.phase !== 'done') return false; // still thinking
  if (b.settled === false) return false; // still streaming/revealing
  return true;
}
/* Feedback sits under a finished ANSWER, never under a question or a prompt that's
 * still waiting on the user — rating something you haven't been told yet is noise. */
const NO_FEEDBACK = ['user', 'ask', 'create-start', 'cd-intent', 'cw-intent', 'cd-widgets', 'cw-newboard', 'cd-need'];
function hasFeedback(b) {
  if (NO_FEEDBACK.includes(b.kind)) return false;
  if (b.phase && b.phase !== 'done') return false;
  if (b.settled === false) return false;
  return true;
}
// the readable text of a block, for Copy
function blockText(b) {
  if (b.shownLines?.length || b.cur) return [...(b.shownLines || []), b.cur].filter(Boolean).join('\n');
  if (b.points?.length) return b.points.map((g) => `${g.title}\n${g.points.map((p) => `- ${p}`).join('\n')}`).join('\n\n');
  if (b.facts?.length) return b.facts.map((f) => `- ${f.text} (${f.chip})`).join('\n');
  if (b.data?.items) return b.data.items.map((i) => `- ${i.widget}: ${i.delta}, now ${i.value}`).join('\n');
  if (b.kind === 'nextsteps') return [b.intro, ...b.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.body}`)].join('\n');
  if (b.kind === 'cd-draft') return [`${b.name}`, ...(b.plan || []).map((p) => `- ${p}`)].join('\n');
  if (b.kind === 'cd-recap') return `${b.dash.name}\n${b.built.map((t) => `- ${t.title}`).join('\n')}`;
  if (b.tile) return b.tile.title;
  if (b.dash) return b.dash.name;
  return b.text || '';
}
function followUpsFor(b) {
  const k = b.kind;
  /* The two CTAs hand off to each other, and that handoff IS the conversation: a deep
   * dive ends by offering the ranked list, and the ranked list ends by offering the
   * ordering and the write-up. Neither offers itself back. */
  if (k === 'deepdive') return [
    { label: 'What needs attention', intent: 'focus' },
    { label: 'What changed since last visit', intent: 'changes' },
    { label: 'Draft a status update', intent: 'status' },
  ];
  if (k === 'focus') return [
    { label: 'What should I work on first?', intent: 'worklist' },
    { label: 'Turn this into a recovery plan', intent: 'plan' },
    { label: 'Draft a status update', intent: 'status' },
  ];
  if (k === 'analyzing' || k === 'summary') return [
    { label: 'What should I work on first?', intent: 'worklist' },
    { label: 'What changed since last visit', intent: 'changes' },
    { label: 'Draft a status update', intent: 'status' },
  ];
  if (k === 'changes') return [
    { label: 'Show the new P1 requests', intent: 'drill' },
    { label: 'Why did Overdue rise?', intent: 'explain' },
    { label: 'Turn this into a recovery plan', intent: 'plan' },
  ];
  if (k === 'status') return [
    { label: 'Turn this into a recovery plan', intent: 'plan' },
    { label: 'What should I work on first?', intent: 'worklist' },
    { label: 'Schedule this as a daily digest', intent: 'note' },
  ];
  if (k === 'plan') return [
    { label: 'What should I work on first?', intent: 'worklist' },
    { label: 'Draft a status update', intent: 'status' },
    { label: 'What changed since last visit', intent: 'changes' },
  ];
  if (k === 'worklist') return [
    { label: 'Turn this into a recovery plan', intent: 'plan' },
    { label: 'Draft a status update', intent: 'status' },
    { label: 'What needs attention', intent: 'summary' },
  ];
  if (k === 'explain') return [
    { label: `Show the records behind ${b.tile?.title || 'this'}`, intent: 'drill' },
    { label: 'Investigate the top offenders', intent: 'drill' },
    { label: 'Create an alert for this metric', intent: 'note' },
  ];
  if (k === 'drill') return [
    { label: 'Draft a status update', intent: 'status' },
    { label: 'What should I work on first?', intent: 'worklist' },
    { label: 'Schedule a follow-up check', intent: 'note' },
  ];
  if (k === 'widget') return [
    { label: 'Add another widget', intent: 'create' },
    { label: 'Create a dashboard for this', intent: 'createstart' },
  ];
  if (k === 'note') return [
    { label: 'Summarize this dashboard', intent: 'analyzing' },
    { label: 'What needs attention', intent: 'summary' },
  ];
  return [{ label: 'What needs attention', intent: 'summary' }, { label: 'What changed since last visit', intent: 'changes' }];
}

// ---- commands (reached from the composer's + button, or by typing "/") ----
// Each carries the placeholder the composer adopts once it's picked, plus the
// suggestion list that opens with it — and hides again the moment the user types.
const ACTIONS = [
  { key: 'find', label: 'Find', icon: 'search', hint: 'Search records & changes', placeholder: 'Find tickets, records or changes…', prompts: [
    { label: 'Find tickets breaching SLA today', intent: 'drill' },
    { label: 'Find the P1 requests assigned to me', intent: 'drill' },
    { label: 'Search this dashboard for Overdue', intent: 'explain' },
    { label: 'Find what changed since last visit', intent: 'changes' },
  ] },
  { key: 'create', label: 'Create', icon: 'plus', hint: 'Build a widget or dashboard', placeholder: 'Describe the dashboard or widget to build…', prompts: [
    { label: 'Create a widget for SLA breaches by team', intent: 'create' },
    { label: 'Create a backlog trend chart', intent: 'create' },
    { label: 'Create a new dashboard', intent: 'createstart' },
    { label: 'Generate a widget from a description', intent: 'createstart' },
  ] },
  { key: 'edit', label: 'Edit', icon: 'edit', hint: 'Change a widget or layout', placeholder: 'Tell me what to change…', prompts: [
    { label: 'Change a chart’s type to line', intent: 'note' },
    { label: 'Group the KPI widgets together', intent: 'note' },
    { label: 'Edit the dashboard time filter', intent: 'note' },
  ] },
  { key: 'analyze', label: 'Analyze', icon: 'auto-graph', hint: 'Explain what the data shows', placeholder: 'What should I analyze?', prompts: [
    { label: 'Analyze what needs attention', intent: 'summary' },
    { label: 'Why did Overdue spike?', intent: 'explain' },
    { label: 'What changed since last visit', intent: 'changes' },
    { label: 'Summarize this dashboard', intent: 'analyzing' },
  ] },
  { key: 'prioritize', label: 'Prioritize', icon: 'flag', hint: 'Rank what to work on', placeholder: 'What should I prioritize?', prompts: [
    { label: 'What should I work on first?', intent: 'worklist' },
    { label: 'Prioritize the P1s breaching today', intent: 'drill' },
    { label: 'Turn this into a recovery plan', intent: 'plan' },
  ] },
  { key: 'schedule', label: 'Schedule', icon: 'calendar2', hint: 'Digests, alerts & reminders', placeholder: 'What should I schedule?', prompts: [
    { label: 'Schedule a daily summary email', intent: 'note' },
    { label: 'Block time to clear overdue work', intent: 'note' },
    { label: 'Alert me when P1 backlog exceeds 10', intent: 'note' },
  ] },
];
// ---- panel ⋯ menu (ServiceOps-appropriate set) ----
const PANEL_MENU = [
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'share', label: 'Share', icon: 'share' },
  { key: 'copy', label: 'Copy as Markdown', icon: 'copy' },
  { key: 'export', label: 'Export chat', icon: 'download' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'clear', label: 'Clear conversation', icon: 'trash', danger: true },
];
const DEFAULT_PH = 'Ask, build and act across your stack';
// which intent a typed prompt takes once a command is selected
const CMD_INTENT: any = { find: 'drill', create: 'create', edit: 'note', analyze: 'explain', prioritize: 'drill', schedule: 'note' };
// the composer speaks for whatever the flow is waiting on
const AWAIT_PH: any = {
  'dash-intent': 'Describe what this dashboard is for…',
  'dash-refine': 'Tell me what to add or change…',
  'widget-intent': 'Describe the widget and the data it should show…',
  'widget-refine': 'Tell me what to change about it…',
  'newboard-name': 'Name the new dashboard…',
  'dash-widget': 'Describe a widget to add to this dashboard…',
};

// explain block sparkline
function spark(a) {
  const h = [...(a.history || []), a.value]; const W = 260, H = 42, pad = 4;
  const min = Math.min(...h), max = Math.max(...h), span = max - min || 1;
  const x = (i) => pad + (i * (W - pad * 2)) / (h.length - 1);
  const y = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
  return { W, H, line: 'M' + h.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L'), last: { x: x(h.length - 1), y: y(a.value) }, meanY: y(a.mean) };
}
/* Emphasise the load-bearing parts of a sentence — counts, percentages and the
 * widget names in quotes — so a paragraph can be skimmed rather than read whole.
 * The text is engine-generated (never user input), and is escaped first regardless. */
function hl(s) {
  return String(s == null ? '' : s)
    .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as any)[c])
    .replace(/“([^”]+)”/g, '<b>“$1”</b>')
    .replace(/(^|[\s(])([+−-]?\d[\d,.]*\s?%?)(?=$|[\s,.;:)])/g, '$1<b>$2</b>')
    // **…** — explicit emphasis the engine asks for, e.g. a metric's name inside a
    // sentence. Runs AFTER escaping, so the markers can never inject markup.
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}
const H = (s) => ({ __html: hl(s) });
const dotClass = (s) => (s === 'bad' ? 'bad' : s === 'warn' ? 'warn' : 'info');

// The empty-state greeting + starter CTAs (dashboard context — mirrors the ticket chat).
const EMPTY_CTAS = [
  { label: 'Summarize this dashboard', intent: 'analyzing', icon: 'bulb' },
  { label: 'What changed since last visit', intent: 'changes', icon: 'history' },
  { label: 'What needs attention', intent: 'summary', icon: 'auto-graph' },
  { label: 'Generate a widget', intent: 'createstart', icon: 'wand' },
];

/* The "something else" field on a question card. Local state for the caret's sake,
 * mirrored onto the block (b.other) so answerAsk reads it exactly as before. */
function AskOther({ b, onEnter }: any) {
  const [v, setV] = useState(b.other || '');
  return (
    <input
      value={v} placeholder={b.otherPh || 'Something else'}
      onChange={(e) => { setV(e.target.value); b.other = e.target.value; }}
      onKeyUp={(e) => { if (e.key === 'Enter') onEnter(v); }}
    />
  );
}

/* A tile preview — chart, KPI or record list — exactly as it renders on the board. */
function TilePreview({ tile }: any) {
  if (tile.type === 'chart') return <ChartTile chart={tile.chart} legend={true} height={150} />;
  if (tile.type === 'kpi') return <div className="kpiprev"><b>{tile.value}{tile.unit}</b><span>{tile.title}</span></div>;
  return (
    <div className="tblprev">
      <table>
        <thead><tr>{tile.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{tile.rows.slice(0, 3).map((r, ri) => <tr key={ri}>{r.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
function CondChips({ cfg }: any) {
  if (!(cfg && cfg.filters.length)) return null;
  return (
    <div className="chips condrow">
      {cfg.filters.map((c, ci) => (
        <span key={ci} className="dchip"><b>{c.field}</b>{c.op && <span className="op">{c.op}</span>} {c.value}</span>
      ))}
    </div>
  );
}

export const AiAssistant = forwardRef(function AiAssistant(rawProps: any, ref) {
  useDashStore();
  // live view of the props — timers started three renders ago must see today's board
  const propsRef = useRef(rawProps);
  propsRef.current = rawProps;
  const props: any = useMemo(() => new Proxy({}, { get: (_, k) => propsRef.current[k] }), []);
  const emit = (name: string, ...a: any[]) => {
    const key = 'on' + name.replace(/(^|[:-])(\w)/g, (_m, _s, c) => c.toUpperCase());
    propsRef.current[key]?.(...a);
  };
  const dashRoute = useDashRoute();
  const routeRef = useRef(dashRoute);
  routeRef.current = dashRoute;
  const route = { get params() { return routeRef.current.params; } };

  const thread = useRefState([]);
  const draft = useRefState({});
  // which create-flow step is waiting on the main composer (no inline inputs — the
  // user always writes in the one field at the bottom, guided by what the AI just said)
  const awaiting = useRefState(null);
  const menuOpen = useRefState(false);
  const cmdOpen = useRefState(false); // the command palette (+ button / "/")
  const cmdIndex = useRefState(0); // keyboard highlight in the palette
  const sugIndex = useRefState(0); // …and in the picked command's suggestions
  const activeAction = useRefState(null); // the picked command — shows as a chip in the composer
  const showSuggest = useRefState(false); // its suggestion list; hides as soon as the user types
  const bodyEl = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const bidRef = useRef(0);

  // the composer text: React state (caret-safe) behind a Vue-style `input.value`
  const [inputText, setInputText] = useState('');
  const inputVal = useRef('');
  const input = useMemo(() => ({
    get value() { return inputVal.current; },
    set value(v: string) { inputVal.current = v; setInputText(v); },
  }), []);

  function scrollDown() { requestAnimationFrame(() => { if (bodyEl.current) bodyEl.current.scrollTop = bodyEl.current.scrollHeight; }); }

  // ============================================================================
  //  A realistic AI feel — every answer THINKS before it speaks, then the content
  //  arrives progressively (streamed prose, revealed items) instead of appearing
  //  all at once. The numbers are still deterministic (aiEngine); only the *timing
  //  and delivery* are dramatised, exactly what a grounded on-prem model would do.
  // ============================================================================
  const prefersReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // step through the reasoning steps (pending → active → done), then run onDone
  function runThinking(b, steps, onDone?) {
    b.phase = 'thinking';
    b.steps = steps.map((t) => ({ text: t, state: 'pending' }));
    if (prefersReduced) { b.steps.forEach((s) => (s.state = 'done')); b.phase = 'done'; onDone && onDone(); scrollDown(); return; }
    let i = 0;
    const tick = () => {
      if (i >= b.steps.length) { b.phase = 'done'; scrollDown(); onDone && onDone(); return; }
      b.steps[i].state = 'active'; scrollDown();
      setTimeout(() => { b.steps[i].state = 'done'; i += 1; setTimeout(tick, 130); }, 360 + Math.random() * 240);
    };
    setTimeout(tick, 240);
  }
  // reveal a string word-by-word into b[key]
  function streamText(b, key, text, done?) {
    if (prefersReduced) { b[key] = text; done && done(); return; }
    const words = String(text).split(' ');
    b[key] = ''; let i = 0;
    const step = () => {
      if (i >= words.length) { done && done(); return; }
      b[key] += (i ? ' ' : '') + words[i]; i += 1; scrollDown();
      setTimeout(step, 22 + Math.random() * 44);
    };
    step();
  }
  // tick a reveal counter b[key] from 0 → total (staggered list reveal)
  function revealItems(b, key, total, delay, done?) {
    b[key] = 0;
    if (prefersReduced) { b[key] = total; done && done(); return; }
    const step = () => {
      if (b[key] >= total) { done && done(); return; }
      b[key] += 1; scrollDown(); setTimeout(step, delay);
    };
    setTimeout(step, 140);
  }

  // ---- block builders ----
  function push(kind, extra: any = {}) { thread.value.push({ id: ++bidRef.current, kind, ...extra }); scrollDown(); return thread.value[thread.value.length - 1]; }
  function pushUser(text) { thread.value.push({ id: ++bidRef.current, kind: 'user', text }); scrollDown(); }
  /* "Build me X" typed straight into the composer is the SAME job as the guided widget
   * step, so it goes down the same road: real resolver, real tile preview, one-click
   * placement. Two builders for one intent is how the two drift apart. */
  function pushWidget(text) {
    const inDash = inDashFlow();
    draft.value = { ...draft.value, mode: inDash ? 'dash' : 'widget', intent: text };
    const blk = push('cw-build', { phase: 'thinking', title: '', tile: null, spec: null, chips: [], cfg: null, settled: false, inDash });
    runThinking(blk, ['Reading what you want to show', 'Matching it to fields we can query', 'Configuring the widget'], () => {
      previewOrAsk(blk, text, explicitForm(text));
    });
  }
  // Spotlight the real tile on the dashboard (scroll + flash) instead of dumping a table.
  function highlightWidget(fact) {
    const t = fact && props.board.tiles.find((x) => x.id === fact.tileId);
    store.ui.aiHighlight = t ? t.title : null;
  }

  /* ===== The two universal CTAs — Deep dive · What needs attention ==============
   * The same pair fires at board level and at widget level; tileFromTitle decides which,
   * from an explicit title match only (tileFromText would fall back to a tile and silently
   * scope a board-level deep dive to one widget).
   *
   * They are deliberately different SHAPES of answer. Deep dive states a verdict and shows
   * its receipts; focus reveals a ranked list where every item carries its own next action.
   * Keep it that way — the moment one starts producing the other's shape, they are one CTA. */

  /* Deep dive renders as STRUCTURE, not a paragraph: a stated verdict, the readings as
   * chips, the drivers as cards, and the consequence as a callout. Only the verdict
   * streams; the rest reveals under it, so the answer lands as something you scan rather
   * than four paragraphs of prose you have to read to find the point. */
  function pushDeepDive(text) {
    const tile = tileFromTitle(props.board, text);
    const scope = tile ? `“${tile.title}”` : `“${props.board.name}”`;
    const b = push('deepdive', { phase: 'thinking', scope, tile, verdict: null, headline: '', readings: [], drivers: [], shownDrivers: 0, meaning: '', showExtras: false, settled: false });
    runThinking(b, THINK_STEPS.deepdive(scope), () => {
      const dd = tile ? deepDiveTile(tile) : deepDiveBoard(props.board, props.role);
      b.verdict = dd.verdict;
      b.readings = dd.readings;
      b.drivers = dd.drivers;
      b.meaning = dd.meaning;
      if (tile) highlightWidget({ tileId: tile.id });
      streamText(b, 'headline', dd.verdict.headline, () => {
        b.showExtras = true;
        revealItems(b, 'shownDrivers', dd.drivers.length, 180, () => { b.settled = true; });
      });
    });
  }

  /* No buttons on a focus item, deliberately. The recommendation is prose: a three-word
   * button ("Rebalance the queue") states an action without the reasoning that lets the
   * user judge whether it is the right one, which is the difference between an actionable
   * insight and an instruction. Anything the user then wants to do is one sentence away in
   * the composer, already grounded in the answer above it. */
  function pushFocus(text) {
    const tile = tileFromTitle(props.board, text);
    const scope = tile ? `“${tile.title}”` : `“${props.board.name}”`;
    const b = push('focus', { phase: 'thinking', scope, tile, lead: '', items: [], notes: [], shown: 0, settled: false });
    runThinking(b, THINK_STEPS.focus(scope), () => {
      const f = tile ? focusTile(tile) : focusBoard(props.board, props.role);
      b.lead = f.lead;
      b.items = f.items;
      b.notes = f.notes || [];
      if (tile) highlightWidget({ tileId: tile.id });
      if (!b.items.length) { b.settled = true; return; }
      revealItems(b, 'shown', b.items.length, 240, () => { b.settled = true; });
    });
  }

  // P1 — what needs attention: think, then reveal each fact one at a time
  function pushSummary() {
    const b = push('summary', { phase: 'thinking', facts: [], conf: 'high', shown: 0, settled: false });
    runThinking(b, THINK_STEPS.summary(props.board.tiles.length), () => {
      b.facts = computeFacts(props.board, props.role);
      b.conf = confidence(props.board);
      revealItems(b, 'shown', b.facts.length, 200, () => { b.settled = true; });
    });
  }
  // P3 — explain: think, then STREAM the full reasoned answer line-by-line, then the extras.
  // explainTile does the reasoning for ANY widget (KPI / chart / shortcut), so an "explain"
  // about a chart actually breaks the chart down instead of reciting a neighbouring KPI.
  function pushExplain(text) {
    const tile = tileFromText(props.board, text);
    const b = push('explain', { phase: 'thinking', tile, anomaly: null, lines: [], shownLines: [], cur: '', showExtras: false, settled: false });
    runThinking(b, THINK_STEPS.explain(), () => {
      const ex = explainTile(tile);
      b.anomaly = ex.anomaly;
      b.lines = ex.lines;
      highlightWidget({ tileId: tile.id });
      streamExplain(b, 0);
    });
  }
  function streamExplain(b, idx) {
    if (idx >= b.lines.length) { setTimeout(() => { b.showExtras = true; b.settled = true; scrollDown(); }, 200); return; }
    streamText(b, 'cur', b.lines[idx], () => {
      b.shownLines.push(b.lines[idx]); b.cur = '';
      setTimeout(() => streamExplain(b, idx + 1), 140);
    });
  }
  // P2 — investigate: think, spotlight the widget, STREAM the briefing line-by-line.
  // The "what next" belongs to the contextual Follow-ups below, so there's no separate
  // suggested-actions block here (it duplicated what the follow-ups already offer).
  function pushDrill(text, factObj?) {
    const fact = factObj || factFromText(props.board, text);
    const b = push('drill', { phase: 'thinking', fact, widget: '', showSpot: false, shownLines: [], cur: '', lines: [], settled: false });
    runThinking(b, THINK_STEPS.drill(), () => {
      const drill = drillFor(props.board, fact);
      b.widget = props.board.tiles.find((x) => x.id === fact.tileId)?.title || drill.sourceTitle;
      b.lines = drillNarrative(props.board, fact);
      highlightWidget(fact);
      setTimeout(() => { b.showSpot = true; scrollDown(); streamLines(b, 0); }, 240);
    });
  }
  function streamLines(b, idx) {
    if (idx >= b.lines.length) { b.settled = true; scrollDown(); return; }
    streamText(b, 'cur', b.lines[idx], () => {
      b.shownLines.push(b.lines[idx]); b.cur = '';
      setTimeout(() => streamLines(b, idx + 1), 150);
    });
  }
  // what changed: think, then reveal the change cards one at a time
  function pushChanges() {
    const b = push('changes', { phase: 'thinking', data: null, shown: 0, settled: false });
    runThinking(b, THINK_STEPS.changes(), () => {
      b.data = changesSinceLastVisit(props.board);
      revealItems(b, 'shown', b.data.items.length, 160, () => { b.settled = true; });
    });
  }
  // "Draft a status update" — a copy-ready update, streamed like prose
  function pushStatus() {
    const b = push('status', { phase: 'thinking', data: null, lines: [], shownLines: [], cur: '', settled: false });
    runThinking(b, ['Reading what needs attention', 'Checking the worklist', 'Drafting the update'], () => {
      b.data = statusUpdate(props.board, props.role);
      b.lines = b.data.body;
      streamStatus(b, 0);
    });
  }
  function streamStatus(b, i) {
    if (i >= b.lines.length) { b.settled = true; scrollDown(); return; }
    streamText(b, 'cur', b.lines[i], () => {
      b.shownLines.push(b.lines[i]); b.cur = '';
      setTimeout(() => streamStatus(b, i + 1), 150);
    });
  }
  // "Turn this into a recovery plan" — ordered steps revealed one at a time
  function pushPlan() {
    const b = push('plan', { phase: 'thinking', data: null, shown: 0, settled: false });
    runThinking(b, ['Reading the signals', 'Ordering the work by deadline', 'Writing the plan'], () => {
      b.data = recoveryPlan(props.board, props.role);
      revealItems(b, 'shown', b.data.steps.length, 240, () => { b.settled = true; });
    });
  }
  // "What should I work on first?" — a ranked queue
  function pushWorkOrder() {
    const b = push('worklist', { phase: 'thinking', items: [], shown: 0, settled: false });
    runThinking(b, ['Ranking by deadline and impact', 'Checking what’s already owned', 'Ordering your queue'], () => {
      b.items = workOrder(props.board, props.role);
      revealItems(b, 'shown', b.items.length, 220, () => { b.settled = true; });
    });
  }

  // Summarize / Ask: think, then the grouped written summary
  function pushAnalyzing() {
    const b = push('analyzing', { phase: 'thinking', points: [], settled: false });
    runThinking(b, THINK_STEPS.analyzing(props.board.tiles.length), () => {
      b.points = dashboardSummaryPoints(props.board, props.role);
      b.settled = true;
    });
  }
  /* Every widget on the board, read in one pass. The summary card only has room for an
   * overview, so this is where the per-widget detail lives — revealed one at a time so a
   * fifteen-widget board doesn't land as a wall. */
  function pushWidgets() {
    const b = push('widgets', { phase: 'thinking', rows: [], shown: 0, settled: false });
    const n = (props.board.tiles || []).length;
    runThinking(b, [`Reading all ${n} widget${n === 1 ? '' : 's'}`, 'Checking each against its normal range', 'Writing it up'], () => {
      b.rows = boardWidgetDigest(props.board);
      if (!b.rows.length) { b.settled = true; return; }
      revealItems(b, 'shown', b.rows.length, 140, () => { b.settled = true; });
    });
  }
  // a short templated reply for actions we don't fully simulate (edit / schedule)
  function pushNote(text) {
    const edit = /edit|change|rename|group|type/i.test(text);
    const reply = edit
      ? 'You can edit any widget from its ⋯ menu — chart type, filters or grouping. Tell me which widget and what to change, and I’ll walk you through it.'
      : 'I can set that up — scheduled digests and threshold alerts run on-prem. Confirm the cadence (daily / weekly) and I’ll draft it.';
    thread.value.push({ id: ++bidRef.current, kind: 'note', text: reply }); scrollDown();
  }

  // ---- P4 conversational CREATE flow (Generate with AI) ----
  function pushCreateStart() {
    // Generate-with-AI leads with the create flow — drop a lone auto-summary/preamble.
    if (thread.value.every((b) => b.kind === 'summary' || b.kind === 'user')) thread.value = [];
    draft.value = {}; push('create-start');
  }
  function openBoard(d) { emit('update:open', false); router.push(`/dashboard/${d.id}`); }

  // ---- dashboard flow ----
  function focusComposer() { requestAnimationFrame(() => inputEl.current?.focus()); }
  function startDash() { draft.value = { mode: 'dash' }; push('cd-intent'); awaiting.value = 'dash-intent'; focusComposer(); }
  function askPromptHelp(which) { push('prompt-help', { which, ...PROMPT_HELP[which] }); }
  function writePrompt(b, ap) { input.value = PROMPT_HELP[b.which].prompts[ap.id]; focusComposer(); }
  function useDashPrompt() { askPromptHelp('dash'); }
  /* The fast path: read the intent once and propose the WHOLE board, so it can be
   * accepted in a single click instead of described a widget at a time. */
  function dashIntent(text, variant = 0, size?) {
    const t = (text || '').trim(); if (!t) return;
    awaiting.value = null;
    if (!variant && !size) pushUser(t);
    const nm = nameFromIntent(t);
    draft.value = { ...draft.value, mode: 'dash', intent: t, name: nm.name, namedByAi: nm.ours, variant };
    if (draft.value.improving) draft.value.improving.stale = true;
    const blk = push('cd-proposal', { phase: 'thinking', name: '', proposal: null, namedByAi: false, settled: false });
    runThinking(blk, ['Reading the intent behind it', 'Choosing the widgets that answer it', 'Laying out the board'], () => {
      const p = proposeDashboard(t, variant, size);
      draft.value.category = p.category;
      draft.value.proposal = p;
      blk.name = draft.value.name;
      blk.namedByAi = draft.value.namedByAi;
      blk.proposal = p;
      blk.settled = true;
      awaiting.value = 'dash-refine'; // typing still refines it
    });
  }
  /* "Improve anything" replaces a bare Regenerate. Regenerate re-rolls blindly and makes
   * the user keep clicking until something fits; asking WHAT to improve gets there in one
   * step, and every option is answerable by picking rather than typing. */
  function improveProposal(b) {
    awaiting.value = null;
    draft.value.improving = b;
    push('ask', {
      askId: 'improve', step: 1, total: 1, other: '',
      q: 'What should I improve about it?',
      sub: `Right now it’s ${b.proposal.widgets.length} widgets in ${b.proposal.category}.`,
      options: [
        { label: 'Add a few more widgets', value: 'more' },
        { label: 'Trim it to the essentials', value: 'fewer' },
        { label: 'Focus it on a different module', value: 'module' },
        { label: 'Try a different mix entirely', value: 'reroll' },
      ],
      otherPh: 'Or describe what’s missing…', skippable: false,
    });
  }
  function askImproveModule() {
    push('ask', {
      askId: 'imodule', step: 1, total: 1, other: '', skippable: false,
      q: 'Which module should it be about?',
      sub: 'I’ll re-propose the whole board against that data.',
      options: ['Requests', 'Assets', 'Changes', 'Problems', 'Tasks'].map((m) => ({ label: m, value: m })),
      otherPh: '',
    });
  }
  function reproposeSize(dir) {
    const b = draft.value.improving;
    const p = b?.proposal;
    if (!p) return;
    // widen or narrow the SAME proposal rather than re-rolling it — "a bit bigger" should
    // not hand back a board with none of the widgets you already approved of
    const size = dir === 'more' ? p.widgets.length + 3 : Math.max(3, p.widgets.length - 2);
    dashIntent(draft.value.intent, draft.value.variant || 0, size);
  }
  // accept the proposal: create the board (if needed) and place every widget at once
  function acceptProposal(b, target) {
    awaiting.value = null;
    const p = b.proposal;
    const d = target === 'current'
      ? props.board
      : createDashboard({ name: draft.value.name, access: 'private', category: draft.value.category, description: draft.value.intent });
    draft.value.dash = d;
    draft.value.built = [];
    const blk = push('cd-placed', { phase: 'thinking', dash: d, count: p.widgets.length, madeBoard: target !== 'current', settled: false });
    runThinking(blk, [`Building ${p.widgets.length} widgets`, 'Applying conditions and grouping', 'Placing them on the board'], () => {
      p.widgets.forEach((w) => {
        const tile = tileFromSpec(w.spec, w.text);
        d.tiles.push(tile);
        draft.value.built.push(tile);
      });
      d.updated = new Date().toISOString();
      blk.settled = true;
      toast(`Added ${p.widgets.length} widgets to ${d.name}`, 'success');
      // take them straight to it — seeing the board IS the confirmation
      setTimeout(() => {
        if (route.params.id !== d.id) router.push(`/dashboard/${d.id}`);
        setTimeout(() => push('cd-recap', { dash: d, built: [...draft.value.built] }), 500);
      }, 600);
    });
  }
  // the user wants to refine before we commit
  function refineDash(text) { const t = (text || '').trim(); if (!t) return; dashIntent(`${draft.value.intent}. Also: ${t}`); }
  /* Approving the draft doesn't jump to the admin questions — most people came here to
   * BUILD something. Create the board now (with defaults) so widgets can be placed into
   * it and we can navigate to it; category and visibility are asked at the very end. */
  function continueDash() {
    awaiting.value = null;
    const d = createDashboard({
      name: draft.value.name, access: 'private', category: '',
      description: draft.value.intent || 'Created with ServiceOps AI',
    });
    draft.value.dash = d;
    draft.value.built = [];
    push('cd-widgets');
    awaiting.value = 'dash-widget';
    focusComposer();
  }
  function preferType(id) { draft.value.preferKind = draft.value.preferKind === id ? null : id; }

  // build one or many widgets straight into the new board
  function dashWidget(text) {
    const t = (text || '').trim(); if (!t) return;
    awaiting.value = null;
    pushUser(t);
    const want = statedCount(t);
    const items = splitWidgetRequests(t);
    // asked for widgets but never said what they should show → ask rather than guess
    if (!items.length) {
      push('cd-need', { want: want || 1, have: 0 });
      awaiting.value = 'dash-widget'; focusComposer(); return;
    }
    // "add 4 KPIs: a, b, c, d" names the form ONCE, in the preamble the splitter
    // removes — so carry it across the whole batch unless an item overrides it.
    draft.value.batchForm = explicitForm(t);
    const shortBy = want && want > items.length ? want - items.length : 0;
    /* ONE widget gets a preview to approve; a BATCH places straight away. Asking someone
     * to confirm six previews one at a time is the slow flow this whole rework replaced. */
    if (items.length === 1 && !shortBy) {
      draft.value.intent = items[0];
      const blk = push('cw-build', { phase: 'thinking', title: '', tile: null, spec: null, chips: [], cfg: null, settled: false, inDash: true });
      runThinking(blk, ['Reading what you want to show', 'Choosing the clearest way to draw it', 'Configuring the widget'], () => {
        previewOrAsk(blk, items[0], formFor(items[0]));
      });
      return;
    }
    buildWidgetQueue(items, 0, shortBy);
  }
  // item's own wording wins, then the batch preamble, then the palette hint
  function formFor(item) {
    return explicitForm(item) || draft.value.batchForm || draft.value.preferKind || null;
  }
  function buildWidgetQueue(list, i, shortBy) {
    if (i >= list.length) {
      // built what was clear; now ask for whatever they counted but didn't describe
      if (shortBy > 0) push('cd-need', { want: shortBy, have: list.length, partial: true });
      awaiting.value = 'dash-widget';
      return;
    }
    const spec = resolveWidget(list[i], formFor(list[i]));
    // it can't invent a grouping — pause the queue and ask, then resume
    if (spec.missing.length) {
      draft.value.pending = { list, i, shortBy, text: list[i], spec };
      askGroupBy(spec, list.length > 1 ? `${i + 1} of ${list.length}` : '');
      return;
    }
    placeWidget(spec, list[i], list, i, shortBy);
  }
  function placeWidget(spec, text, list, i, shortBy) {
    const blk = push('cd-widget', {
      phase: 'thinking', tile: null, cfg: null, settled: false,
      idx: i + 1, total: list.length, last: i === list.length - 1 && shortBy === 0,
    });
    runThinking(blk, ['Reading what you want to show', 'Choosing the clearest way to draw it', 'Configuring and placing it'], () => {
      const tile = tileFromSpec(spec, text);
      const d = draft.value.dash;
      d.tiles.push(tile); d.updated = new Date().toISOString();
      draft.value.built.push(tile);
      blk.tile = tile;
      // every form has conditions worth showing — read the kind off the spec, since a
      // KPI and a record list have no tile.chart to read it from
      blk.cfg = configLines({ title: tile.title, chart: { kind: spec.kind, labels: spec.chart?.labels }, chips: spec.chips || [] });
      blk.settled = true;
      setTimeout(() => buildWidgetQueue(list, i + 1, shortBy), 400);
    });
  }
  // the one thing a description often leaves out: what to group by
  function askGroupBy(spec, progress) {
    awaiting.value = null;
    push('ask', {
      askId: 'wgroup', step: 1, total: 1, other: '',
      q: `How should I group “${spec.title}”?`,
      sub: `That's the one thing I can't read from your description${progress ? ` · widget ${progress}` : ''}.`,
      options: GROUP_DIMS.slice(0, 6).map((d) => ({ label: `By ${d.label.toLowerCase()}`, value: d.id })),
      otherPh: 'Or name another field…', skippable: false,
    });
  }
  function moreWidgets() { awaiting.value = 'dash-widget'; focusComposer(); }
  // take them TO the board so they can see what was built, keeping the panel open
  function finishWidgets() {
    awaiting.value = null;
    const d = draft.value.dash;
    if (d && route.params.id !== d.id) router.push(`/dashboard/${d.id}`);
    setTimeout(() => push('cd-recap', { dash: d, built: [...(draft.value.built || [])] }), 450);
  }
  function confirmRecap() { awaiting.value = null; askCategory(); }
  // "Change something" on the recap is also a question, for the same reason
  function changeRecap() {
    awaiting.value = null;
    push('ask', {
      askId: 'recapchange', step: 1, total: 1, other: '', skippable: false,
      q: 'What would you like to change?',
      sub: `“${draft.value.dash?.name}” has ${(draft.value.built || []).length} widget${(draft.value.built || []).length === 1 ? '' : 's'} on it.`,
      options: [
        { label: 'Add another widget', value: 'add' },
        { label: 'Remove one of the widgets', value: 'remove' },
        { label: 'Rename the dashboard', value: 'rename' },
      ],
      otherPh: 'Or describe the change…',
    });
  }
  function askRemoveWidget() {
    push('ask', {
      askId: 'rremove', step: 1, total: 1, other: '', skippable: false,
      q: 'Which one should come off?',
      sub: 'It’s removed from the board straight away — nothing else changes.',
      options: (draft.value.built || []).map((t, i) => ({ label: t.title, value: String(i) })),
      otherPh: '',
    });
  }

  function askCategory() {
    awaiting.value = null;
    const cats = (store.categories || []).filter(Boolean).slice(0, 4);
    push('ask', {
      askId: 'cat', step: 1, total: 2, other: '',
      q: 'Which category should this dashboard live in?',
      sub: 'Pick an existing one, or type a new category to create it.',
      options: cats.map((c) => ({ label: c, value: c })),
      otherPh: 'Create a new category…', skippable: true,
    });
  }
  function askVisibility() {
    awaiting.value = null;
    push('ask', {
      askId: 'vis', step: 2, total: 2, other: '',
      q: 'Who should be able to see it?',
      sub: 'This is the last thing I need — then I’ll build it.',
      options: VIS.map((v) => ({ label: v.label, value: v.v })),
      otherPh: '', skippable: true,
    });
  }
  // The board already exists (created when the draft was approved) — this applies the
  // two answers to it and closes the flow out.
  function finishDashboard() {
    const d = draft.value.dash;
    draft.value.finished = true;
    d.category = draft.value.category === '__skip' ? '' : draft.value.category;
    d.access = draft.value.access || 'private';
    d.updated = new Date().toISOString();
    const n = (draft.value.built || []).length;
    const blk = push('cd-done', { phase: 'thinking', dash: null, namedByAi: draft.value.namedByAi, built: n, settled: false });
    runThinking(blk, ['Applying category and visibility', 'Finishing up'], () => {
      blk.dash = d; blk.settled = true;
      setTimeout(() => pushNextSteps(
        n
          ? `“${d.name}” is built and live with ${n} widget${n === 1 ? '' : 's'} on it.`
          : `“${d.name}” is live — it just doesn’t have any widgets yet.`,
        [
          { title: n ? 'Add another widget' : 'Add a widget', body: 'Describe what it should show and I’ll build and place it.', run: 'addwidget' },
          { title: 'Set who can see it', body: `It’s currently ${d.access}. I can open it up to a group or specific technicians.`, run: 'access' },
          { title: 'Schedule a digest', body: 'Email a snapshot of this board on a daily or weekly cadence.', run: 'schedule' },
        ],
      ), 700);
    });
  }

  /* Numbered next steps — written as prose, offered ONLY after a task that genuinely
   * leaves a decision open. Informational answers (a summary, an explanation) don't
   * get one; they keep their lighter contextual follow-ups instead. */
  function pushNextSteps(intro, steps) { push('nextsteps', { intro, steps }); }
  function runNextStep(s) {
    if (s.run === 'addwidget' || s.run === 'another') { pushUser(s.title); startWidget(); return; }
    if (s.run === 'open') { openBoard(draft.value.targetBoard || draft.value.dash); return; }
    if (s.run === 'recast') { pushUser(s.title); pushNote('Change a chart’s type'); return; }
    // 'access' rather than 'share': a board is opened up by changing WHO can access it,
    // which is the only sharing model left after the Share action was withdrawn.
    pushUser(s.title); pushNote(s.run === 'schedule' ? 'Schedule a daily summary' : 'Change who can access this dashboard');
  }

  /* ---- "Add a new widget" — the AI SUGGESTS, the user picks ----------------------
   * Rather than a blank "describe a widget" box, the AI reads what this board is about
   * and shortlists widgets that fit but aren't on it yet. The user ticks the ones they
   * want and drops them on this board or a new one, in one step. Typing still works — the
   * composer routes into the normal build flow — but the fast path is selection. */
  function pushWidgetSuggest(variant = 0) {
    draft.value = { mode: 'widget' };
    const blk = push('cw-suggest', { phase: 'thinking', widgets: [], picked: new Set(), variant, settled: false });
    runThinking(blk, ['Reading what this board is about', 'Finding widgets that fit', 'Leaving out what’s already here'], () => {
      const s = suggestWidgets(props.board, variant);
      blk.widgets = s.widgets;
      blk.picked = new Set(s.widgets.map((_, i) => i)); // all ticked by default — the common case is "yes, these"
      blk.settled = true;
      awaiting.value = 'widget-intent'; // typing a description still builds one directly
    });
  }
  function togglePick(b, i) {
    const s = new Set(b.picked);
    s.has(i) ? s.delete(i) : s.add(i);
    b.picked = s;
  }
  function regenerateSuggest(b) { b.stale = true; pushUser('Suggest different ones'); pushWidgetSuggest((b.variant || 0) + 1); }
  // place the ticked widgets on this board, or ask for a new board's name first
  function acceptSuggest(b, target) {
    const chosen = b.widgets.filter((_, i) => b.picked.has(i));
    if (!chosen.length) { toast('Tick at least one widget to add', 'warn'); return; }
    b.stale = true;
    awaiting.value = null;
    if (target === 'new') { draft.value.suggestChosen = chosen; awaiting.value = 'suggest-newboard'; push('cw-newboard'); focusComposer(); return; }
    placeSuggested(chosen, props.board, false);
  }
  function placeSuggested(chosen, d, madeBoard) {
    draft.value.dash = d;
    const blk = push('cd-placed', { phase: 'thinking', dash: d, count: chosen.length, madeBoard, settled: false });
    runThinking(blk, [`Building ${chosen.length} widget${chosen.length === 1 ? '' : 's'}`, 'Applying conditions and grouping', 'Placing them on the board'], () => {
      const built = chosen.map((w) => { const tile = tileFromSpec(w.spec, w.text); d.tiles.push(tile); return tile; });
      d.updated = new Date().toISOString();
      blk.settled = true;
      toast(`Added ${chosen.length} widget${chosen.length === 1 ? '' : 's'} to ${d.name}`, 'success');
      setTimeout(() => {
        if (route.params.id !== d.id) router.push(`/dashboard/${d.id}`);
        setTimeout(() => push('cd-recap', { dash: d, built: [...built] }), 500);
      }, 600);
    });
  }

  // ---- widget flow (same shape, reachable on its own or straight after a board) ----
  function startWidget() { draft.value = { ...draft.value, mode: 'widget' }; push('cw-intent'); awaiting.value = 'widget-intent'; focusComposer(); }
  function useWidgetPrompt() { askPromptHelp('widget'); }
  // resolve → real tile, so the preview in chat is the very thing that lands on the board
  function applyPreview(blk, spec, text) {
    blk.spec = spec;
    blk.title = spec.title;
    blk.module = spec.module || 'Requests';
    blk.chips = spec.chips || [];
    blk.tile = tileFromSpec(spec, text);
    blk.cfg = configLines({ title: spec.title, chart: { kind: spec.kind, labels: spec.chart?.labels }, chips: spec.chips || [] });
    blk.settled = true;
  }
  /* A dashboard is mid-build when its board exists but its setup questions haven't been
   * answered yet. A widget previewed in that window belongs to THAT board, so its next
   * step is finishing the board — not choosing where to put it. */
  function inDashFlow() { return draft.value.mode === 'dash' && !!draft.value.dash && !draft.value.finished; }
  function widgetIntent(text) {
    const t = (text || '').trim(); if (!t) return;
    awaiting.value = null;
    pushUser(t);
    draft.value.intent = t;
    const blk = push('cw-build', { phase: 'thinking', title: '', tile: null, spec: null, chips: [], cfg: null, settled: false, inDash: inDashFlow() });
    runThinking(blk, ['Reading what you want to show', 'Matching it to fields we can query', 'Configuring the widget'], () => {
      previewOrAsk(blk, t, explicitForm(t));
    });
  }
  /* Same rule as the dashboard flow: build without interruption when the description is
   * complete, and ask ONLY for the grouping, which is the one field a description
   * reliably omits and the AI cannot reasonably guess. */
  function previewOrAsk(blk, text, form) {
    const spec = resolveWidget(text, form);
    if (spec.missing.length) {
      draft.value.pending = { mode: 'widget', blk, text, spec };
      askGroupBy(spec, '');
      return;
    }
    applyPreview(blk, spec, text);
  }
  // switching form re-resolves rather than re-skinning — a KPI of a grouped query is a
  // different query, and pretending otherwise is how a preview stops matching the board
  function setBuildKind(b, id) {
    if (b.spec?.kind === id) return;
    previewOrAsk(b, draft.value.intent || b.title, id);
  }
  /* "Change something" is a QUESTION, not a blank composer. Being asked "what should I
   * change?" with the four things that are actually changeable beats an empty box that
   * makes you guess the vocabulary — and it keeps the whole exchange in the thread. */
  function changeWidget(b) {
    awaiting.value = null;
    draft.value.revising = b;
    push('ask', {
      askId: 'wchange', step: 1, total: 1, other: '',
      q: `What should I change about “${b.title}”?`,
      sub: 'Pick one and I’ll rebuild the preview — the chart type is switchable above.',
      options: [
        { label: 'The conditions it filters on', value: 'cond' },
        { label: 'What it’s grouped by', value: 'group' },
        { label: 'The time window it covers', value: 'window' },
        { label: 'Its title', value: 'title' },
      ],
      otherPh: 'Or describe the change…', skippable: false,
    });
  }
  // each answer to "what should I change" opens the one list that answers it
  function askRevision(kind, b) {
    const spec = draft.value.revising?.spec;
    const q = ({
      cond: {
        askId: 'wcond', q: 'Which condition should it filter on?',
        sub: 'I’ll add it to the conditions already set.',
        options: CONDITION_CHOICES.slice(0, 6).map((w) => ({ label: w.replace(/-/g, ' '), value: w })),
        otherPh: 'Or name another condition…',
      },
      group: {
        askId: 'wregroup', q: 'What should it be grouped by?',
        sub: 'This becomes the axis the values are split across.',
        options: GROUP_DIMS.slice(0, 6).map((d) => ({ label: `By ${d.label.toLowerCase()}`, value: d.id })),
        otherPh: 'Or name another field…',
      },
      window: {
        askId: 'wwindow', q: 'Which time window should it cover?',
        sub: 'Leave it on the dashboard filter and it follows whatever the board is set to.',
        options: [...WINDOW_CHOICES.map((w) => ({ label: w, value: w })), { label: 'Follow the dashboard filter', value: '__none' }],
        otherPh: '',
      },
      title: {
        askId: 'wtitle', q: 'What should it be called?',
        sub: 'Type the new title below — or keep the one I derived from the query.',
        options: [{ label: `Keep “${spec?.title || 'the current title'}”`, value: spec?.title || '' }],
        otherPh: 'Type the new title…',
      },
    } as any)[kind];
    if (!q) { redoPreview(reviseSpec(draft.value.revising.spec, {}), b.answered); return; }
    push('ask', { step: 1, total: 1, other: '', skippable: false, ...q });
  }
  // a revision produces a NEW preview block, so the change reads as a step in the thread
  function redoPreview(spec, note) {
    const prev = draft.value.revising;
    if (prev) prev.stale = true;
    const blk = push('cw-build', {
      phase: 'thinking', title: '', tile: null, spec: null, chips: [], settled: false,
      inDash: prev?.inDash || false,
    });
    runThinking(blk, [note ? `Applying “${note}”` : 'Applying your change', 'Re-running the query', 'Redrawing the preview'], () => {
      applyPreview(blk, spec, draft.value.intent || spec.title);
    });
  }
  function refineWidget(text) { const t = (text || '').trim(); if (!t) return; widgetIntent(`${draft.value.intent}. ${t}`); }
  /* Almost everyone wants the widget on the board they're already looking at, so that
   * is a BUTTON, not a question — one click from preview to placed. "A new dashboard"
   * stays available beside it and is the only branch that still needs to be asked. */
  function confirmWidget(b, target?) {
    draft.value.build = { title: b.title, spec: b.spec, chips: b.chips || [] };
    b.stale = true;
    awaiting.value = null;
    // building INSIDE a dashboard draft: place it, then go finish the board
    if (target === 'finish') {
      const tile = tileFromSpec(b.spec, draft.value.intent);
      const d = draft.value.dash;
      d.tiles.push(tile); d.updated = new Date().toISOString();
      (draft.value.built = draft.value.built || []).push(tile);
      toast(`Added “${tile.title}” to ${d.name}`, 'success');
      setTimeout(finishWidgets, 400);
      return;
    }
    if (target === 'other') { askWhichBoard(); return; }
    draft.value.targetBoard = currentBoard();
    addTheWidget();
  }
  // "Add to another": the boards that exist, plus a brand-new one — asked in the thread
  function askWhichBoard() {
    const others = store.dashboards.filter((d) => d.id !== currentBoard().id).slice(0, 4);
    push('ask', {
      askId: 'wother', step: 1, total: 1, other: '', skippable: false,
      q: 'Which dashboard should it go on?',
      sub: 'I’ll place it at the end of that board.',
      options: [...others.map((d) => ({ label: d.name, value: d.id })), { label: 'A new dashboard', value: '__new' }],
      otherPh: 'Or name a new dashboard…',
    });
  }
  function currentBoard() { return draft.value.dash || props.board; }
  // turn the built spec into a real tile on the chosen board — whatever form it is
  function addTheWidget() {
    const d = draft.value.targetBoard || draft.value.dash;
    const bld = draft.value.build;
    const tile = tileFromSpec(bld.spec, draft.value.intent);
    d.tiles.push(tile); d.updated = new Date().toISOString();
    const cfg = configLines({ ...bld, chart: { kind: bld.spec.kind, labels: bld.spec.chart?.labels } });
    const blk = push('cw-done', { phase: 'thinking', tile: null, dash: d, cfg: null, settled: false });
    runThinking(blk, ['Applying the conditions', 'Configuring the widget', 'Placing it on the board'], () => {
      blk.tile = tile; blk.cfg = cfg; blk.settled = true;
      toast(`Added “${tile.title}” to ${d.name}`, 'success');
      setTimeout(() => pushNextSteps(
        `That’s “${tile.title}” on “${d.name}” — the preview above is exactly how it renders on the board.`,
        [
          { title: 'Add another widget', body: 'Keep building the board out while the context is fresh.', run: 'another' },
          { title: 'Change how it’s drawn', body: 'Switch it between a chart, a KPI or a record list.', run: 'recast' },
          { title: 'Open the dashboard', body: 'See it in place alongside the other widgets.', run: 'open' },
        ],
      ), 700);
    });
  }

  // ---- one handler for every question card ----
  function answerAsk(b, opt, custom?) {
    const val = custom === '__skip' ? '__skip' : (opt ? opt.value : (custom || '').trim());
    if (!val) return;
    b.answered = custom === '__skip' ? 'Skipped' : (opt ? opt.label : custom);
    pushUser(b.answered);
    if (b.askId === 'cat') { draft.value.category = val === '__skip' ? '' : val; setTimeout(askVisibility, 350); return; }
    if (b.askId === 'vis') { draft.value.access = val === '__skip' ? 'private' : val; setTimeout(finishDashboard, 400); return; }
    if (b.askId === 'wgroup') {
      const p = draft.value.pending;
      if (!p) return;
      draft.value.pending = null;
      const dim = GROUP_DIMS.find((d) => d.id === val) || GROUP_DIMS.find((d) => d.label.toLowerCase() === String(val).toLowerCase());
      const spec = dim ? applyGroupBy(p.spec, dim.id, p.text) : { ...p.spec, missing: [] };
      // the single-widget flow answers back into its own preview; the batch resumes its queue
      if (p.mode === 'widget') setTimeout(() => applyPreview(p.blk, spec, p.text), 350);
      else setTimeout(() => placeWidget(spec, p.text, p.list, p.i, p.shortBy), 350);
      return;
    }
    // ---- revising a built widget: pick a field, then pick its value ----
    if (b.askId === 'wchange') {
      if (opt) { setTimeout(() => askRevision(val, b), 320); return; }
      // typed freely instead of picking → treat it as a fresh description of the widget
      const base = draft.value.revising;
      if (base) base.stale = true;
      setTimeout(() => widgetIntent(`${draft.value.intent}. ${val}`), 320);
      return;
    }
    if (b.askId === 'wcond') {
      setTimeout(() => redoPreview(reviseSpec(draft.value.revising.spec, { addCondition: val }), b.answered), 320); return;
    }
    if (b.askId === 'wregroup') {
      const dim = GROUP_DIMS.find((d) => d.id === val) || GROUP_DIMS.find((d) => d.label.toLowerCase() === String(val).toLowerCase());
      setTimeout(() => redoPreview(reviseSpec(draft.value.revising.spec, { groupBy: dim ? dim.id : null }), b.answered), 320); return;
    }
    if (b.askId === 'wwindow') {
      setTimeout(() => redoPreview(reviseSpec(draft.value.revising.spec, { window: val === '__none' ? null : val }), b.answered), 320); return;
    }
    if (b.askId === 'wtitle') {
      setTimeout(() => redoPreview(reviseSpec(draft.value.revising.spec, { title: val }), b.answered), 320); return;
    }
    // ---- "add to another": an existing board, or a brand-new one ----
    if (b.askId === 'wother') {
      if (val === '__new') { awaiting.value = 'newboard-name'; push('cw-newboard'); focusComposer(); return; }
      const target = store.dashboards.find((d) => d.id === val) || makeBoardFor(b.answered);
      draft.value.targetBoard = target;
      setTimeout(addTheWidget, 350);
      return;
    }
    // ---- changing the board after its widgets are on it ----
    if (b.askId === 'recapchange') {
      if (val === 'add') { awaiting.value = 'dash-widget'; focusComposer(); return; }
      if (val === 'remove') { setTimeout(askRemoveWidget, 320); return; }
      if (val === 'rename') {
        push('ask', {
          askId: 'rrename', step: 1, total: 1, other: '', skippable: false,
          q: 'What should it be called?', sub: 'Type the new name.',
          options: [{ label: `Keep “${draft.value.dash?.name}”`, value: draft.value.dash?.name || '' }],
          otherPh: 'Type a new name…',
        });
        return;
      }
      awaiting.value = 'dash-widget'; focusComposer(); return;
    }
    if (b.askId === 'rremove') {
      const d = draft.value.dash;
      const tile = (draft.value.built || [])[Number(val)];
      if (tile) {
        d.tiles = d.tiles.filter((t) => t.id !== tile.id);
        draft.value.built = draft.value.built.filter((t) => t.id !== tile.id);
        d.updated = new Date().toISOString();
        toast(`Removed “${tile.title}”`, 'success');
      }
      setTimeout(() => push('cd-recap', { dash: d, built: [...(draft.value.built || [])] }), 450);
      return;
    }
    if (b.askId === 'rrename') {
      const d = draft.value.dash;
      if (d && val) { d.name = val; d.updated = new Date().toISOString(); draft.value.name = val; draft.value.namedByAi = false; }
      setTimeout(() => push('cd-recap', { dash: d, built: [...(draft.value.built || [])] }), 450);
      return;
    }
    // ---- improving a proposed board before it's built ----
    if (b.askId === 'improve') {
      if (val === 'more' || val === 'fewer') { setTimeout(() => reproposeSize(val), 320); return; }
      if (val === 'module') { setTimeout(askImproveModule, 320); return; }
      setTimeout(() => dashIntent(`${draft.value.intent}. ${b.answered}`, (draft.value.variant || 0) + 1), 320);
      return;
    }
    if (b.askId === 'imodule') {
      setTimeout(() => dashIntent(`${draft.value.intent} for ${val}`, draft.value.variant || 0), 320); return;
    }
    if (b.askId === 'wdash') {
      // "a new dashboard" with no name yet → ask for the name in the composer
      if (val === '__new') { awaiting.value = 'newboard-name'; focusComposer(); setTimeout(() => push('cw-newboard'), 250); return; }
      let target = store.dashboards.find((d) => d.id === val);
      // typed a name rather than picking → create that dashboard and use it
      if (!target) target = makeBoardFor(b.answered);
      draft.value.targetBoard = target;
      setTimeout(addTheWidget, 350);
    }
  }
  // create the board the widget is about to land on
  function makeBoardFor(name) {
    const d = createDashboard({ name: (name || '').trim() || 'New dashboard', access: 'private', category: '', description: 'Created with ServiceOps AI' });
    draft.value.dash = d;
    draft.value.createdBoard = true;
    return d;
  }
  function newBoardNamed(text) {
    const t = (text || '').trim(); if (!t) return;
    awaiting.value = null;
    pushUser(t);
    draft.value.targetBoard = makeBoardFor(t);
    setTimeout(addTheWidget, 350);
  }
  // naming the new board for a batch of SUGGESTED widgets → create it, then place them all
  function suggestNewBoardNamed(text) {
    const t = (text || '').trim(); if (!t) return;
    awaiting.value = null;
    pushUser(t);
    const d = createDashboard({ name: t, access: 'private', category: '', description: 'Created with ServiceOps AI' });
    setTimeout(() => placeSuggested(draft.value.suggestChosen || [], d, true), 350);
  }

  function dispatch(intent, text) {
    if (intent === 'deepdive') pushDeepDive(text);
    else if (intent === 'focus') pushFocus(text);
    else if (intent === 'summary') pushSummary();
    else if (intent === 'explain') pushExplain(text);
    else if (intent === 'drill') pushDrill(text);
    /* "Create a DASHBOARD" and "create a widget" are the same intent to the router but
     * different flows — one proposes a whole board, the other builds a single tile. */
    else if (intent === 'create') (/\b(dashboard|board|dashboards)\b/i.test(text) ? dashIntent : pushWidget)(text);
    else if (intent === 'changes') pushChanges();
    else if (intent === 'analyzing') pushAnalyzing();
    else if (intent === 'widgets') pushWidgets();
    else if (intent === 'suggestwidget') pushWidgetSuggest();
    else if (intent === 'createstart') pushCreateStart();
    else if (intent === 'status') pushStatus();
    else if (intent === 'plan') pushPlan();
    else if (intent === 'worklist') pushWorkOrder();
    else if (intent === 'note') pushNote(text);
  }

  function rate(b, v) {
    b.rated = b.rated === v ? null : v;
    if (b.rated) toast(v === 'up' ? 'Thanks — noted for this answer' : 'Thanks — I’ll take that into account', v === 'up' ? 'success' : 'warn');
  }
  function copyBlock(b) {
    const t = blockText(b);
    if (!t) return;
    navigator.clipboard?.writeText(t);
    b.copied = true;
    setTimeout(() => { b.copied = false; }, 1600);
    toast('Copied to clipboard', 'success');
  }

  // what the thread reads as in Markdown — used by both Copy and Export
  function threadMarkdown() {
    const lines = [`# ServiceOps AI · ${props.board.name}`, ''];
    thread.value.forEach((b) => {
      if (b.kind === 'user') { lines.push(`**You:** ${b.text}`, ''); return; }
      if (b.shownLines?.length) { lines.push(...b.shownLines.map((l) => `> ${l}`), ''); return; }
      if (b.points?.length) { b.points.forEach((g) => { lines.push(`### ${g.title}`); g.points.forEach((p) => lines.push(`- ${p}`)); lines.push(''); }); return; }
      if (b.facts?.length) { b.facts.forEach((f) => lines.push(`- ${f.text} _(${f.chip})_`)); lines.push(''); return; }
      if (b.text) { lines.push(`> ${b.text}`, ''); }
    });
    return lines.join('\n');
  }
  function runPanelMenu(m) {
    menuOpen.value = false;
    if (m.key === 'clear') { thread.value = []; activeAction.value = null; showSuggest.value = false; toast('Conversation cleared'); return; }
    if (m.key === 'copy') { navigator.clipboard?.writeText(threadMarkdown()); toast('Copied the conversation as Markdown', 'success'); return; }
    if (m.key === 'export') { toast('Exporting this conversation…'); return; }
    if (m.key === 'history') { toast('Chat history runs on-prem — opening your past conversations'); return; }
    if (m.key === 'share') { toast('Share this conversation with a technician or group'); return; }
    toast('AI settings — model, grounding and on-prem options');
  }

  const placeholder = AWAIT_PH[awaiting.value] || activeAction.value?.placeholder || DEFAULT_PH;
  // exactly one popup at a time: the palette wins, else the picked command's suggestions
  const popupOpen = cmdOpen.value || !!(activeAction.value && showSuggest.value);
  // typing "/find" filters the palette down as you go
  const slashQ = () => (input.value.startsWith('/') ? input.value.slice(1).trim().toLowerCase() : '');
  const cmdListOf = () => {
    const q = slashQ();
    return q ? ACTIONS.filter((a) => a.label.toLowerCase().startsWith(q) || a.key.startsWith(q)) : ACTIONS;
  };
  const slashQuery = slashQ();
  const cmdList = cmdListOf();

  function toggleCmd() {
    cmdOpen.value = !cmdOpen.value; cmdIndex.value = 0;
    if (cmdOpen.value) { showSuggest.value = false; requestAnimationFrame(() => inputEl.current?.focus()); }
  }
  function pickCommand(a) {
    activeAction.value = a;
    cmdOpen.value = false;
    input.value = ''; // drop the "/query" that opened the palette
    showSuggest.value = true; // its suggestions open with it…
    sugIndex.value = 0; // …with the first one already under the keyboard
    requestAnimationFrame(() => inputEl.current?.focus());
  }
  function clearCommand() { activeAction.value = null; showSuggest.value = false; requestAnimationFrame(() => inputEl.current?.focus()); }

  function onInput() {
    if (input.value.startsWith('/')) { cmdOpen.value = true; cmdIndex.value = 0; return; }
    cmdOpen.value = false;
    // …and fade away the moment the user starts writing their own prompt
    if (input.value.trim()) showSuggest.value = false;
  }
  /* The keyboard carries all the way through: "/" opens the palette, ↑↓ + ↵ picks a
   * command, then ↑↓ + ↵ runs one of THAT command's suggestions — never breaking to
   * the mouse mid-flow. Enter is handled here (not on keyup) so one keypress can't
   * both pick a suggestion and submit the composer. */
  function onKeydown(e) {
    const list = cmdListOf();
    // 1 — the command palette
    if (cmdOpen.value && list.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdIndex.value = (cmdIndex.value + 1) % list.length; return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); cmdIndex.value = (cmdIndex.value - 1 + list.length) % list.length; return; }
      if (e.key === 'Enter') { e.preventDefault(); pickCommand(list[cmdIndex.value]); return; }
      if (e.key === 'Escape') { e.preventDefault(); cmdOpen.value = false; return; }
      return;
    }
    // 2 — the picked command's suggestions
    const prompts = activeAction.value?.prompts || [];
    if (showSuggest.value && prompts.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sugIndex.value = (sugIndex.value + 1) % prompts.length; return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); sugIndex.value = (sugIndex.value - 1 + prompts.length) % prompts.length; return; }
      if (e.key === 'Enter') { e.preventDefault(); runPrompt(prompts[sugIndex.value]); return; }
      if (e.key === 'Escape') { e.preventDefault(); showSuggest.value = false; return; }
    }
    // 3 — plain composer
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'Escape') { showSuggest.value = false; return; }
    // backspace on an empty composer pops the command chip off
    if (e.key === 'Backspace' && !input.value && activeAction.value) clearCommand();
  }
  function runPrompt(p) { showSuggest.value = false; activeAction.value = null; pushUser(p.label); dispatch(p.intent, p.label); }

  // ---- interactions ----
  function submit() {
    const text = input.value.trim();
    if (!text || text.startsWith('/')) return;
    const cmd = activeAction.value;
    input.value = '';
    showSuggest.value = false;
    activeAction.value = null;
    // a create-flow step is waiting on this message — it owns the input
    if (awaiting.value === 'dash-intent') { dashIntent(text); return; }
    if (awaiting.value === 'dash-refine') { refineDash(text); return; }
    if (awaiting.value === 'widget-intent') { widgetIntent(text); return; }
    if (awaiting.value === 'widget-refine') { awaiting.value = null; refineWidget(text); return; }
    if (awaiting.value === 'newboard-name') { newBoardNamed(text); return; }
    if (awaiting.value === 'suggest-newboard') { suggestNewBoardNamed(text); return; }
    if (awaiting.value === 'dash-widget') { dashWidget(text); return; }
    pushUser(cmd ? `${cmd.label}: ${text}` : text);
    dispatch(cmd ? CMD_INTENT[cmd.key] : routeIntent(text), text);
  }
  function suggest(s) { pushUser(s.label); dispatch(s.intent, s.label); }
  // One action per fact: Investigate → spotlight the widget + a written briefing + 3 actions
  // (the "why" is folded into the narrative, so a separate Explain link is no longer needed).
  function investigate(fact) { pushUser(`Investigate: ${fact.chip}`); pushDrill(fact.chip, fact); }

  // external trigger — no auto-summary; the panel opens to the greeting empty state.
  function trigger(intent, label) {
    pushUser(label);
    dispatch(intent, label);
  }
  useImperativeHandle(ref, () => ({ trigger }));

  // The empty-state greeting (dashboard context — mirrors the ticket chat).
  const firstName = (store.currentUser || 'there').split(' ')[0];

  useEffect(() => {
    const s = thread.value.find((b) => b.kind === 'summary');
    if (s) s.facts = computeFacts(props.board, props.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawProps.role]);

  if (!rawProps.open) return null;
  const board = rawProps.board;
  const d = draft.value;

  /* ── one block of the thread ─────────────────────────────────────────────── */
  const renderBody = (b) => {
    // user echo
    if (b.kind === 'user') return <div className="user"><span>{b.text}</span></div>;

    // SHARED thinking phase — any answer block still reasoning
    if (b.phase === 'thinking') return (
      <div className="think">
        <span className="think-orb"><Icon name="sparkles" size={15} /></span>
        <div className="think-main">
          <div className="think-t">{thinkLabel(b)}<span className="think-dots"><i /><i /><i /></span></div>
          <div className="think-steps">
            {shownSteps(b).map((s) => (
              <div key={s.text} className={`tstep ${s.state}`}>
                <span className="tstep-ic">{s.state === 'done' ? <Icon name="check" size={12} /> : <span className="tspin" />}</span>
                <span className="tstep-x">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    /* Deep dive — verdict, receipts, drivers, consequence. Structured so it is
       scanned, not read: four paragraphs of prose hide the insight inside them. */
    if (b.kind === 'deepdive') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Read {b.tile ? 'this widget' : 'every widget on this board'} in full</div>
        <div className="blk-h"><Icon name="insights" size={14} /> Deep dive · {b.scope}</div>
        {b.verdict && (
          <div className={`vd ${b.verdict.tone}`}>
            <div className="vd-tag">{b.verdict.tone === 'bad' ? 'Needs action' : b.verdict.tone === 'warn' ? 'Watch' : 'Steady'}</div>
            <div className="vd-h">{b.headline}{!b.showExtras && <span className="caret" />}</div>
            {b.showExtras && <div className="vd-s" dangerouslySetInnerHTML={H(b.verdict.sub)} />}
          </div>
        )}
        {b.showExtras && (
          <div className="reveal">
            {b.readings.length > 0 && (
              <div className="rd">
                {b.readings.map((r, i) => (
                  <div key={i} className={`rd-c ${r.severity || ''}`}>
                    <div className="rd-l">{r.label}</div>
                    <div className="rd-v">{r.value}{r.delta && <span className={`rd-d ${r.dir || ''}`}>{r.delta}</span>}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="sec-l">What’s driving it</div>
            {b.drivers.map((dv, i) => i < b.shownDrivers && (
              <div key={i} className="dv reveal">
                <div className="dv-t">{dv.title}</div>
                {/* one measure per line: a comma-separated run of five metrics and
                    five percentages is unreadable at this width */}
                {dv.lines && (
                  <div className="dv-ls">
                    {dv.lines.map((l, li) => <div key={li} className="dv-li" dangerouslySetInnerHTML={H(l)} />)}
                    {dv.more && <div className="dv-li muted">and {dv.more} more</div>}
                  </div>
                )}
                <div className="dv-b" dangerouslySetInnerHTML={H(dv.body)} />
              </div>
            ))}
            {b.settled && b.meaning && (
              <div className="mn">
                <div className="mn-h"><Icon name="bulb" size={13} /> What it means</div>
                <div className="mn-b" dangerouslySetInnerHTML={H(b.meaning)} />
              </div>
            )}
          </div>
        )}
      </>
    );

    /* What needs attention — recommendations, not a restated threshold list. Every
       item states WHY IT MATTERS and carries the steps to take; anything already
       moving the right way is reported separately so nobody works on it. */
    if (b.kind === 'focus') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Ranked by what has a deadline attached</div>
        <div className="blk-h"><Icon name="auto-graph" size={14} /> What needs attention · {b.scope}</div>
        {b.lead && <p className="foc-lead">{b.lead}</p>}
        <div className="foc">
          {b.items.map((it, i) => i < b.shown && (
            <div key={it.id} className={`foc-i reveal ${it.severity || ''}`} onMouseEnter={() => emit('cite', it.tileId)} onMouseLeave={() => emit('cite', null)}>
              <div className="foc-hd">
                <span className={`foc-n ${dotClass(it.severity)}`}>{it.rank}</span>
                <div className="foc-t" dangerouslySetInnerHTML={H(it.title)} />
              </div>
              <div className="foc-why"><b>Why it matters</b> <span dangerouslySetInnerHTML={H(it.why)} /></div>
              <div className="foc-next"><b>What to do</b> <span dangerouslySetInnerHTML={H(it.next)} /></div>
            </div>
          ))}
          {b.settled && !b.items.length && <div className="calm"><Icon name="check" size={16} /> Nothing needs action here right now.</div>}
          {/* what was deliberately left off the list, and why. The judgement about
              what NOT to act on is half of what makes this an answer. */}
          {b.settled && b.notes.length > 0 && (
            <div className="imp">
              <div className="imp-h"><Icon name="check" size={13} /> Not on the action list</div>
              {b.notes.map((n, i) => <div key={i} className={`imp-r ${n.tone || ''}`}>{n.text}</div>)}
            </div>
          )}
        </div>
      </>
    );

    // P1 summary — facts revealed one at a time
    if (b.kind === 'summary') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Reasoned in {b.steps ? b.steps.length : 3} steps · ranked for your role</div>
        <div className="blk-h"><Icon name="sparkles" size={14} /> What needs attention <span className="updated">updated {FRESHNESS}</span></div>
        <div className="facts">
          {b.facts.map((f, fi) => fi < b.shown && (
            <div key={f.id} className="fact reveal" onMouseEnter={() => emit('cite', f.tileId)} onMouseLeave={() => emit('cite', null)}>
              <span className={`dot ${dotClass(f.severity)}`} />
              <div className="fb">
                <div className="ftext" dangerouslySetInnerHTML={H(f.text)} />
                <div className="fmeta">
                  <span className="cite"><Icon name="chart-bar" size={11} /> {f.chip}</span>
                  <button className="lnk" onClick={() => investigate(f)}>Investigate →</button>
                </div>
              </div>
            </div>
          ))}
          {b.settled && !b.facts.length && <div className="calm"><Icon name="check" size={16} /> Nothing unusual — all {board.tiles.length} widgets are within range.</div>}
        </div>
      </>
    );

    // What changed since last visit — compact cards revealed one at a time
    if (b.kind === 'changes') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Diffed every metric against your last visit</div>
        <div className="blk-h"><Icon name="history" size={14} /> What changed since your last visit</div>
        <div className="lastvisit"><Icon name="clock" size={12} /> Last visit: {b.data.lastVisit}</div>
        <div className="chg-grid">
          {b.data.items.map((it, i) => i < b.shown && (
            <div key={i} className={`chgc reveal ${it.severity || ''} ${it.note ? 'hasnote' : ''}`} title={it.note || undefined}>
              <div className="chgc-top">
                <span className={`chgc-ico ${it.dir || ''}`}><Icon name={it.dir === 'down' ? 'sort-desc' : 'sort-asc'} size={13} /></span>
                <span className={`chgc-delta ${it.dir || ''}`}>{it.delta}</span>
              </div>
              <div className="chgc-name">{it.widget}</div>
              <div className="chgc-val">Now <b>{it.value}</b></div>
            </div>
          ))}
        </div>
      </>
    );

    // Summarize / Ask about this dashboard — written summary (post-thinking)
    if (b.kind === 'analyzing') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Read {board.tiles.length} widgets and ranked what matters</div>
        <div className="blk-h"><Icon name="sparkles" size={14} /> Dashboard summary</div>
        {b.points.map((g, gi) => (
          <div key={gi} className="sum-grp">
            <div className="sum-gt">{g.title}</div>
            <ul className="sum-list">{g.points.map((p, pi) => <li key={pi} dangerouslySetInnerHTML={H(p)} />)}</ul>
          </div>
        ))}
      </>
    );

    // Every widget explained — the detail the summary card has no room for
    if (b.kind === 'widgets') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Every widget on this board, read one by one</div>
        <div className="blk-h"><Icon name="auto-graph" size={14} /> Widget-by-widget</div>
        {!b.rows.length && <div className="calm"><Icon name="check" size={16} /> <span>This board has no widgets yet.</span></div>}
        {b.rows.slice(0, b.shown).map((w) => (
          <div key={w.id} className="wrow">
            <div className="wrow-h">
              <span className={`wdot ${dotClass(w.status)}`} />
              <b className="wrow-t">{w.title}</b>
              <span className="wrow-k">{w.kind}</span>
              <span className="wrow-v">{w.headline}</span>
            </div>
            <p className="wrow-s" dangerouslySetInnerHTML={H(w.summary)} />
          </div>
        ))}
      </>
    );

    // Draft a status update — a copy-ready update, not a metric list
    if (b.kind === 'status') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Written from what needs attention right now</div>
        <div className="blk-h"><Icon name="file-text" size={14} /> Status update</div>
        <div className="subj"><span>Subject</span><b>{b.data.subject}</b></div>
        {b.shownLines.map((line, i) => <p key={i} className="say" dangerouslySetInnerHTML={H(line)} />)}
        {b.cur && <p className="say"><span dangerouslySetInnerHTML={H(b.cur)} /><span className="caret" /></p>}
      </>
    );

    // Turn this into a recovery plan — ordered, each step with its reason
    if (b.kind === 'plan') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Ordered by which deadline lands first</div>
        <div className="blk-h"><Icon name="clipboard" size={14} /> Recovery plan</div>
        <p className="say">{b.data.intro}</p>
        <ol className="nsteps">
          {b.data.steps.map((s, si) => si < b.shown && <li key={si} className="reveal"><b>{s.title}</b> — <span dangerouslySetInnerHTML={H(s.body)} /></li>)}
        </ol>
      </>
    );

    // What should I work on first — a ranked queue with the why
    if (b.kind === 'worklist') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Ranked for your role · deadline first</div>
        <div className="blk-h"><Icon name="flag" size={14} /> Work on this first</div>
        {b.items.map((it, i) => i < b.shown && (
          <div key={i} className="wq reveal">
            <span className={`wq-n ${dotClass(it.severity)}`}>{it.rank}</span>
            <div className="wq-b">
              <div className="wq-t" dangerouslySetInnerHTML={H(it.text)} />
              <div className="wq-w">{it.why}</div>
              <button className="lnk" onClick={() => investigate({ kind: 'delta', tileId: it.tileId, chip: it.chip, text: it.text })}>Investigate →</button>
            </div>
          </div>
        ))}
        {b.settled && !b.items.length && <div className="calm"><Icon name="check" size={16} /> Nothing is competing for your attention — the board is within range.</div>}
      </>
    );

    // P3 explain — the verdict streams in, then the sparkline/how/CTA reveal
    if (b.kind === 'explain') {
      const sp = b.anomaly ? spark(b.anomaly) : null;
      return (
        <>
          <div className="reasoning"><span className="rz-dot" /> {b.anomaly ? 'Compared it against its own recent history' : 'Checked it against its normal range'}</div>
          <div className={`blk-h ${b.anomaly ? b.anomaly.severity : ''}`}>
            <Icon name={b.anomaly ? 'alert' : 'info'} size={14} /> {b.tile.title}
          </div>
          {b.shownLines.map((line, i) => <p key={i} className="say" dangerouslySetInnerHTML={H(line)} />)}
          {b.cur && <p className="say"><span dangerouslySetInnerHTML={H(b.cur)} /><span className="caret" /></p>}
          {b.showExtras && (
            <div className="reveal">
              {sp && (
                <div className="spark">
                  <svg viewBox={`0 0 ${sp.W} ${sp.H}`} preserveAspectRatio="none">
                    <line x1={0} x2={sp.W} y1={sp.meanY} y2={sp.meanY} className="mean" />
                    <path d={sp.line} className="sl" />
                    <circle cx={sp.last.x} cy={sp.last.y} r="3.2" className={'pt ' + b.anomaly.severity} />
                  </svg>
                </div>
              )}
              {b.anomaly && <details className="how"><summary><Icon name="info" size={12} /> How was this calculated?</summary><div>{b.anomaly.how}</div></details>}
              {/* carry the real tile through, or the drill has no widget to spotlight and renders empty */}
              <button className="btn btn-sm mini-cta" onClick={() => investigate({ kind: b.anomaly ? 'anomaly' : 'delta', tileId: b.tile.id, chip: b.tile.title, text: `The records behind ${b.tile.title}` })}>Investigate <Icon name="chevron-right" size={13} /></button>
            </div>
          )}
        </>
      );
    }

    // P2 drill — spotlight, then the briefing streams line-by-line
    if (b.kind === 'drill') return (
      <>
        <div className="blk-h"><Icon name="insights" size={14} /> {b.fact.text}</div>
        {b.showSpot && b.widget && <div className="spot reveal"><Icon name="target" size={12} /> Spotlighted <b>“{b.widget}”</b> on the dashboard</div>}
        {b.shownLines.map((line, i) => <p key={i} className="say" dangerouslySetInnerHTML={H(line)} />)}
        {b.cur && <p className="say"><span dangerouslySetInnerHTML={H(b.cur)} /><span className="caret" /></p>}
      </>
    );

    // ===== Generate with AI: conversational create flow =====
    if (b.kind === 'create-start') return (
      <>
        <div className="blk-h"><Icon name="wand" size={14} /> Generate with AI</div>
        <p className="say">What would you like to build? Just tell me what it's for — I'll handle the rest and only ask what I genuinely need.</p>
        <div className="opts">
          <button className="opt" onClick={startDash}><span className="opt-ic"><Icon name="layout" size={16} /></span><div><b>A new dashboard</b><span>Describe the intent — I'll draft and name it</span></div></button>
          <button className="opt" onClick={startWidget}><span className="opt-ic"><Icon name="chart-bar" size={16} /></span><div><b>A new widget</b><span>Describe the data — I'll configure and place it</span></div></button>
        </div>
      </>
    );

    // dashboard: state the intent (AI leads, user writes freely)
    if (b.kind === 'cd-intent') return (
      <>
        <div className="blk-h"><Icon name="layout" size={14} /> New dashboard</div>
        <p className="say">Tell me what this dashboard is <b>for</b> — the question you want it to answer every morning. Write it in the box below and I’ll draft it; if you don’t name it, I’ll name it for you.</p>
        <div className="ea-ctas starters">
          {DASH_STARTERS.map((s) => (
            <button key={s.label} className="ea-cta wrap" onClick={() => dashIntent(s.label)}><Icon name={s.icon} size={16} /> <span>{s.label}</span></button>
          ))}
        </div>
        <button className="lnk-row" onClick={() => useDashPrompt()}><Icon name="wand" size={13} /> Write the prompt for me</button>
      </>
    );

    // widget: the AI shortlists widgets to ADD; the user ticks and places them
    if (b.kind === 'cw-suggest' && b.settled) return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Read this board and left out what’s already here</div>
        <div className="blk-h"><Icon name="wand" size={14} /> Widgets you could add</div>
        <p className="say muted-say">Pick the ones you want — I’ll place them on the board. Or just describe a widget below and I’ll build that instead.</p>
        <div className="prop-list">
          {b.widgets.map((w, wi) => (
            <button key={wi} className={`sug-row ${b.picked.has(wi) ? 'on' : ''}`} onClick={() => togglePick(b, wi)}>
              <span className="sug-check">{b.picked.has(wi) && <Icon name="check" size={12} />}</span>
              <span className="prop-mod">{w.module}</span>
              <span className="prop-name">{w.name}</span>
              <span className="prop-viz">{w.viz}</span>
            </button>
          ))}
        </div>
        {!b.stale && (
          <div className="doneacts">
            <button className="btn btn-primary btn-sm add" onClick={() => acceptSuggest(b, 'current')}>
              <Icon name="plus" size={14} /><span>Add to “{currentBoard().name}”</span>
            </button>
            <button className="btn btn-sm mini-cta" onClick={() => acceptSuggest(b, 'new')}>Add to a new dashboard</button>
            <button className="btn btn-sm mini-cta" onClick={() => regenerateSuggest(b)}>Suggest different ones</button>
          </div>
        )}
      </>
    );

    // dashboard: the whole board proposed at once, accepted in one click
    if (b.kind === 'cd-proposal') return (
      <div className="prop">
        <div className="prop-h">Here’s my proposal — <b>{b.name}</b></div>
        <span className="prop-match">{b.proposal.match}% match</span>
        <div className="prop-meta">Category {b.proposal.category} · {b.proposal.widgets.length} widgets · design guidelines applied</div>
        <div className="prop-list">
          {b.proposal.widgets.map((w, wi) => (
            <div key={wi} className="prop-row">
              <span className="prop-mod">{w.module}</span>
              <span className="prop-name">{w.name}</span>
              <span className="prop-viz">{w.viz}</span>
            </div>
          ))}
        </div>
        {!b.stale && (
          <div className="prop-acts">
            <button className="btn btn-primary btn-sm pact go" onClick={() => acceptProposal(b, 'new')}>Create dashboard</button>
            <button className="btn btn-sm pact" onClick={() => improveProposal(b)}>Improve anything</button>
          </div>
        )}
      </div>
    );

    // dashboard: everything placed in one go
    if (b.kind === 'cd-placed') return (
      <div className="calm">
        <Icon name="check" size={16} />
        <span>Added <b className="nm">{b.count}</b> widgets to <b>{b.dash.name}</b>{b.madeBoard && <span> — a new dashboard</span>}.</span>
      </div>
    );

    // dashboard: what the AI drafted, with the name it chose highlighted
    if (b.kind === 'cd-draft') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Drafted from your intent</div>
        <div className="blk-h"><Icon name="wand" size={14} /> Here’s what I’ll build</div>
        <ul className="sum-list">{(b.plan || []).map((p, pi) => <li key={pi}>{p}</li>)}</ul>
        <p className="say named">
          I’ve called it <b className="nm">{b.name}</b>
          {b.namedByAi && <span className="nm-note">— my suggestion, rename it any time.</span>}
        </p>
        <div className="chipsrow mini">
          <button className="sg go" onClick={() => continueDash()}>Looks good — continue</button>
          <button className="sg" onClick={() => focusComposer()}>Something’s missing</button>
        </div>
      </>
    );

    // dashboard: build its widgets, before any admin questions
    if (b.kind === 'cd-widgets') return (
      <>
        <div className="blk-h"><Icon name="chart-bar" size={14} /> Now let’s fill it</div>
        <p className="say">“<b>{d.name}</b>” is created. Tell me what to put on it — describe a widget and I’ll pick the clearest way to draw it. You can add as many as you like, one message at a time.</p>
        <div className="sub-h">What I can build <span className="muted">tap one to prefer it</span></div>
        <div className="wtypes">
          {WIDGET_TYPES.map((w) => (
            <button key={w.id} className={`wtype ${d.preferKind === w.id ? 'on' : ''}`} onClick={() => preferType(w.id)}>
              {w.icon ? <Icon name={w.icon} size={18} className="wt-i" /> : <span className={`wt-g ${w.id}`} />}
              <span className="wt-l">{w.label}</span>
              <span className="wt-h">{w.hint}</span>
            </button>
          ))}
        </div>
        <div className="chipsrow mini">
          <button className="sg" onClick={() => finishWidgets()}>Skip — no widgets for now</button>
        </div>
      </>
    );

    // dashboard: I need more before I can build what was asked for
    if (b.kind === 'cd-need') return (
      <>
        <div className="blk-h"><Icon name="info" size={14} /> I need a bit more</div>
        {b.partial
          ? <p className="say">That’s the {b.have} I could read clearly. You asked for <b>{b.want}</b> more — tell me what {b.want === 1 ? 'it' : 'they'} should show and I’ll build {b.want === 1 ? 'it' : 'them'} too.</p>
          : <p className="say">Happy to build {b.want === 1 ? 'it' : `all ${b.want}`} — I just need to know what {b.want === 1 ? 'it' : 'each one'} should show. Describe {b.want === 1 ? 'it' : 'them'} below, one per line.</p>}
        <p className="say muted-say">For example: “overdue requests by team”, “backlog trend over 6 months”, “a list of the open P1s”.</p>
      </>
    );

    // dashboard: a widget just built into it
    if (b.kind === 'cd-widget') return (
      <>
        <div className="calm">
          <Icon name="check" size={16} />
          <span>Added <b className="nm">{b.tile.title}</b> to the board.</span>
          {b.total > 1 && <span className="ofn">{b.idx} of {b.total}</span>}
        </div>
        <div className="wprev">
          <div className="wp-h"><b>{b.tile.title}</b><span className="pv">Live preview</span></div>
          <TilePreview tile={b.tile} />
        </div>
        <CondChips cfg={b.cfg} />
        {/* only after the LAST of a batch, so a 3-widget request doesn't repeat these */}
        {b.last && (
          <div className="chipsrow mini">
            <button className="sg" onClick={() => moreWidgets()}>Add another widget</button>
            <button className="sg go" onClick={() => finishWidgets()}>That’s everything — show me the dashboard</button>
          </div>
        )}
      </>
    );

    // dashboard: everything built, on the board itself
    if (b.kind === 'cd-recap') return (
      <>
        <div className="reasoning"><span className="rz-dot" /> You’re looking at it now</div>
        <div className="blk-h"><Icon name="check" size={14} /> Here’s what I built</div>
        <p className="say">“<b>{b.dash.name}</b>” now has <b>{b.built.length}</b> widget{b.built.length === 1 ? '' : 's'} on it:</p>
        <ul className="sum-list">
          {b.built.map((t, ti) => <li key={ti}><b>{t.title}</b> — {t.type === 'chart' ? `${t.chart.kind} chart` : t.type === 'kpi' ? 'headline number' : 'record list'}</li>)}
          {!b.built.length && <li>Nothing yet — it’s an empty board for now.</li>}
        </ul>
        <p className="say muted-say">Have a look at the canvas behind this panel. If anything’s off, tell me and I’ll change it — otherwise I just need two last things.</p>
        <div className="chipsrow mini">
          <button className="sg go" onClick={() => confirmRecap()}>Looks good — finish setup</button>
          <button className="sg" onClick={() => changeRecap()}>Change something</button>
        </div>
      </>
    );

    // dashboard: created
    if (b.kind === 'cd-done') return (
      <>
        <div className="calm"><Icon name="check" size={16} /> <span><b className="nm">{b.dash.name}</b> is set up{b.built ? <span> with {b.built} widget{b.built === 1 ? '' : 's'}</span> : null}.</span></div>
        {b.namedByAi && <p className="say muted-say">I named it for you — open it and rename from the board header if you'd like something else.</p>}
        <div className="doneacts">
          <button className="btn btn-primary btn-sm add" onClick={() => openBoard(b.dash)}><Icon name="open-in" size={14} /><span>Open it</span></button>
          <button className="btn btn-sm mini-cta" onClick={startWidget}>Add a widget with AI <Icon name="chevron-right" size={13} /></button>
        </div>
      </>
    );

    // widget: state the intent
    if (b.kind === 'cw-intent') return (
      <>
        <div className="blk-h"><Icon name="chart-bar" size={14} /> New widget</div>
        <p className="say">Describe what it should show and which data it should come from{d.dash ? ` on “${d.dash.name}”` : ''} — write it below and I’ll configure it.</p>
        <div className="ea-ctas starters">
          {WIDGET_STARTERS.map((s) => (
            <button key={s.label} className="ea-cta wrap" onClick={() => widgetIntent(s.label)}><Icon name={s.icon} size={16} /> <span>{s.label}</span></button>
          ))}
        </div>
        <button className="lnk-row" onClick={() => useWidgetPrompt()}><Icon name="wand" size={13} /> Write the prompt for me</button>
      </>
    );

    // widget: the one the AI built — preview, chart-type preference, add or change
    // only once resolved: an unsettled block is one paused on the grouping question
    if (b.kind === 'cw-build' && b.settled) return (
      <>
        <div className="reasoning"><span className="rz-dot" /> Configured from your description</div>
        <div className="blk-h"><Icon name="wand" size={14} /> Here’s a preview — {b.title}</div>
        <div className="wmeta">{b.module} · {b.spec.kind === 'shortcut' ? 'Records' : 'Count'} · {VIZ_WORD[b.spec.kind] || b.spec.kind}</div>
        <div className="wprev">
          <div className="wp-h"><b>{b.title}</b><span className="pv">Preview</span></div>
          <TilePreview tile={b.tile} />
        </div>
        {/* one-tap re-draw: every form the data supports, switched in place — a segmented
            choice, so it is the product's pill-track */}
        <div className="pill-track kindrow">
          {WIDGET_KINDS.map((k) => (
            <button key={k.id} aria-pressed={b.spec.kind === k.id} onClick={() => setBuildKind(b, k.id)}>{k.label}</button>
          ))}
        </div>
        <CondChips cfg={b.cfg} />
        {/* inside a board being built, the next move is finishing the board; on its
            own, it's choosing where the widget lands. Only the newest preview acts. */}
        {!b.stale && (
          <div className="doneacts">
            {b.inDash ? (
              <>
                <button className="btn btn-primary btn-sm add" onClick={() => confirmWidget(b, 'finish')}><Icon name="check" size={14} /><span>Create dashboard</span></button>
                <button className="btn btn-sm mini-cta" onClick={() => changeWidget(b)}>Change something <Icon name="chevron-right" size={13} /></button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-sm add" onClick={() => confirmWidget(b)}><Icon name="plus" size={14} /><span>Add to “{currentBoard().name}”</span></button>
                <button className="btn btn-sm mini-cta" onClick={() => confirmWidget(b, 'other')}>Add to another</button>
                <button className="btn btn-sm mini-cta" onClick={() => changeWidget(b)}>Change something <Icon name="chevron-right" size={13} /></button>
              </>
            )}
          </div>
        )}
      </>
    );

    // widget: name the new board it should land on
    if (b.kind === 'cw-newboard') return <p className="say">What should the new dashboard be called? I’ll create it and drop the widget straight in.</p>;

    // widget: added — with the real thing previewed inline, as it renders on the board
    if (b.kind === 'cw-done') return (
      <>
        <div className="calm">
          <Icon name="check" size={16} />
          <span>Added <b className="nm">{b.tile.title}</b> to <b>{b.dash.name}</b>{d.createdBoard && <span> — a new dashboard I created for it</span>}.</span>
        </div>
        <div className="wprev">
          <div className="wp-h"><b>{b.tile.title}</b><span className="pv">Live preview</span></div>
          <TilePreview tile={b.tile} />
        </div>
        {/* the conditions it landed with, so "added" is checkable and not just claimed */}
        <CondChips cfg={b.cfg} />
      </>
    );

    // numbered next steps, written as prose (only after a task that leaves a decision)
    if (b.kind === 'nextsteps') return (
      <>
        <p className="say">{b.intro}</p>
        <p className="say">Would you like me to take any of these next steps?</p>
        <ol className="nsteps">
          {b.steps.map((s, si) => (
            <li key={si}><button className="nstep" onClick={() => runNextStep(s)}><b>{s.title}</b><span> — {s.body}</span></button></li>
          ))}
        </ol>
        <p className="say muted-say">What would you like to do next?</p>
      </>
    );

    // "write the prompt for me" — the questions we need, and angles to answer them
    if (b.kind === 'prompt-help') return (
      <>
        <div className="blk-h"><Icon name="wand" size={14} /> Let me write it</div>
        <p className="say">{b.intro}</p>
        <div className="needs">
          {b.needs.map((n, ni) => <div key={ni} className="need"><span className="need-n">{ni + 1}</span>{n}</div>)}
        </div>
        <ol className="nsteps">
          {b.approaches.map((ap) => (
            <li key={ap.id}><button className="nstep" onClick={() => writePrompt(b, ap)}><b>{ap.title}</b><span> — {ap.body}</span></button></li>
          ))}
        </ol>
        <p className="say muted-say">Pick one and I’ll drop the finished prompt into the box below — edit it however you like before sending.</p>
      </>
    );

    // the one question card used by every mandatory question
    if (b.kind === 'ask') return (
      <div className={`askc ${b.answered ? 'done' : ''}`}>
        <div className="ask-h">
          <div className="ask-qs"><span className="ask-q">{b.q}</span>{b.sub && !b.answered && <span className="ask-sub">{b.sub}</span>}</div>
          <span className="ask-step">{b.step} of {b.total}</span>
        </div>
        {!b.answered ? (
          <>
            {b.askId === 'vis' ? (
              /* Public / Private / Restricted is a segmented choice, so it answers in the
                 product's pill-track rather than as numbered rows */
              <div className="pill-track vis-pills">
                {b.options.map((o) => <button key={o.value} aria-pressed={false} onClick={() => answerAsk(b, o)}>{o.label.split(' — ')[0]}</button>)}
              </div>
            ) : b.options.map((o, oi) => (
              <button key={o.value} className="ask-opt" onClick={() => answerAsk(b, o)}>
                <span className="ask-n">{oi + 1}</span>
                <span className="ask-l">{o.label}</span>
                <Icon name="chevron-right" size={14} className="ask-arrow" />
              </button>
            ))}
            <div className="ask-foot">
              {b.askId !== 'vis' && (
                <span className="ask-other">
                  <Icon name="edit" size={13} />
                  <AskOther b={b} onEnter={(v) => answerAsk(b, null, v)} />
                </span>
              )}
              {b.skippable && <button className="btn btn-sm ask-skip" onClick={() => answerAsk(b, null, '__skip')}>Skip</button>}
            </div>
          </>
        ) : <div className="ask-answered"><Icon name="check" size={13} /> {b.answered}</div>}
      </div>
    );

    // short templated reply (edit / schedule)
    if (b.kind === 'note') return (
      <>
        <div className="blk-h"><Icon name="sparkles" size={14} /> ServiceOps AI</div>
        <p className="say">{b.text}</p>
      </>
    );
    return null;
  };

  return (
    <aside className="dc-AiAssistant asst card">
      {/* header */}
      <div className="ah">
        <div className="ah-l"><span className="spk"><Icon name="sparkles" size={16} /></span>
          <div><div className="ah-t">ServiceOps AI</div><div className="ah-sub">{board.name} · {board.tiles.length} widgets</div></div>
        </div>
        <div className="ah-r">
          <button className="x" title="More" onClick={(e) => { e.stopPropagation(); menuOpen.value = !menuOpen.value; }}><Icon name="dots-v" size={17} /></button>
          <button className="x" title="Close" onClick={() => emit('update:open', false)}><Icon name="x" size={17} /></button>
          {menuOpen.value && (
            <div className="ahmenu" onClick={(e) => e.stopPropagation()}>
              {PANEL_MENU.map((m) => (
                <button key={m.key} className={`ahm-item ${m.danger ? 'danger' : ''}`} onClick={() => runPanelMenu(m)}>
                  <Icon name={m.icon} size={15} /> {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {menuOpen.value && <div className="ahmenu-back" onClick={() => { menuOpen.value = false; }} />}

      {/* thread */}
      <div ref={bodyEl} className="ab">
        {/* greeting empty state (mirrors the ServiceOps ticket chat) */}
        {!thread.value.length && (
          <div className="empty-ai">
            <span className="ea-orb"><Icon name="sparkles" size={26} /></span>
            <h3>Hello {firstName}, how can we help?</h3>
            <p>Ask ServiceOps AI anything about this dashboard, or get help with insights, changes and building widgets.</p>
            <div className="ea-ctas">
              {EMPTY_CTAS.map((c) => (
                <button key={c.label} className="ea-cta" onClick={() => suggest(c)}><Icon name={c.icon} size={16} /> <span>{c.label}</span></button>
              ))}
            </div>
          </div>
        )}

        {thread.value.map((b) => (
          <div key={b.id} className={`blk ${b.kind}`}>
            {renderBody(b)}

            {/* rate / copy this answer */}
            {hasFeedback(b) && (
              <div className="fb-row">
                <button className={`fbtn ${b.rated === 'up' ? 'on' : ''}`} title="Good answer" onClick={() => rate(b, 'up')}><Icon name="thumb-up" size={14} /></button>
                <button className={`fbtn ${b.rated === 'down' ? 'on' : ''}`} title="Not helpful" onClick={() => rate(b, 'down')}><Icon name="thumb-down" size={14} /></button>
                <button className={`fbtn ${b.copied ? 'ok' : ''}`} title={b.copied ? 'Copied' : 'Copy'} onClick={() => copyBlock(b)}>
                  <Icon name={b.copied ? 'check' : 'copy'} size={14} />
                </button>
              </div>
            )}

            {/* contextual Follow ups (change with the answer) */}
            {isAnswer(b) && (
              <div className="fu-sec">
                <div className="fu-h">Follow ups</div>
                <div className="fu-list">
                  {followUpsFor(b).map((f) => (
                    <button key={f.label} className="fu" onClick={() => suggest(f)}>
                      <Icon name="chevron-right" size={14} className="fu-arrow" /> <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* composer: + / "/" command palette, the picked command's suggestions, then the input */}
      <div className="af">
        {/* ONE popup slot: the command palette, or the picked command's suggestions.
            Sharing a single element keeps them mutually exclusive. */}
        {popupOpen && (
          <div className={`actpop ${cmdOpen.value ? 'cmdpop' : ''}`}>
            {cmdOpen.value ? (
              <>
                {/* command palette (from + or typing "/") — icon + name, nothing else */}
                {cmdList.map((a, i) => (
                  <button key={a.key} className={`cmditem ${i === cmdIndex.value ? 'sel' : ''}`} onClick={() => pickCommand(a)} onMouseEnter={() => { cmdIndex.value = i; }}>
                    <Icon name={a.icon} size={15} />
                    <span className="cmd-l">{a.label}</span>
                  </button>
                ))}
                {!cmdList.length && <div className="cmd-none">No match for “{slashQuery}”</div>}
              </>
            ) : (
              <>
                {/* the picked command's suggestions — fade out once the user writes their own */}
                <div className="actpop-h"><Icon name={activeAction.value.icon} size={14} /> {activeAction.value.label}<button className="apx" onClick={() => { showSuggest.value = false; }}><Icon name="x" size={14} /></button></div>
                {activeAction.value.prompts.map((p, si) => (
                  <button key={p.label} className={`actprompt ${si === sugIndex.value ? 'sel' : ''}`} onClick={() => runPrompt(p)} onMouseEnter={() => { sugIndex.value = si; }}>
                    <Icon name={activeAction.value.icon} size={14} /> {p.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        <div className="inbox">
          <button className={`plusbtn ${cmdOpen.value ? 'on' : ''}`} title="Commands" onClick={toggleCmd}><Icon name="plus" size={17} /></button>
          {activeAction.value && (
            <span className="cmdchip">
              <Icon name={activeAction.value.icon} size={12} /> {activeAction.value.label}
              <button className="ccx" title="Remove command" onClick={clearCommand}><Icon name="x" size={11} /></button>
            </span>
          )}
          <input
            ref={inputEl} value={inputText} placeholder={placeholder}
            onChange={(e) => { input.value = e.target.value; onInput(); }} onKeyDown={onKeydown}
          />
          <button className={`send ${inputText.trim() ? 'ready' : ''}`} disabled={!inputText.trim()} onClick={submit}><Icon name="send" size={15} /></button>
        </div>
      </div>
    </aside>
  );
});
