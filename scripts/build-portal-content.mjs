import fs from 'fs';
import os from 'os';
import path from 'path';

const T = 'C:/Users/ZENICH~1/AppData/Local/Temp/';
const rows = JSON.parse(fs.readFileSync(T + 'copy-rows.json', 'utf8'));
const templates = JSON.parse(fs.readFileSync(T + 'copy-templates.json', 'utf8'));
const ref = fs.readFileSync(T + 'ref.js', 'utf8');

/* templates the extractor caught that are class strings or config keys, not copy */
const TEMPLATE_NOISE = /^(\{|2px dashed|relative outline|\{iconBtn\}|rotate\(|\{p\}|\{part\}|\{weight\}|\{grow\}|\{4\})/;
for (const t of templates) {
  if (TEMPLATE_NOISE.test(t.value)) continue;
  if (/^\{[A-Za-z]+\}(Font|Weight|Size|Color|Format|Align)$/.test(t.value)) continue;
  t.ref = ref.includes(t.value.replace(/\{[^}]*\}/g, '')) ? 'same' : 'check';
  rows.push(t);
}

/* strings the extractor cannot see because they are built from parts at render time */
const MANUAL = [
  { file: 'PortalCanvas.tsx', line: 0, holder: 'AddSectionSeam', kind: 'assembled', value: '+ Add Section', note: 'the "+" and the words are separate nodes' },
  { file: 'PortalControls.tsx', line: 907, holder: 'UploadZone', kind: 'assembled', value: 'Suggested {size} px', note: 'the unit is appended by the control' },
];
MANUAL.forEach((m) => { m.ref = 'same'; rows.push(m); });

/* ── where each (file, holder) belongs, and what to call it ─────────────────── */
const AREAS = [
  ['Portal listing', /^AdminSupportPortalModule/],
  ['Create-a-portal dialog', /^(CreateSupportPortalModal|SupportPortalTemplateGallery)/],
  ['Settings tab', /^AdminSupportPortalSettings/],
  ['Builder — top bar and shell', /^SupportPortalBuilder/],
  ['Builder — the portal page', /^(SupportPortalPreview|supportPortalData|portalPageModel)/],
  ['Builder — canvas chrome', /^PortalCanvas/],
  ['Right rail 1 — Widgets panel', /^SupportPortalAddPanel/],
  ['Right rail 1 — element hover cards', /^PortalElementPreview/],
  ['Right rail 2 — Theme panel', /^PortalThemePanel/],
  ['Right rail 3 — Branding panel', /^PortalBrandingPanel/],
  ['Widget drawer — shell', /^PortalWidgetDrawer/],
  ['Widget settings — one row per widget', /^portalWidgetSpec/],
  ['Widget settings — collections', /^portalCollectionSpecs/],
  ['Widget settings — sections, columns, page and rails', /^portalStructureSpecs/],
  ['Widget settings — child text nodes', /^portalPanelSpecs/],
  ['Widget settings — shared style packs', /^PortalStylePacks/],
  ['Shared controls', /^(PortalControls|PortalItemList|SpacingMatrix|PortalContrastMeter)/],
  ['Pickers', /^(PortalIconPicker|PortalColorPicker)/],
  ['Table element', /^(PortalTable|portalTableModel)/],
  ['Element renderers on the page', /^(PortalPlacedElement|PortalCollectionRender)/],
  ['Legacy element panel', /^PortalElementPanel/],
];
const areaOf = (f) => (AREAS.find(([, re]) => re.test(f)) ?? ['Other', null])[0];

/* a friendly name for a spec block, taken from that block's own `name:` row */
const blockName = {};
rows.forEach((r) => { if (r.block && r.kind === 'name' && !blockName[r.block]) blockName[r.block] = r.value; });

const KIND_LABEL = {
  label: 'field label', name: 'name', title: 'title / tooltip', text: 'text',
  note: 'note', placeholder: 'placeholder', what: 'hover card · what it does',
  helps: 'hover card · what it is for', hint: 'hint', caption: 'caption',
  sub: 'subtitle', subtitle: 'subtitle', heading: 'heading', desc: 'description',
  description: 'description', body: 'body', option: 'dropdown option',
  'aria-label': 'screen-reader label', alt: 'image alt', 'jsx-text': 'on-screen text',
  toast: 'toast', string: 'string', template: 'message with a value in it',
  assembled: 'assembled at render time', keywords: 'search keywords',
  value: 'default value', seed: 'seeded content', prompt: 'prompt', unit: 'unit',
  empty: 'empty state', cta: 'button', suffix: 'suffix', reason: 'reason',
  message: 'message', detail: 'detail', tip: 'tip', why: 'hover card · reason',
};

/* ── stable, readable ids ───────────────────────────────────────────────────── */
const AREA_SLUG = {
  'Portal listing': 'list', 'Create-a-portal dialog': 'create', 'Settings tab': 'settings',
  'Builder — top bar and shell': 'topbar', 'Builder — the portal page': 'page',
  'Builder — canvas chrome': 'canvas', 'Right rail 1 — Widgets panel': 'widgets',
  'Right rail 1 — element hover cards': 'hover', 'Right rail 2 — Theme panel': 'theme',
  'Right rail 3 — Branding panel': 'brand', 'Widget drawer — shell': 'drawer',
  'Widget settings — one row per widget': 'w', 'Widget settings — collections': 'coll',
  'Widget settings — sections, columns, page and rails': 'struct',
  'Widget settings — child text nodes': 'child',
  'Widget settings — shared style packs': 'pack', 'Shared controls': 'ctl',
  Pickers: 'pick', 'Table element': 'table', 'Element renderers on the page': 'render',
  'Legacy element panel': 'legacy', Other: 'other',
};
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'x';

const used = new Map();
const mkId = (area, block, value) => {
  const base = [AREA_SLUG[area], block ? slug(block) : null, slug(value)].filter(Boolean).join('.');
  const n = (used.get(base) ?? 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
};

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

/* ── What the reference build says ───────────────────────────────────────────
   ⚠️ Filled in ONLY for the rows where the two builds disagree, and every entry
   was checked against that build's own bundle rather than assumed. A row that is
   byte-identical in both — which is 2,053 of them — simply repeats itself. */
const NOT_THERE = '— not in that build —';
const COUNTERPART = {
  'Style the support portal page.': 'Style, type and colour for every page of this portal.',
  'Helpdesk Name': 'Portal name',
  /* ⚠️ That build has since ADOPTED this rename — it now says "Custom Data Widget", capitalised
     differently. It said "Record List" when this file was first written. */
  'Custom data widget': 'Custom Data Widget',
  'list records kpi count metric requests assets cis filter module query data':
    'list records requests assets cis filter module query data',
  'Record list': 'Record list',
  'Use Template': 'Choose a template',
  'Start from a ready-made layout and change what you need.':
    'Start from a ready-made portal layout. You can change anything after.',
};
const refTextFor = (r) => (r.ref === 'ours-only' ? (COUNTERPART[r.value] ?? NOT_THERE) : r.value);

/* Rows that exist in that build and NOT here — the other half of the difference.
   Without them the file would only ever show what we have, and a word that build
   uses and we do not would be invisible. Each was verified in its bundle. */
const ONLY_THERE = [
  // ── Theme panel ──
  ['Right rail 2 — Theme panel', 'caption under the Primary tab', 'Set by the theme style. Change one to depart from it.'],
  ['Right rail 2 — Theme panel', 'caption under the Secondary tab', 'Status colours — green means healthy, red means broken. Shared by every theme.'],
  ['Right rail 2 — Theme panel', 'caption under the Neutral tab', 'The greyscale every surface and border is built from. Shared by every theme.'],

  // ── Branding panel ──
  ['Right rail 3 — Branding panel', 'field label', 'Company'],
  ['Right rail 3 — Branding panel', 'read-only value', 'Acme Corporation'],
  ['Right rail 3 — Branding panel', 'field label', 'Portal URL'],
  ['Right rail 3 — Branding panel', 'read-only value', 'https://support.acme.com'],
  ['Right rail 3 — Branding panel', 'section heading', 'Help'],
  ['Right rail 3 — Branding panel', 'section heading', 'Sign-on'],
  ['Right rail 3 — Branding panel', 'section heading', 'Contact shown on the portal'],
  ['Right rail 3 — Branding panel', 'field label', 'Help Icon'],
  ['Right rail 3 — Branding panel', 'upload button', 'Upload Help View Icon For Requester'],
  ['Right rail 3 — Branding panel', 'ⓘ on the Help Icon label', '16 × 16 px gives the sharpest result. A larger square works — it will be scaled down.'],
  ['Right rail 3 — Branding panel', 'disabled Preview link', 'Upload an icon first — there is nothing to preview yet'],
  ['Right rail 3 — Branding panel', 'tooltip on the attachment chip', 'Icon attached'],
  ['Right rail 3 — Branding panel', 'tooltip on the attachment chip', 'No icon attached yet'],
  ['Right rail 3 — Branding panel', 'tooltip on the eye', 'View the icon'],
  ['Right rail 3 — Branding panel', 'tooltip on the eye and bin', 'Nothing attached yet'],
  ['Right rail 3 — Branding panel', 'tooltip on the bin', 'Remove the icon'],
  ['Right rail 3 — Branding panel', 'toast', 'Showing the help icon as a requester sees it'],
  ['Right rail 3 — Branding panel', 'toast', 'Help icon removed'],

  // ── Portal listing ──
  ['Portal listing', 'the gear beside the CTA', 'Global Setting'],
  ['Portal listing', 'subtitle of the drawer that gear opened', 'Applies to every support portal'],

  /* ── Custom Data Widget ────────────────────────────────────────────────────
     ⚠️ This is the real new content on that site, and it arrived AFTER the first
     read of this file. Its widget carries a wider field catalogue than ours —
     more modules (knowledge, task, approval, CI) and more fields inside each —
     plus a set of ready-made views per module and two number operators. Every
     entry below was read out of that build's current bundle. */
  ['Widget settings — one row per widget', 'Custom Data Widget · widget name (ours: “Custom data widget”)', 'Custom Data Widget'],
  ['Widget settings — one row per widget', 'Custom Data Widget · what a “mine” view is scoped to', 'The signed-in requester'],
  ['Widget settings — one row per widget', 'Custom Data Widget · operator on a number field', 'Greater than'],
  ['Widget settings — one row per widget', 'Custom Data Widget · operator on a number field', 'Less than'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Request field', 'Request ID'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Request field', 'Request / Item ID'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Request field', 'Subcategory'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Request field', 'Closed Date'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Request field', 'Resolved Date'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Change field', 'Change ID'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Change field', 'Planned End Date'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Change field', 'Actual Start Date'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Change field', 'Actual End Date'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Change status option', 'Under Review'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Asset field', 'Asset Name'],
  ['Widget settings — one row per widget', 'Custom Data Widget · CI field', 'CI Name'],
  ['Widget settings — one row per widget', 'Custom Data Widget · CI field', 'CI Class'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Approval field', 'Approval ID'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Approval field', 'Approval Type'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Approval Type option', 'Sequential'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Approval Type option', 'Everyone'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Knowledge field', 'Article ID'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Knowledge field', 'Knowledge Type'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Knowledge field', 'View Count'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Knowledge category option', 'How-to'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Knowledge visibility option', 'Logged-in Requesters'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task field', 'Task ID'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task field', 'Task Name'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task field', 'Completed Date'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task project option', 'Office 365 Migration'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task project option', 'Data Centre Move'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task project option', 'Laptop Refresh 2026'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Task project option', 'On-boarding Automation'],
  ['Widget settings — one row per widget', 'Custom Data Widget · Software licence option', 'Licence'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Request', 'All My Requests'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Request', 'My Pending Requests'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Request', 'My Resolved Requests'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Request', 'My Closed Requests'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Request', 'My High Priority Requests'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Change', 'My Active Changes'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Change', 'My Completed Changes'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Asset', 'My Active Assets'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · CI', 'My Active CIs'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Approval', 'Completed Approvals'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Knowledge', 'Recently Published'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Knowledge', 'Recently Updated'],
  ['Widget settings — one row per widget', 'Custom Data Widget · ready-made view · Task', 'My Completed Tasks'],
];

/* ── group ──────────────────────────────────────────────────────────────────── */
const byArea = new Map();
for (const r of rows) {
  const a = areaOf(r.file);
  if (!byArea.has(a)) byArea.set(a, []);
  byArea.get(a).push(r);
}

const DIFFS = [
  ['Theme panel · the line under the rail title', 'PortalThemePanel / SupportPortalBuilder.tsx:95', 'Style, type and colour for every page of this portal.', 'Style the support portal page.', 'You asked for the new line on 2 Sep (task 77).'],
  ['Theme panel · captions under the three colour tabs', 'PortalThemePanel.tsx', 'Set by the theme style… · Status colours — green means healthy… · The greyscale every surface…', '— removed —', 'You asked for them gone on 2 Sep (task 77).'],
  ['Branding · first field', 'PortalBrandingPanel.tsx', 'Portal name', 'Helpdesk Name', 'From your handwritten note (task 80).'],
  ['Branding · tenant rows', 'PortalBrandingPanel.tsx', 'Company · Portal URL (read-only rows)', '— removed —', 'Not on your note (task 80).'],
  ['Branding · section headings', 'PortalBrandingPanel.tsx', 'Help · Sign-on · Contact shown on the portal', '— removed —', 'You asked for the headings gone (task 80).'],
  ['Branding · help icon block', 'PortalBrandingPanel.tsx', 'Help Icon · Upload Help View Icon For Requester · Preview · and its six tooltips and two toasts', '— removed —', 'You asked for the image fields gone (task 78).'],
  ['Branding · new fields', 'PortalBrandingPanel.tsx', '— not in that build —', 'Linkback URL · Favicon · Upload favicon · Favicon updated', 'From your handwritten note (task 80).'],
  ['⭐ Custom Data Widget · the field catalogue', 'portalWidgetSpec.ts / the widget\'s filter', '47 strings this project does not have — see §12, "Only in that build"', 'a narrower catalogue', '**NEW since the first read.** That build now carries more modules (Knowledge, Task, Approval, CI) with more fields in each, two number operators, and 12 ready-made views. This is the one place where it is genuinely ahead.'],
  ['Widget name', 'supportPortalData.ts:474 / portalWidgetSpec.ts:792', 'Custom Data Widget', 'Custom data widget', 'It said "Record List" when this file was first written — that build has since adopted your task-68 rename, capitalised differently.'],
  ['Widget drawer · Custom data widget', 'portalWidgetSpec.ts:802', '— not in that build —', 'Show as (Record list / KPI)', 'Part of the same merge (task 68).'],
  ['Live-data cards · four fields', 'portalWidgetSpec.ts:254–265', '— not in that build —', 'Show count badge · Show “View all” link · Row layout · Single line', 'Ours has these; that build does not.'],
  ['Portal listing · the gear beside the CTA', 'AdminSupportPortalModule.tsx', 'Global Setting · Applies to every support portal', '— removed —', 'You asked for it gone (task 75).'],
  ['Create dialog · step 2', 'AdminSupportPortalModule.tsx:149–171', 'Choose a template / Start from a ready-made portal layout. You can change anything after.', 'Use Template / Start from a ready-made layout and change what you need. / New page / Start with a blank page and build it block by block.', 'We rebuilt the fork into one screen; that build still opens a separate template dialog.'],
  ['Top bar · the tour button', 'SupportPortalBuilder.tsx:1425', '— not in that build —', 'Take the tour', 'Ours has the ? button; that build has no tour.'],
  ['Portal page · mock records', 'supportPortalData.ts:347–397', 'different sample rows', 'PRB-4390 · REL-118 · PCH-4302 · the two CVEs and their CVSS scores', 'Demo data on both sides, drifted apart. Harmless either way.'],
  ['Element hover cards · all 29', 'PortalElementPreview.tsx', 'what + helps + note', 'same — already adopted', 'Taken from that build on 2 Sep (task 79). In step.'],
];

/* ── write ──────────────────────────────────────────────────────────────────── */
const L = [];
L.push('# Support Portal — content inventory');
L.push('');
L.push('Every piece of text in the Support Portal editor, in one place, so copy can be reviewed and');
L.push('changed without reading the code.');
L.push('');
L.push('- **Read from:** the build at <https://juligopani.github.io/-serviceops-ticket-detail/#/admin/support-portal>, cross-checked line by line against this repository.');
L.push('- ⚠️ **That site redeploys.** This file was regenerated against the bundle it was serving on 2 Sep 2026 (\`index-DI1p9URm.js\`). If it has shipped again since, re-run the two scripts named at the foot of this file before trusting the comparison.');
L.push('- **Coverage:** the listing, the create dialog, the Settings tab, the builder top bar, the whole portal page on the canvas, every canvas toolbar and tooltip, all three right-rail menus, the element hover cards, and every field of every widget settings panel.');
L.push('');
L.push('## How to use this file');
L.push('');
L.push('| Column | What it holds |');
L.push('|---|---|');
L.push('| **Current (this project)** | The words this repository shows today. This is what a change is made *to*. |');
/* ⚠️ COUNTED, never typed. These two numbers move every time either build ships, and a hand-written
   figure in a file that is regenerated is a claim that quietly stops being true. */
const AGREE = rows.filter((r) => r.ref === 'same').length;
const DIFFER = rows.filter((r) => r.ref === 'ours-only').length;
L.push(`| **That build says** | The same string in the build you linked. It repeats the column beside it on the ${AGREE.toLocaleString()} rows where the two agree, and differs on ${DIFFER}. |`);
L.push('| **New text** | Empty. What you want it to say. |');
L.push('');
L.push('1. Write the wording you want in the **New text** column. Leave it blank to keep what is there.');
L.push('2. Send the file back. Every filled row is applied to the code mechanically — the **ID** and the **File** column are what makes that possible, so please do not edit those two columns.');
L.push('3. `{name}`, `{count}` and the like are values the app fills in at runtime. Keep them in your new wording, spelled exactly the same, or the message loses the value it was reporting.');
L.push('4. Rows marked **Δ** are the ones where that build and this repository do not agree — read the conflicts table below before changing them.');
L.push('');
L.push('## ⚠️ Conflicts — please decide these first');
L.push('');
L.push('Every place the build you pointed me at and this repository disagree. Most are changes you');
L.push('asked for in the last few days, so taking that build\'s wording would undo a decision you have');
L.push('already made — but **C8 is the opposite**: that site has shipped since this file was first');
L.push('written, and its Custom Data Widget now carries a wider field catalogue than this one has.');
L.push('Nothing below has been changed either way. Tell me which you want and I will apply it.');
L.push('');
L.push('| # | Where | That build says | This repo says | Why they differ |');
L.push('|---|---|---|---|---|');
DIFFS.forEach((d, i) => L.push(`| C${i + 1} | ${esc(d[0])}<br>\`${esc(d[1])}\` | ${esc(d[2])} | ${esc(d[3])} | ${esc(d[4])} |`));
L.push('');
L.push('---');
L.push('');

let n = 0;
const order = AREAS.map(([a]) => a).concat(['Other']);
let sec = 0;
for (const area of order) {
  const items = byArea.get(area);
  if (!items || !items.length) continue;
  sec++;
  L.push(`## ${sec}. ${area}`);
  L.push('');
  const files = [...new Set(items.map((r) => r.file))];
  L.push(`*${files.map((f) => '`' + f + '`').join(' · ')}* — ${items.length} entries`);
  L.push('');

  // sub-group by block (spec files) or holder (everything else)
  const groups = new Map();
  for (const r of items) {
    const g = r.block ?? r.holder ?? '(top level)';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(r);
  }
  const extras = ONLY_THERE.filter(([a]) => a === area);
  for (const [g, list] of groups) {
    const friendly = blockName[g] ? `${blockName[g]} — \`${g}\`` : `\`${g}\``;
    L.push(`### ${sec}.${[...groups.keys()].indexOf(g) + 1} ${friendly}`);
    L.push('');
    L.push('| ID | What it is | File | Current (this project) | That build says | New text |');
    L.push('|---|---|---|---|---|---|');
    for (const r of list) {
      const id = mkId(area, r.block ?? null, r.value);
      const flag = r.ref === 'ours-only' ? ' **Δ**' : '';
      const kind = KIND_LABEL[r.kind] ?? r.kind;
      const where = r.note ? `${kind} — ${r.note}` : kind;
      L.push(`| \`${id}\`${flag} | ${esc(where)} | \`${r.file}:${r.line}\` | ${esc(r.value)} | ${esc(refTextFor(r))} |  |`);
      n++;
    }
    L.push('');
  }
  if (extras.length) {
    L.push(`### ${sec}.${groups.size + 1} Only in that build — not in this project`);
    L.push('');
    L.push('Words that build has and this one does not — some removed here on purpose, some never');
    L.push('built here at all. Nothing to fill in unless you want them; say so in **New text** and I');
    L.push('will build the control that carries them.');
    L.push('');
    L.push('| ID | What it is | File | Current (this project) | That build says | New text |');
    L.push('|---|---|---|---|---|---|');
    for (const [, where, text] of extras) {
      const id = mkId(area, 'gone', text);
      L.push(`| \`${id}\` **Δ** | ${esc(where)} | — | — not in this project — | ${esc(text)} |  |`);
      n++;
    }
    L.push('');
  }
}

L.push('---');
L.push('');
L.push(`**${n} entries** across ${sec} areas.`);
L.push('');
L.push('### What is deliberately not in here');
L.push('');
L.push('- **Code comments.** They explain the build to whoever maintains it and never reach a screen.');
L.push('- **Class names, colour values and CSS.** Not language, and changing them here would change the design rather than the copy.');
L.push('- **Icon names and config keys** (`showDesc`, `quick-incident`). These are the addresses the app uses internally; the words a requester reads are all listed above.');
L.push('');

fs.writeFileSync(path.join(process.cwd(), 'SUPPORT-PORTAL-CONTENT.md'), L.join('\n') + '\n');
console.log('entries', n, 'areas', sec);
