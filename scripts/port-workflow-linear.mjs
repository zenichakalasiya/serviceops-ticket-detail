/* Port the Linear workflow builder into this project.
 *
 *   node scripts/port-workflow-linear.mjs [path to the source folder]
 *
 * Source: D:\Motadata\Workflow_Sidebar_scroll\linear\index.html — one Babel-in-the-browser React app
 * (React/ReactDOM as globals, Tailwind's play CDN) — and its node-skin.css.
 *
 * Writes:
 *   src/app/components/workflow/linear/LinearBuilder.tsx   the app as a module
 *   src/app/components/workflow/linear/linear.css           its CSS, scoped under .wfl-scope
 *
 * ⚠️ Both outputs are GENERATED. Re-running overwrites them, so once a file has been hand-edited
 * here (restyled onto project components), stop re-running this for it. Every rewrite below fails
 * LOUDLY when its anchor is missing, so a changed source can't produce a silently broken port.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const postcss = require(path.join(ROOT, 'node_modules/.pnpm/postcss@8.5.15/node_modules/postcss'));

const SRC = process.argv[2] || 'D:/Motadata/Workflow_Sidebar_scroll';
const OUT = path.join(ROOT, 'src/app/components/workflow/linear');
fs.mkdirSync(OUT, { recursive: true });

/* Since phase 2 (22 Oct 2026) both outputs are HAND-OWNED — restyled onto project components. A plain
   re-run would wipe that work, so it refuses unless --force is passed (and then you re-apply by hand). */
const FORCE = process.argv.includes('--force');
for (const f of ['LinearBuilder.tsx', 'linear.css']) {
  const p = path.join(OUT, f);
  if (!FORCE && fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('HAND-OWNED')) {
    console.error(`${f} is HAND-OWNED (restyled in this project). Re-run with --force only to start the port over.`);
    process.exit(1);
  }
}

const html = fs.readFileSync(path.join(SRC, 'linear/index.html'), 'utf8').replace(/\r\n/g, '\n');
const skin = fs.readFileSync(path.join(SRC, 'linear/node-skin.css'), 'utf8').replace(/\r\n/g, '\n');

const between = (s, a, b, from = 0) => {
  const i = s.indexOf(a, from);
  if (i < 0) throw new Error('anchor not found: ' + a);
  const j = s.indexOf(b, i + a.length);
  if (j < 0) throw new Error('anchor not found: ' + b);
  return s.slice(i + a.length, j);
};

/* ------------------------------------------------------------------ JS */
let js = between(html, '<script type="text/babel" data-presets="react">', '</script>');

function swap(from, to, { all = false, count } = {}) {
  const n = js.split(from).length - 1;
  if (!n) throw new Error('JS anchor not found: ' + String(from).slice(0, 80));
  if (count != null && n !== count) throw new Error(`expected ${count}× but found ${n}×: ${String(from).slice(0, 80)}`);
  js = all ? js.split(from).join(to) : js.replace(from, to);
}
function swapRe(re, to, min = 1) {
  const n = (js.match(re) || []).length;
  if (n < min) throw new Error('JS pattern not found: ' + re);
  js = js.replace(re, to);
}

// React and ReactDOM were globals.
swap('const { useState, useRef, useEffect, useLayoutEffect } = React;', '');

// Always embedded: no left rail, no own header, light theme. No gallery, no lab.
swapRe(/^const EMBED = .*$/m, 'const EMBED = true;');
swapRe(/^const GALLERY = .*$/m, 'const GALLERY = false;');
swapRe(/^const LAB = .*$/m, 'const LAB = false;');

// Portals and body-appended nodes go to the scoped host (see wflBridge.ts).
swapRe(/,\s*document\.body\)/g, ', wflHost())', 5);
swap('document.body.appendChild(bub)', 'wflHost().appendChild(bub)');
swap('document.body.appendChild(el)', 'wflHost().appendChild(el)');

// The theme lived on <html>; here it is a fixed attribute on the scope, so never touch <html>.
swap('document.documentElement.dataset.theme = theme;', '');

// postMessage → window events.
swapRe(/window\.parent\.postMessage\(([^;]*?), location\.origin\)/g, 'wflToHost($1)', 2);
swap('window.addEventListener("message", onMsg);', 'window.addEventListener(WFL_FRAME_EVENT, onMsg);');
swap('return () => window.removeEventListener("message", onMsg);', 'return () => window.removeEventListener(WFL_FRAME_EVENT, onMsg);');
swap('if (e.source !== window.parent || e.origin !== location.origin) return;', '');
swap('const m = e.data || {};', 'const m = e.detail || {};');

// Entry point: App takes the workflow to open, and reports every document change out.
swap('function App() {', 'export default function LinearBuilder({ initialDoc = null, initialName = "" } = {}) {');
swap('const [doc, setDoc] = useState(()=> EMBED ?', 'const [doc, setDoc] = useState(()=> initialDoc ? JSON.parse(JSON.stringify(initialDoc)) : EMBED ?');
swap('const [name, setName] = useState("Untitled rule");', 'const [name, setName] = useState(initialName || "Untitled rule");');
swap('const triggers = doc.triggers, flow = doc.flow;',
  'const triggers = doc.triggers, flow = doc.flow;\n  useEffect(()=>{ wflToHost({ wf:"doc", doc }); }, [doc]);');
