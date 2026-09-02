/* Support Portal — copy extractor.
 *
 * Reads every user-visible string out of the Support Portal source and writes them to a temp file
 * that build-portal-content.mjs turns into SUPPORT-PORTAL-CONTENT.md.
 *
 *   node scripts/extract-portal-copy.mjs && node scripts/build-portal-content.mjs
 *
 * To fill in the "That build says" column, put the reference bundle at <os.tmpdir()>/ref.js first:
 *   curl -s -o "$TMPDIR/ref.js" https://juligopani.github.io/-serviceops-ticket-detail/assets/<hash>.js
 * (the hash is in that site's index.html). Without it every row simply reads as matching.
 *
 * ⚠️ Deciding what counts as copy is the whole job here, and the four rules that were hardest to get
 * right carry their own notes below: SVG path data, class lists, arbitrary values, and single
 * tokens. Read those before loosening anything. */
import fs from 'fs';
import os from 'os';
import path from 'path';

const ROOT = path.join(process.cwd(), 'src/app/components');

const FILES = [
  'SupportPortalBuilder.tsx', 'SupportPortalPreview.tsx', 'SupportPortalAddPanel.tsx',
  'PortalCanvas.tsx', 'PortalElementPanel.tsx', 'PortalElementPreview.tsx',
  'PortalThemePanel.tsx', 'PortalBrandingPanel.tsx', 'PortalWidgetDrawer.tsx',
  'portalWidgetSpec.ts', 'portalCollectionSpecs.ts', 'portalStructureSpecs.ts',
  'portalPanelSpecs.ts', 'PortalStylePacks.tsx', 'PortalControls.tsx',
  'portalPageModel.ts', 'supportPortalData.ts', 'PortalItemList.tsx',
  'PortalCollectionRender.tsx', 'PortalPlacedElement.tsx', 'PortalTable.tsx',
  'portalTableModel.ts', 'PortalIconPicker.tsx', 'PortalColorPicker.tsx',
  'PortalContrastMeter.tsx', 'SpacingMatrix.tsx', 'SupportPortalTemplateGallery.tsx',
  'CreateSupportPortalModal.tsx', 'AdminSupportPortalModule.tsx', 'AdminSupportPortalSettings.tsx',
];

