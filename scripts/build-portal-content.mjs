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
  'Custom data widget': 'Record List',
  'list records kpi count metric requests assets cis filter module query data':
    'list records requests assets cis filter module query data',
  'Use Template': 'Choose a template',
  'Start from a ready-made layout and change what you need.':
    'Start from a ready-made portal layout. You can change anything after.',
};
const refTextFor = (r) => (r.ref === 'ours-only' ? (COUNTERPART[r.value] ?? NOT_THERE) : r.value);

/* Rows that exist in that build and NOT here — the other half of the difference.
   Without them the file would only ever show what we have, and a word that build
   uses and we do not would be invisible. Each was verified in its bundle. */
const ONLY_THERE = [
  ['Right rail 2 — Theme panel', 'caption under the Primary tab', 'Set by the theme style. Change one to depart from it.'],
  ['Right rail 2 — Theme panel', 'caption under the Secondary tab', 'Status colours — green means healthy, red means broken. Shared by every theme.'],
  ['Right rail 2 — Theme panel', 'caption under the Neutral tab', 'The greyscale every surface and border is built from. Shared by every theme.'],
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
  ['Portal listing', 'the gear beside the CTA', 'Global Setting'],
  ['Portal listing', 'subtitle of the drawer that gear opened', 'Applies to every support portal'],
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
  ['Theme panel · caption under the Primary tab', 'PortalThemePanel.tsx', 'Set by the theme style. Change one to depart from it.', '— removed —', 'You asked for it gone on 2 Sep (task 77).'],
  ['Theme panel · caption under the Secondary tab', 'PortalThemePanel.tsx', 'Status colours — green means healthy, red means broken. Shared by every theme.', '— removed —', 'Same change.'],
  ['Theme panel · caption under the Neutral tab', 'PortalThemePanel.tsx', 'The greyscale every surface and border is built from. Shared by every theme.', '— removed —', 'Same change.'],
  ['Branding · first field', 'PortalBrandingPanel.tsx', 'Portal name', 'Helpdesk Name', 'From your handwritten note (task 80).'],
  ['Branding · tenant rows', 'PortalBrandingPanel.tsx', 'Company · Portal URL (read-only rows)', '— removed —', 'Not on your note (task 80).'],
  ['Branding · section headings', 'PortalBrandingPanel.tsx', 'Help · Sign-on · Contact shown on the portal', '— removed —', 'You asked for the headings gone (task 80).'],
  ['Branding · help icon block', 'PortalBrandingPanel.tsx', 'Help Icon · Upload Help View Icon For Requester · Preview · Icon attached · No icon attached yet · View the icon · Nothing attached yet · Showing the help icon as a requester sees it · 16 × 16 px gives the sharpest result…', '— removed —', 'You asked for the image fields gone (task 78).'],
  ['Branding · new fields', 'PortalBrandingPanel.tsx', '— not in that build —', 'Linkback URL · Favicon · Upload favicon · Favicon updated', 'From your handwritten note (task 80).'],
  ['Palette + widget name', 'supportPortalData.ts:474 / portalWidgetSpec.ts:792', 'Record List', 'Custom data widget', 'You chose the rename in task 68 when Record List and KPI merged. NOT changed back.'],
  ['Widget drawer · Custom data widget', 'portalWidgetSpec.ts:802', '— not in that build —', 'Show as (Record list / KPI)', 'Part of the same merge.'],
  ['Live-data cards · three fields', 'portalWidgetSpec.ts:254–265', '— not in that build —', 'Show count badge · Show “View all” link · Row layout · Single line', 'Ours has these; that build does not.'],
  ['Portal listing · the gear beside the CTA', 'AdminSupportPortalModule.tsx', 'Global Setting', '— removed —', 'You asked for it gone (task 75).'],
  ['Create dialog · step 2', 'AdminSupportPortalModule.tsx:155', 'Use Template / Start from a ready-made layout and change what you need. / New page', 'one-screen step 2', 'We rebuilt the fork into one screen; that build still has the two-card fork.'],
  ['Top bar · the tour button', 'SupportPortalBuilder.tsx:1425', '— not in that build —', 'Take the tour', 'Ours has the ? button; that build has no tour.'],
  ['Element hover cards · all 29', 'PortalElementPreview.tsx', 'what + helps + note (two lines and a condition)', 'same — already adopted', 'Taken from that build on 2 Sep (task 79). Already in step.'],
];

/* ── write ──────────────────────────────────────────────────────────────────── */
const L = [];
L.push('# Support Portal — content inventory');
L.push('');
L.push('Every piece of text in the Support Portal editor, in one place, so copy can be reviewed and');
L.push('changed without reading the code.');
L.push('');
L.push('- **Read from:** the build at <https://juligopani.github.io/-serviceops-ticket-detail/#/admin/support-portal>, cross-checked line by line against this repository.');
L.push('- **Coverage:** the listing, the create dialog, the Settings tab, the builder top bar, the whole portal page on the canvas, every canvas toolbar and tooltip, all three right-rail menus, the element hover cards, and every field of every widget settings panel.');
L.push('');
L.push('## How to use this file');
L.push('');
L.push('| Column | What it holds |');
L.push('|---|---|');
L.push('| **Current (this project)** | The words this repository shows today. This is what a change is made *to*. |');
L.push('| **That build says** | The same string in the build you linked. It repeats the column beside it on the 2,053 rows where the two agree, and differs on 22. |');
L.push('| **New text** | Empty. What you want it to say. |');
L.push('');
L.push('1. Write the wording you want in the **New text** column. Leave it blank to keep what is there.');
L.push('2. Send the file back. Every filled row is applied to the code mechanically — the **ID** and the **File** column are what makes that possible, so please do not edit those two columns.');
L.push('3. `{name}`, `{count}` and the like are values the app fills in at runtime. Keep them in your new wording, spelled exactly the same, or the message loses the value it was reporting.');
L.push('4. Rows marked **Δ** are the ones where that build and this repository do not agree — read the conflicts table below before changing them.');
L.push('');
L.push('## ⚠️ Conflicts — please decide these first');
L.push('');
L.push('These are the only places where the build you pointed me at and this repository differ. Every');
L.push('one of them is something you asked for in the last few days, so taking that build\'s wording');
L.push('here would undo a decision you have already made. Nothing below has been changed — tell me');
L.push('which way you want each one and I will apply it.');
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
    L.push('Words that build uses which this one no longer has. Nothing to fill in unless you want');
    L.push('them back — say so in **New text** and I will put the control back with them.');
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