swapRe(/\nReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(<App\/>\);\s*$/, '\n');
// The source owned the window; here it fills the editor pane under the product header and page bar.
swap('<div className="flex h-screen w-screen overflow-hidden"', '<div className="flex h-full w-full overflow-hidden"', { count: 1 });
// A workflow reopened from the listing may already be live.
swap('const [published, setPublished] = useState(false);', 'const [published, setPublished] = useState(!!initialPublished);');
swap('{ initialDoc = null, initialName = "" } = {}', '{ initialDoc = null, initialName = "", initialDesc = "", initialPublished = false } = {}');
swap('const [desc, setDesc] = useState(null);', 'const [desc, setDesc] = useState(initialDesc || null);');
// The save drawer reports every confirmed save, so the host can stamp the record even when
// nothing it mirrors (name / description / published) changed.
swap('const confirm = () => { if (blocked) return; if (isPub) setPublished(true); setSavePanel(null); };',
  'const confirm = () => { if (blocked) return; if (isPub) setPublished(true); setSavePanel(null); wflToHost({ wf:"saved", publish: isPub }); };');
// The source's prebuilt workflows seed the admin listing — real data, not invented rows.
js += '\nexport { USECASE_DOCS, USECASE_META, USECASE_IDS, RECORD_MODULES, TRIGGER_MENU_FLAT };\n';

const header = `// @ts-nocheck
/* GENERATED by scripts/port-workflow-linear.mjs from
 * D:\\Motadata\\Workflow_Sidebar_scroll\\linear\\index.html — the Linear workflow builder.
 * The code is the source's own, moved from Babel-in-the-browser to a module: React imports instead of
 * globals, window events instead of postMessage (wflBridge.ts), portals into the scoped host.
 * Types come later, file by file, as pieces are restyled onto project components. */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { wflHost, wflToHost, WFL_FRAME_EVENT } from '../wflBridge';
import './linear.css';
`;
fs.writeFileSync(path.join(OUT, 'LinearBuilder.tsx'), header + js);

/* ------------------------------------------------------------------ CSS
   Every rule is scoped under .wfl-scope (vars + descendants). <html>/<body> rules land on .wfl-root,
   the editor's own container, so the portal host never picks up body's height or background. */
/* `weak` = the page's own <style> rules: they keep their ORIGINAL specificity (:where adds none),
   because in the source they tied with Tailwind's utilities and lost on order. The skin's rules
   were html.embed-prefixed so they out-ranked utilities; .wfl-scope keeps that. Both sit in
   Tailwind's own utilities LAYER so the comparison with utilities is specificity, as it was. */
const scopeSel = (sel, weak) => {
  const SC = weak ? ':where(.wfl-scope)' : '.wfl-scope';
  let s = sel.trim();
  if (/\[data-theme="dark"\]/.test(s)) return null;               // dark-only rules: dropped
  if (s === ':root' || s === '[data-theme="light"]') return '.wfl-scope';
  s = s.replace(/^\[data-theme="light"\]\s*/, '');
  if (/^html\.embed\.lab\b/.test(s) || /^html\.lab\b/.test(s)) return null; // lab-only rules
  if (!s) return null;
  if (/^html\.embed\s+body\b/.test(s)) return s.replace(/^html\.embed\s+body/, '.wfl-root');
  if (/^html\.embed\b/.test(s)) {
    const rest = s.replace(/^html\.embed/, '');
    // " X" is a descendant of html.embed → ".wfl-scope X"; ".x" / ":hover" compound onto it.
    if (!rest.trim()) return '.wfl-scope';
    return /^\s/.test(rest) ? '.wfl-scope ' + rest.trimStart() : '.wfl-scope' + rest;
  }
  if (s === 'html' || s === 'body') return '.wfl-root';
  if (/^(html|body)\b/.test(s)) return s.replace(/^(html|body)/, '.wfl-root');
  return SC + ' ' + s;
};
const scopeCss = (css, weak) => postcss([{
  postcssPlugin: 'wfl-scope',
  Once(root) {
    root.walkRules((rule) => {
      if (rule.parent && rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      const out = [...new Set(rule.selectors.map((x) => scopeSel(x, weak)).filter(Boolean))];
      if (!out.length) rule.remove(); else rule.selectors = out;
    });
  },
}]).process(css, { from: undefined }).css;
const headCss = between(html, '<style>', '</style>');
/* Order as in the source: node-skin.css was linked BEFORE the page's <style>. Keyframes can't
   live inside a layer block's rules meaningfully either way, so everything goes in as-is. */
/* @import must open the file, never sit inside a layer block. */
const imports = [];
const skinBody = skin.replace(/@import\s+url\([^)]*\)[^;]*;/g, (m) => { imports.push(m); return ''; });
const scoped = imports.join('\n') + '\n@layer utilities {\n' + scopeCss(skinBody, false) + '\n' + scopeCss(headCss, true) + '\n}\n';
fs.writeFileSync(path.join(OUT, 'linear.css'),
  "/* GENERATED by scripts/port-workflow-linear.mjs — scoped copy of the Linear builder's CSS. */\n" + scoped);

console.log('ported:', (js.match(/\n/g) || []).length, 'lines of JS,', scoped.length, 'bytes of CSS');
