/**
 * AI entry points — the nine ways the dashboard can surface its AI Summary / Assistant.
 * Each is a distinct place-and-shape the "Ask AI" affordance can take; the on-board
 * demo bar switches `store.ui.aiEntry` between them, one at a time, so the team can
 * compare them live. Every entry ultimately opens the same grounded AI Assistant
 * panel (or, for `card`, expands the summary in place).
 *
 * Derived from the competitor teardown (Amplitude, Stripe, Seline, Pipedrive, Rows,
 * Salesforce — see the Figma "Dashboards with AI" file) + docs/AI Capabilities…pdf.
 */
// The shortlisted entry points (after review). The side panel is the shared destination
// every entry opens into — not a tab. Per-widget "Ask AI" is now an always-on default on
// each tile, not a demo option. The prompt-bar and topbar-sparkle demos were cut.
export const AI_ENTRIES = [
  { id: 'card', n: '①', label: 'Summary card', ref: 'ServiceOps reference',
    desc: 'A pinned “AI Summary” card — expands to the dashboard summary + the dashboard-level action set: a data-aware “Why is [metric] up?”, plus Show-about-to-breach, Prioritize, What-changed, Ask, and Draft-handover.' },
  { id: 'toolbar', n: '②', label: 'Toolbar icon', ref: 'Pipedrive · Stripe',
    desc: 'A compact sparkle icon beside the board’s ⋯ menu — opens the assistant without competing with the global top-bar “Ask AI”.' },
  { id: 'addmenu', n: '③', label: 'Generate widget', ref: 'Amplitude',
    desc: '“Generate with AI” inside the + (Create) menu, alongside Create Dashboard / Widget — builds a single widget from a prompt.' },
  { id: 'createai', n: '④', label: 'Create dashboard', ref: 'Ask Zia · SpotterViz',
    desc: '“Create a dashboard with AI” in the + (Create) menu — describe a board and AI assembles it. Distinct from ③, which generates one widget.' },
  { id: 'nudge', n: '⑤', label: 'Onboarding nudge', ref: 'Salesforce',
    desc: 'A dismissible first-run banner grounded in the engine — it names what it found on THIS board, then steps out of the way. Calm-board fallback teaches without manufacturing urgency.' },
]

export const AI_DEFAULT = 'card'
