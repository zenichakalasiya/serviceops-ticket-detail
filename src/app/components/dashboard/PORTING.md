# Porting the Dashboard module (Vue 3 → React) — the contract every port follows

Source (read-only clone of zenichakalasiya/ServiceOps_Dashboard_v2):
`C:/Users/ZENICH~1/AppData/Local/Temp/claude/D--Motadata-ServiceOps-Ticket-Detail--main-ServiceOps-Ticket-Detail--main/66c5f227-6c90-4a6d-b441-8eeeeb8812bd/scratchpad/dashv2/src`
Read the source's `CLAUDE.md` at the clone root for the reasoning behind its behaviour.

Target: `src/app/components/dashboard/` in the React + TS + Vite + Tailwind v4 app at
`D:/Motadata/sync-upstream` (git worktree, branch `sync/upstream-oct`).

## Goal
A FAITHFUL port: same behaviour, same layout, same copy, same comments' intent. Do not redesign,
do not drop features, do not "simplify". The ONLY deliberate visual changes are the control swaps
in "Product controls" below (Zeni's rule: CTAs, form fields and radios are the product's).

## Already in place (do not rewrite — import these)
| What | Path (from `dashboard/components/X.tsx`) |
|---|---|
| Store (the Vue `store/index.js`, same exports: `store`, `live`, `byId`, `toast`, `createDashboard`…) | `../store.js` |
| Reactivity: `reactive`, `computed` (`{ value }`), `useDashStore()`, `useReactive(obj)`, `useRefState(v)` (`{ value }`) | `../reactivity.js` |
| Data layer — every `src/data/*.js`, same names | `../data/<name>.js` |
| Router shim: `router.push('/dashboard/<id>')`, `useDashRoute()` → `{ params: { id }, name, path }` | `../nav.js` |
| `Icon`, `Dropdown`, `ConfirmDialog`, `Hint`, `DashPortal` (= `<teleport to="body">`) | `../ui/primitives` |
| Scoped design tokens + the prototype's global primitives (`.btn`, `.btn-primary`, `.btn-sm`, `.btn-icon`, `.chip`, `.input`, `.menu`, `.menu-item`, `.tabs`/`.tab`, `.tt`, `.card`, `.overlay`, `.modal`, `.note-body` …) — already restyled to product controls | `dashboard.css` (loaded once by the page) |
| ECharts: `echarts` + `echarts-for-react` are installed | — |

Every screen renders inside `<div className="dash-root" data-theme=…>`, so `var(--ink)`, `var(--surface)`
etc. resolve. Anything rendered OUTSIDE that tree (a teleport) must go through `<DashPortal>`.

## File layout
- One Vue SFC → `dashboard/components/<Name>.tsx` + (if it has `<style scoped>`) `<Name>.css`.
- Named export with the SFC's name: `export function WidgetCard(props) {…}` (or `forwardRef` — below).
- Import siblings as `./<Name>` even if another agent has not written them yet. Their names/paths
  are fixed by this table. Do not create stub copies of a component you do not own.
- TypeScript is loose here: `props: any` is fine. Do not spend effort on types.

## Mapping rules
- `defineProps({ foo })` → prop `foo` (same name, same default).
- `emit('bar', x)` → callback prop `onBar(x)`; kebab events → camelCase: `emit('add-widget')` → `onAddWidget`.
- `v-model` / `modelValue` + `update:modelValue` → props `modelValue` + `onUpdateModelValue(v)`.
  `v-model:open` → `open` + `onUpdateOpen(v)`. Keep this EXACT naming — other ports call you with it.
- Default slot → `children`. Named slot `foo` → prop `slotFoo` (ReactNode, or a function for scoped slots).
- `defineExpose({ a, b })` → `forwardRef` + `useImperativeHandle(ref, () => ({ a, b }))`.
- Local `ref(x)` → `useState` when it is replaced wholesale; when the code MUTATES an object/array in
  place (`x.value.push`, `obj.field = …`), use `useRefState(x)` (keeps `x.value`) or `useReactive(obj)`.
