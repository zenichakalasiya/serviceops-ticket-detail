// Renders the create-form help guides (src/app/components/createFormGuides.ts) into one review page.
// Node strips the TypeScript types itself (Node 22.6+), so the page reads the SAME words the app shows.
//   node scripts/build-form-guides.mjs <out.html> [screenshot.png]
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { FORM_HELP } = await import(pathToFileURL(resolve('src/app/components/createFormGuides.ts')).href);
const [out, shot] = process.argv.slice(2);

/* Same order as the left rail. */
const ORDER = [
  ['task', 'Tasks'], ['license', 'Software Licenses'], ['patch', 'Patches'], ['patch-deployment', 'Patch Deployments'],
  ['package-deployment', 'Package Deployments'], ['registry-deployment', 'Registry Deployments'],
  ['auto-patch-test', 'Automatic Patch Tests'], ['auto-patch-deployment', 'Automatic Patch Deployments'],
  ['knowledge', 'Knowledge'], ['report', 'Reports'],
];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const li = (xs) => `<ul class="dots">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

const guide = ([id, from]) => {
  const h = FORM_HELP[id];
  return `
<section class="guide" id="${id}">
  <header class="g-head">
    <p class="eyebrow">${esc(from)} › Create</p>
    <h2>${esc(h.noun)} Guide</h2>
    <p class="lede">${esc(h.intro)}</p>
  </header>
  <div class="g-grid">
    <div class="g-main">
      <div class="before"><h3>Before you start</h3>${li(h.before)}</div>
      <h3 class="block-h">How to create it</h3>
      <ol class="steps">
        ${h.steps.map((s, i) => `
        <li class="step">
          <span class="num">${i + 1}</span>
          <div class="step-body">
            <p class="sec">${esc(s.section.join(' / '))}</p>
            <h4>${esc(s.title)}</h4>
            <p>${esc(s.text)}</p>
            ${s.tips ? li(s.tips) : ''}
          </div>
        </li>`).join('')}
      </ol>
    </div>
    <aside class="g-side">
      <div class="card"><h3>Fields explained</h3>
        <dl class="fields">${h.fields.map(([k, t]) => `<dt>${esc(k)}</dt><dd>${esc(t)}</dd>`).join('')}</dl></div>
      <div class="card"><h3>Example</h3><p class="ex-title">${esc(h.example.title)}</p>
        <table class="ex"><tbody>${h.example.rows.map(([k, t]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(t)}</td></tr>`).join('')}</tbody></table></div>
      <div class="card warn"><h3>Common mistakes</h3>${li(h.mistakes)}</div>
    </aside>
  </div>
</section>`;
};

const img = shot ? `data:image/png;base64,${readFileSync(shot).toString('base64')}` : '';

const html = `<title>Create Form Guides</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600&display=swap">
<style>
/* Layout: a sticky list of the ten forms on the left, one guide per form on the right, each guide
   split into the steps (read in order) and a side column of reference cards (looked up). */
:root {
  --bg: #F7F9FC; --surface: #FFFFFF; --fg: #1D2A3E; --muted: #5B6B80; --faint: #8A9AB0;
  --line: #E2E8F0; --accent: #3D8BD0; --accent-soft: #EBF5FF; --accent-line: #CFE3F5;
  --warn: #B45309; --warn-soft: #FFF8EB; --warn-line: #F6DFB4; --ink: #1D2A3E;
  --display: "Source Serif 4", Georgia, serif; --body: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #0E1726; --surface: #152236; --fg: #E4EAF2; --muted: #A3B1C4; --faint: #7D8DA3;
  --line: #26364D; --accent: #6AAEE6; --accent-soft: #17304A; --accent-line: #24496C;
  --warn: #F2B866; --warn-soft: #2A2214; --warn-line: #4A3A1E; --ink: #E4EAF2; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #0E1726; --surface: #152236; --fg: #E4EAF2; --muted: #A3B1C4; --faint: #7D8DA3;
  --line: #26364D; --accent: #6AAEE6; --accent-soft: #17304A; --accent-line: #24496C;
  --warn: #F2B866; --warn-soft: #2A2214; --warn-line: #4A3A1E; --ink: #E4EAF2; color-scheme: dark }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font: 14px/1.6 var(--body); }
.wrap { max-width: 1240px; margin: 0 auto; padding-block: 40px 80px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 40px; }
nav { position: sticky; top: calc(env(safe-area-inset-top, 0px) + 24px); align-self: start; }
nav p { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin: 0 0 8px; }
nav a { display: block; padding: 6px 10px; border-radius: 6px; color: var(--muted); text-decoration: none; font-size: 13px; }
nav a:hover { background: var(--surface); color: var(--fg); }
nav a:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
main { min-width: 0; }
.intro h1 { font: 600 34px/1.15 var(--display); margin: 0 0 10px; text-wrap: balance; }
.intro > p { max-width: 68ch; color: var(--muted); margin: 0 0 12px; }
.how { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 24px; align-items: start;
  background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin: 24px 0 8px; }
.how h3 { margin: 0 0 8px; font-size: 15px; }
.how ul { margin: 0; padding-left: 18px; color: var(--muted); }
.how li { margin-bottom: 6px; }
.how img { width: 100%; border-radius: 8px; border: 1px solid var(--line); display: block; }
.guide { padding-top: 48px; margin-top: 40px; border-top: 1px solid var(--line); scroll-margin-top: 16px; }
.eyebrow { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.g-head h2 { font: 600 26px/1.2 var(--display); margin: 4px 0 8px; }
.lede { max-width: 70ch; color: var(--muted); margin: 0; }
.g-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 28px; margin-top: 20px; align-items: start; }
h3 { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
.block-h { font-size: 15px; margin: 22px 0 12px; }
.before { background: var(--accent-soft); border: 1px solid var(--accent-line); border-radius: 10px; padding: 12px 16px; }
.before ul { margin: 0; }
.steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.step { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
.num { width: 24px; height: 24px; border-radius: 50%; background: var(--ink); color: var(--bg); font-size: 12px; font-weight: 600; display: grid; place-items: center; font-variant-numeric: tabular-nums; }
.sec { margin: 0; font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); }
.step h4 { margin: 2px 0 4px; font-size: 14.5px; }
.step p { margin: 0; color: var(--muted); }
.dots { margin: 8px 0 0; padding-left: 18px; color: var(--muted); }
.dots li { margin-bottom: 4px; }
.dots li::marker { color: var(--faint); }
.g-side { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
.card.warn { background: var(--warn-soft); border-color: var(--warn-line); }
.card.warn h3 { color: var(--warn); }
.fields { margin: 0; }
.fields dt { font-weight: 600; font-size: 13px; }
.fields dd { margin: 0 0 10px; color: var(--muted); font-size: 13px; }
.ex-title { margin: 0 0 6px; font-weight: 600; }
.ex { width: 100%; border-collapse: collapse; font-size: 13px; }
.ex th { text-align: left; font-weight: 500; color: var(--faint); padding: 5px 12px 5px 0; vertical-align: top; width: 40%; }
.ex td { padding: 5px 0; color: var(--fg); }
.ex tr + tr th, .ex tr + tr td { border-top: 1px solid var(--line); }
@media (max-width: 900px) {
  .wrap { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  nav { position: static; display: flex; flex-wrap: wrap; gap: 4px; }
  nav p { width: 100%; }
  .how, .g-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>
<div class="wrap">
  <nav aria-label="Forms"><p>Create forms</p>${ORDER.map(([id, from]) => `<a href="#${id}">${esc(from)}</a>`).join('')}</nav>
  <main>
    <div class="intro">
      <h1>Create Form Guides</h1>
      <p>The help guide for each of the ten create forms, written to teach someone how to fill the form well, not only what each field is. Every guide follows the same shape: what the record is, what to have ready, the steps in form order, the fields people misread, a filled-in example, and the common mistakes.</p>
    </div>
    <div class="how">
      <div>
        <h3>How it sits in the product</h3>
        <ul>
          <li>The form is left-aligned at the header's edge; the guide is pinned to the right edge of the screen. Each scrolls on its own.</li>
          <li>The step for the section you are in, or the field you clicked into, is highlighted in blue and kept in view.</li>
          <li>Click a step's number to jump the form to that section. Steps for sections that have not appeared yet (for example Target endpoints before anything is added) are greyed with the reason on hover.</li>
          <li>Steps start open; Fields explained, Example and Common mistakes start folded.</li>
          <li>The look follows the Form Rules guide: a dark accent bar on the title, dark section tiles, soft grey accordions.</li>
        </ul>
      </div>
      ${img ? `<img src="${img}" alt="Create Patch Deployment with its guide on the right; step 2, Set the window, is highlighted beside the Schedule section">` : ''}
    </div>
    ${ORDER.map(guide).join('\n')}
  </main>
</div>`;

writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024).toFixed(0) + ' KB');