const CLASSY = /(^|\s)(flex|grid|block|inline-|absolute|relative|fixed|sticky|hidden|w-|h-|min-|max-|p[xytblr]?-\[|p[xytblr]?-\d|m[xytblr]?-\[|m[xytblr]?-\d|gap-|text-\[|text-(xs|sm|base|lg|xl)|bg-|border|rounded|shadow|z-\[|opacity-|transition|cursor-|overflow|items-|justify-|self-|order-|col-|row-|space-|divide-|truncate|whitespace|leading-|tracking-|font-(medium|semibold|bold|normal)|uppercase|lowercase|capitalize|ring-|outline-|scale-|rotate-|translate|group\/|peer|hover:|focus:|active:|disabled:|first:|last:|sm:|md:|lg:|xl:|@)/;
const HEXY = /^#?[0-9a-fA-F]{3,8}$/;
const KEYY = /^[a-z][A-Za-z0-9_]*$/;
const KEBAB = /^[a-z0-9]+([-_/][a-z0-9]+)*$/;
const PATHY = /^[./#]|^https?:|\.(tsx?|css|png|jpe?g|svg|json|ico|webp)$/i;
const CSSVAL = /^(px|rem|em|%|auto|none|solid|dashed|dotted|left|right|center|centre|top|bottom|middle|row|column|start|end|stretch|flex-start|flex-end|space-between|space-around|space-evenly|contain|cover|normal|bold|italic|underline|nowrap|pointer|grab|default|hidden|visible|scroll|both|button|submit|text|file|checkbox|radio|image\/\*|light|dark|horizontal|vertical|asc|desc|small|medium|large|primary|secondary|outline|ghost|link|sm|md|lg|xl)$/i;
/* ⚠️ Path data opens with a command letter — and so does an English sentence. "A colour or an
   image…" begins with the arc command `A` followed by a space, so every line of prose starting with
   A, C, H, L, M, Q, S, T, V or Z was being discarded as SVG. Real path data never carries two
   lowercase letters in a row; prose always does. */
const SVGY = /^[MmLlHhVvCcSsQqTtAaZz][\d\s.,-]/;
const isSvgPath = (t) => SVGY.test(t) && !/[a-z]{2}/.test(t);

/* Keys whose VALUE is content a requester reads, even when it is one lowercase word. A CI called
   `hostname` and an address like `servicedesk@acme.com` are on the page and are exactly the kind of
   thing somebody wants to change — the general rule below rejects them as identifiers. */
/* ⚠️ `value` is NOT in that list. In this codebase a `value:` is the option's internal key —
   `home`, `kpi`, `stacked` — while the words on screen live in the `label` beside it. Admitting it
   put 80 identifiers into the inventory that nobody can usefully rewrite. Addresses and phone
   numbers stored under `value` are still caught, by their own rules below. */
const CONTENT_KEY = /^(name|title|host|meta|label|sub|subtitle|text|email|phone|desc|description)$/i;

/* ⚠️ A class string is recognised by the SHAPE OF THE WHOLE STRING, not by spotting a utility word
   inside it. Matching bare words — `block`, `rounded`, `grid`, `border` — threw away real sentences:
   "every block, style and setting back to the page's default" and "lightly rounded buttons" both
   contain a Tailwind word in the middle of ordinary English. A class list is all lowercase, carries
   no sentence punctuation, and is mostly utilities; prose fails at least one of those. */
function looksLikeClasses(t) {
  /* ⚠️ Capitals are tested with the arbitrary values stripped out. A hex colour inside
     `bg-[#F1F5F9]` is upper-case, so testing the raw string reported every coloured utility as
     prose and let the whole class list through. */
  const bare = t.replace(/\[[^\]]*\]/g, '[]');
  if (/[A-Z]/.test(bare)) return false;
  /* ⚠️ A full stop only counts as sentence punctuation after a LETTER. `gap-x-2.5` and
     `border-white/[0.12]` are decimals, and treating them as prose let whole class lists through. */
  if (/[!?—’'"“”]/.test(bare)) return false;
  if (/[a-z]\.(\s|$)/.test(bare)) return false;
  const toks = t.trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return false;
  /* ⚠️ ONE token is not a list. A host name like `app-prod-01` reads exactly like a utility class;
     only a RUN of them is evidence that this string is markup rather than content. */
  if (toks.length === 1 && !/-\[|:/.test(toks[0])) return false;
  const util = toks.filter((k) => /-\[|:/.test(k)
    || /^(flex|grid|block|inline|absolute|relative|fixed|sticky|hidden|truncate|uppercase|lowercase|capitalize|italic|underline|contents|isolate)$/.test(k)
    || /^[a-z-]+-(\d|\[|auto|full|px|none|center|start|end|between|around|col|row|reverse|wrap|nowrap|clip|visible|hidden|scroll|auto)/.test(k)).length;
  return util / toks.length >= 0.5;
}

function isCopy(v, kind) {
  const t = v.trim();
  if (!t || t.length > 400) return false;
  if (HEXY.test(t) || PATHY.test(t) || CSSVAL.test(t) || isSvgPath(t)) return false;
  if (looksLikeClasses(t)) return false;
  // An address or a phone number — content that carries no letters, or none that look like words.
  // ⚠️ Tested BEFORE the "must contain a letter" rule below, which a phone number never passes.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return true;
  if (/^\+?\d[\d\s()+-]{6,}$/.test(t)) return true;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/[<>]/.test(t)) return false;
  if (/^[A-Z0-9_]+$/.test(t) && t.length > 3 && !/ /.test(t)) return false; // CONST_NAME
  if (kind && CONTENT_KEY.test(kind) && t.length >= 3 && !/^(true|false)$/.test(t)) return true;
  if (KEYY.test(t) || KEBAB.test(t)) return false;
  if (/^(rgba?|hsla?|var|calc|url|linear-gradient|radial-gradient)\(/.test(t)) return false;
  if (/&&|\|\||=>|\.\.\.|\?\.|::|\bconst\b|\breturn\b|\buseState\b|\buseRef\b|\buseMemo\b|\bRecord\b/.test(t)) return false;
  if (/ /.test(t) || /^[A-Z]/.test(t) || /[·—–…×%?!]/.test(t)) return true;
  return false;
}

/* A JSX "text node" is far more often a fragment of code caught between the angle brackets of a
   generic than it is a sentence, so it is held to a stricter test than a quoted literal. */
function isJsxCopy(v) {
  const t = v.trim();
  if (!isCopy(t, null)) return false;
  if (/[;={}`]/.test(t)) return false;
  if (/^[,):.[\]]/.test(t)) return false;
  if (/[,:([]$/.test(t)) return false;
  if (/\b(string|number|boolean|void|any|Partial|Omit|Pick|null|undefined)\b/.test(t)) return false;
  return true;
}

function stripComments(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  let mode = 0; // 0 code, 1 line comment, 2 block comment, 3 single, 4 double, 5 template
  while (i < n) {
    const c = text[i], d = text[i + 1];
    if (mode === 0) {
      if (c === '/' && d === '/') { mode = 1; i += 2; continue; }
      if (c === '/' && d === '*') { mode = 2; out += '  '; i += 2; continue; }
      if (c === "'") { mode = 3; out += c; i++; continue; }
      if (c === '"') { mode = 4; out += c; i++; continue; }
      if (c === '`') { mode = 5; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (mode === 1) { if (c === '\n') { mode = 0; out += c; } i++; continue; }
    if (mode === 2) { if (c === '*' && d === '/') { mode = 0; i += 2; out += '  '; continue; } out += c === '\n' ? '\n' : ' '; i++; continue; }
    // inside a string
    if (c === '\\') { out += c + (d ?? ''); i += 2; continue; }
    out += c;
    if ((mode === 3 && c === "'") || (mode === 4 && c === '"') || (mode === 5 && c === '`')) mode = 0;
    i++;
  }
  // JSX comments
  return out.replace(/\{\s{2,}[\s\S]*?\s{2,}\}/g, (m) => (/[a-zA-Z]/.test(m) && m.includes('  ') && !m.includes("'") && !m.includes('"') ? ' ' : m));
}

function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }

const rows = [];
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.error('SKIP ' + f); continue; }
  const raw = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  const src = stripComments(raw);
  const lines = src.split('\n');

  // widget/section block tracking
  const isSpecFile = /portalWidgetSpec|portalCollectionSpecs|portalStructureSpecs|portalPanelSpecs/.test(f);
  const blockAt = [];
  const holderAt = [];
  {
    let cur = null;      // the widget / spec block, for spec files
    let holder = null;   // the nearest top-level const or function, for every file
    lines.forEach((line) => {
      const top = /^(?:export\s+)?(?:default\s+)?(?:const|let|function|class)\s+([A-Za-z0-9_$]+)/.exec(line);
      if (top) { holder = top[1]; if (!isSpecFile) cur = null; }
      if (isSpecFile) {
        const m = /\bid:\s*'([^']+)'/.exec(line);
        if (m) cur = m[1];
        const c = /^(?:export\s+)?const\s+([A-Za-z0-9_]+(?:_SPEC|_PACKS|_SPECS|_COLLECTIONS))\b/.exec(line);
        if (c) cur = c[1];
      }
      blockAt.push(cur);
      holderAt.push(holder);
    });
  }

  const seen = new Set();
  const add = (idx, kind, value) => {
    const v = value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    /* A className is never copy, whatever it happens to contain. */
    if (/^(className|class|iconBtn|cls|css)$/i.test(kind)) return;
    if (kind === 'jsx-text' ? !isJsxCopy(v) : !isCopy(v, kind)) return;
    const ln = lineOf(src, idx);
    const key = kind + '|' + v + '|' + f;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ file: f, line: ln, block: blockAt[ln - 1] ?? null, holder: holderAt[ln - 1] ?? null, kind, value: v });
  };

  // every string literal, with the nearest preceding key/attribute as its kind
  const RE = /(['"])((?:\\.|(?!\1)[^\\\n])*)\1|`([^`$\n]*)`/g;
  let m;
  while ((m = RE.exec(src))) {
    const val = m[2] !== undefined ? m[2] : m[3];
    if (val === undefined) continue;
    const before = src.slice(Math.max(0, m.index - 60), m.index);
    const k = /(\b[A-Za-z-]+)\s*[:=]\s*\{?\s*$/.exec(before);
    add(m.index, k ? k[1] : 'string', val);
  }
  // JSX text nodes, possibly spanning lines
  const TXT = /(?<=>)([^<>{}]{2,300})(?=<)/g;
  while ((m = TXT.exec(src))) add(m.index, 'jsx-text', m[1]);
}

/* ── the last sweep ─────────────────────────────────────────────────────────
   Fragments the shape tests above cannot judge from the string alone: key NAMES
   ("Enter"), expression pieces the JSX scan caught between generics, pack ids.
   Kept here rather than folded into isCopy so the rules that decide what copy IS
   stay readable. */
const KEY_NAMES = new Set(['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Meta', 'Alt', 'Space', 'KeyZ', 'KeyF']);
const NOISE = [/\?\?/, /String\(/, /Math\./, /\.replace\(/, /===/, /var\(--/, /^,\s/, /\[key\]/,
  /getBoundingClientRect/, /\bcfg\[/, /\bp\.styles\b/, /^\(/, /inset 0 0 0/, /hasOwn\(/,
  /-\[#/, /\bhover:/, /\bgroup-hover/, /^bg-black/, /^P\d$/, /^G\d$/, /^[A-Z]$/];
const clean = rows.filter((r) => !KEY_NAMES.has(r.value) && !NOISE.some((re) => re.test(r.value)));

/* Which of these the reference build also has, so the inventory can show both. A string it does not
   contain is one the two builds disagree about — those are the rows the file flags. */
const REF_BUNDLE = path.join(os.tmpdir(), 'ref.js');
if (fs.existsSync(REF_BUNDLE)) {
  const ref = fs.readFileSync(REF_BUNDLE, 'utf8');
  clean.forEach((r) => { r.ref = ref.includes(r.value) ? 'same' : 'ours-only'; });
} else {
  console.error('NOTE: no reference bundle at ' + REF_BUNDLE + ' — every row will read as matching.');
  clean.forEach((r) => { r.ref = 'same'; });
}

fs.writeFileSync(path.join(os.tmpdir(), 'copy-rows.json'), JSON.stringify(clean, null, 1));
const byFile = {};
clean.forEach((r) => { byFile[r.file] = (byFile[r.file] || 0) + 1; });
console.log('rows', clean.length, '· differ from the reference build:', clean.filter((r) => r.ref === 'ours-only').length);
console.log(Object.entries(byFile).map(([k, v]) => `${String(v).padStart(5)}  ${k}`).join('\n'));