- `computed(() => …)` inside a component → plain expression / `useMemo` (store reads must not be memoised
  across store changes — just compute them in render).
- Any component that reads `store` must call `useDashStore()` at its top (that subscribes it).
- `watch` / `watchEffect` → `useEffect` with the right deps. `onMounted`/`onBeforeUnmount` → `useEffect`.
- `<transition>` → render conditionally; keep enter animations as CSS keyframes if they matter.
- `nextTick` → `requestAnimationFrame` / `queueMicrotask`.
- `v-html` → `dangerouslySetInnerHTML`.
- `router.push(...)` → `router.push` from `../nav.js`; `useRoute()` → `useDashRoute()`.

## Styling
- Copy the SFC's `<style scoped>` into `<Name>.css` wrapped in **`@scope (.dc-<Name>) { … }`**, and put
  `dc-<Name>` on the component's root element. `:deep(x)` → `x`. Keep `@keyframes` OUTSIDE the
  `@scope` block, renamed `dc-<Name>-<orig>`, and update their uses. A `<DashPortal>` subtree must ALSO
  carry `dc-<Name>` on its own root element, because it is not inside your root.
- Keep the class names from the template, so the CSS still matches.

## Product controls (Zeni's rule — this is the one place the look CHANGES)
Use the product's, not the prototype's:
- **Primary CTA** → `.btn btn-primary` (already the product blue `#3D8BD0` in dashboard.css). Never a
  near-black / `var(--sel)` filled button.
- **Secondary** → `.btn`. **Small** → add `.btn-sm`.
- **Segmented choices / radios / tab strips** (the prototype's `.seg` / `.seg-b` / black pills /
  `.tabs`) → the product's **`pill-track`**: container `className="pill-track"`, each option a
  `<button aria-pressed={on}>label</button>`. The pill is drawn by `aria-pressed` — without it the option
  shows no selection. (Example: Public / Private / Restricted, Manual / Query based.)
- **Selects** → `Dropdown` from `../ui/primitives` (it renders the product's RuleSelect).
- **Text inputs / textareas** → `.input` (already the product's 4px field), or `inputCls` from
  `../../FormRuleControls` for a Tailwind-styled field. Field labels → `FieldLabel` from the same file.
- **On/off switch** → `ToggleSwitch` from `../../FormRuleControls`. A record's ON/OFF **status** in a
  listing → `StatusToggle` from the same file.
- **Tags / chip inputs** → `TagEditor` from `../../FormRuleControls`.
- **Toasts** → `toast()` from `../store.js` (routes to the product's sonner).
- Status badges, charts, tiles, illustrations, loaders: KEEP the prototype's look.

If something in your files has no clean product equivalent, keep the prototype's version and LIST it
in your final report under "No product equivalent — kept prototype UI".

## Out of scope (do not port)
Iris (`src/iris/`), `AiShowcase`, `AiShowcaseTile`, `AiPlacementLab`, `AiInsightsPanel`, `IconLibrary`,
`LoaderGallery`, `PreviewStateGallery`, `ModuleStub`, `ModuleListing`, `ModuleRail`, `AppSidebar`,
`AppTopbar`, `Toasts`, `DashboardListing`, `AllDashboards`, `ArchivePage` (the product's own sidebar
and header replace the shell). If a file you own references one of these, drop that reference and say so.

## Verify before you report
1. Do NOT run `vite build` — four other ports are writing into the same folder at the same time, and
   the build fails until every sibling exists. Integration and the full build happen after you report.
2. Typecheck YOUR files and fix real errors (ignore "Cannot find module" / "has no exported member"
   for siblings that are not written yet):
   `pnpm --package=typescript@5.6.3 dlx tsc --noEmit --jsx react-jsx --skipLibCheck --moduleResolution bundler --module esnext --target es2020 --strict false --allowJs <your files>`
   This catches a symbol used but never imported/declared — a blank page at runtime.
3. Do NOT edit files you do not own, except where your brief says so. Never touch `main`, never commit.
