/* Vue's scoped CSS styles a component's ROOT element as well as its descendants. Inside
 * `@scope (.dc-X) { … }` a plain selector like `.chart` does NOT match the scoping root itself,
 * so every rule written for the root (`.chart { display:flex }`) was silently lost — that is what
 * left every ECharts canvas 0px tall.
 *
 * For each selector in an @scope block this adds a root-anchored twin: the first compound moved
 * into `:scope:is(…)`, e.g. `.chart .row` → `.chart .row, :scope:is(.chart) .row`. A pseudo-element
 * stays outside :is() (`.x::before` → `:scope:is(.x)::before`). Selectors already using :scope are
 * left alone. Idempotent: a twin is never added twice.
 *   node scripts/scope-root-fix.mjs src/app/components/dashboard/components/*.css */
import fs from 'fs';
import postcss from '../node_modules/.pnpm/postcss@8.5.15/node_modules/postcss/lib/postcss.js';

function firstCompound(sel) {
  let depth = 0, inStr = null;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && (c === ' ' || c === '>' || c === '+' || c === '~')) return [sel.slice(0, i), sel.slice(i)];
  }
  return [sel, ''];
}
function twin(sel) {
  const s = sel.trim();
  if (!s || s.includes(':scope')) return null;
  let [head, rest] = firstCompound(s);
  let pseudo = '';
  const pe = head.indexOf('::');
  if (pe >= 0) { pseudo = head.slice(pe); head = head.slice(0, pe); }
  if (!head || head === '*' || head.startsWith('[data-theme')) return null;
  return `:scope:is(${head})${pseudo}${rest}`;
}
let changed = 0;
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  const ast = postcss.parse(src);
  ast.walkAtRules('scope', (at) => {
    at.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
      const sels = rule.selectors;
      const add = sels.map(twin).filter((t) => t && !sels.includes(t));
      if (add.length) { rule.selectors = [...sels, ...add]; changed++; }
    });
  });
  fs.writeFileSync(f, ast.toString());
}
console.log('rules given a root twin:', changed);
