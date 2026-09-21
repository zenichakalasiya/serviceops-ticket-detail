/* Capture the REAL banner of every offered template, for the picker tiles.
 *
 * The tiles used to be drawn — a skeleton built from each template's own config — on the rule that a
 * drawing cannot promise a banner the template does not build. It is a good rule and it produced a
 * grid of grey bars: every tile the same shapes in different colours, which is the one thing a
 * picker of banners must not be. These are photographs of the banner itself, taken by running the
 * real builder.
 *
 * ⚠️ They are snapshots, so they go stale. Edit a template — its colours, its pieces, its copy — and
 * re-run this; nothing else regenerates them. That is the price of the pictures, and it is written
 * on the tile component too.
 *
 * Usage (with a dev server already running):
 *   node scripts/capture-banners.mjs [url]
 * Default url: http://127.0.0.1:5233/serviceops-ticket-detail/#/admin/support-portal
 *
 * ⚠️ `playwright-core` is not a dependency of this repo — it is resolved from the npx cache, the same
 * way the UI checks in CLAUDE.md drive the app. If the path below stops existing, install
 * playwright-core anywhere and point PLAYWRIGHT_CORE at it.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const NL = String.fromCharCode(10);
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '..', 'public', 'banner-shots');
const URL_ARG = process.argv[2] ?? 'http://127.0.0.1:5233/serviceops-ticket-detail/#/admin/support-portal';
const CORE = process.env.PLAYWRIGHT_CORE
  ?? 'C:/Users/Zeni Chakalasiya/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const { chromium } = await import(pathToFileURL(CORE).href);

/* The offered templates, by name as the picker prints them. Keep in step with `featured: true`
   in portalBannerTemplates.ts — a name here with no tile is simply never captured. */
const HORIZONTAL = [
  ['3b2', 'Sidecar · Announcements'],
  ['3g', 'Atlas'],
  ['2a', 'Prism · Coral'],
  ['5a', 'Meridian'],
  ['4b', 'Broadsheet'],
  ['3h', 'Concierge'],
  ['4d', 'Portico'],
  ['3c', 'Counter'],
];
const VERTICAL = [
  ['4f', 'Front Desk'],
  ['4f2', 'Counter · Image'],
  ['4g', 'Half Deck'],
  ['4e', 'Atrium'],
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ /* ⚠️ A WIDE viewport and scale 1. The banner is full of container queries — at a narrow window its
     pieces stack and the shot stops being the banner people will get — while scale 2 quadrupled every
     file for a tile drawn at a fraction of the width. */
  viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

/* Every banner has its own proportion — a 260px band and a 540px one are not the same picture — so
   the tiles need the ratio to draw each shot whole at the tile's width. Read straight out of the PNG
   header (IHDR: width at byte 16, height at byte 20, big-endian). */
const ratios = {};

/* ⚠️ The editor's own chrome is hidden FOR THE SHOT ONLY. A tile shows what a requester sees, and the
   builder draws a selection outline, eight resize handles and a floating toolbar over whatever is
   selected — all of which was baked into the first set of pictures. Hiding it for the whole run is
   what the first fix did, and it took the Delete button with it, so the banner was never cleared
   between shapes and every later shot was of the wrong banner. */
const CHROME_OFF = `
  body > div[class*="z-[9999]"] { display: none !important; }
  [data-node] { outline: none !important; }
  [class*="z-[30]"], [class*="z-[35]"], [class*="z-40"], [class*="z-[45]"] { display: none !important; }
  /* the pink gap bands, and the seam that offers a new section */
  [class*="FF24BD"], [data-add-section] { display: none !important; }
`;

const shoot = async (id) => {
  await page.waitForTimeout(500);
  const hide = await page.addStyleTag({ content: CHROME_OFF });
  const band = page.locator('[data-banner-band]').first();
  const buf = await band.screenshot({ type: 'png' });
  await hide.evaluate((n) => n.remove());
  writeFileSync(resolve(OUT_DIR, `${id}.png`), buf);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  ratios[id] = Number((w / h).toFixed(3));
  console.log('captured', id, `${w}x${h}`, `${buf.length} bytes`);
};

/* A fresh from-scratch portal, so no template's own page content is in the shot. */
await page.goto(URL_ARG, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);


await page.getByRole('button', { name: 'Create support portal' }).click();
await page.waitForTimeout(400);
await page.getByPlaceholder('Support Portal Name').fill('Banner shots');
await page.getByPlaceholder('Support Portal URL').fill('banner-shots');
await page.locator('select:visible').first().selectOption({ index: 1 }).catch(() => {});
await page.getByRole('button', { name: /^Save/ }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Start from scratch/ }).click();
await page.waitForTimeout(1000);

/* The scratch banner is a tile too — one per shape. */
for (const [orient, id] of [['Horizontal', 'scratch-h'], ['Vertical', 'scratch-v']]) {
  await page.getByText('Banner', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(500);
  const shape = page.getByRole('button', { name: new RegExp(`^${orient}`) }).first();
  if (await shape.count()) { await shape.click(); await page.waitForTimeout(400); }
  await page.getByText('Start from scratch', { exact: true }).first().click();
  await page.waitForTimeout(900);
  await shoot(id);
  /* Delete it, so the next pass starts from the two-step flow again. */
  await page.locator('button[data-tip="Delete the banner"]').first().click().catch(() => {});
  await page.waitForTimeout(600);
}

/* Then every template, applied from the Banners rail. */
await page.getByText('Banner', { exact: true }).first().click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /^Horizontal/ }).first().click();
await page.waitForTimeout(400);
await page.getByText('Start from scratch', { exact: true }).first().click();
await page.waitForTimeout(900);

for (const [tab, list] of [['Horizontal', HORIZONTAL], ['Vertical', VERTICAL]]) {
  for (const [id, name] of list) {
    /* ⚠️ Only open it when it is CLOSED — clicking a lit rail item closes the panel, so opening it
       unconditionally toggled it shut on the second template and every tile went missing.
       ⚠️ The test is the TAB HOOK, not "are there any aria-pressed buttons": the widget panel's own
       segmented controls carry aria-pressed too, so that check reported the panel open while it was
       showing the banner's settings. */
    if (!(await page.locator('[data-banner-tab]').count())) {
      await page.locator('button:has-text("Banners")').last().click();
      await page.waitForTimeout(400);
    }
    /* ⚠️ By its own data hook. Matching the tab by TEXT caught the first button on the page holding
       the word, and by accessible NAME it caught the canvas toolbar's "Horizontal — items side by
       side", whose title reads the same. The panel names its tabs so this cannot happen. */
    await page.locator(`[data-banner-tab="${tab.toLowerCase()}"]`).click();
    await page.waitForTimeout(300);
    await page.locator('button[aria-pressed]').filter({ hasText: name }).first().click();
    await page.waitForTimeout(900);
    await shoot(id);
  }
}

await browser.close();
/* ⚠️ A GENERATED module, committed beside the pictures. The tiles need these numbers as they render,
   so a JSON file fetched at runtime would leave every tile a frame short of its own height.
   Re-running this script rewrites it; nothing else should. */
const ts = [
  '/* GENERATED by scripts/capture-banners.mjs — do not edit by hand.',
  ' *',
  ' * The proportion (width / height) of each captured banner, so a tile can draw the whole shot at its',
  ' * own width instead of cropping it to a fixed box. A banner is recognised by the arrangement across',
  ' * its width, and a crop takes that away first. */',
  'export const BANNER_SHOT_RATIO: Record<string, number> = {',
  ...Object.entries(ratios).map(([k, v]) => `  '${k}': ${v},`),
  '};',
  '',
].join(NL);
writeFileSync(resolve(HERE, '..', 'src', 'app', 'components', 'bannerShots.ts'), ts);
console.log(NL + 'Wrote', Object.keys(ratios).length, 'shots to', OUT_DIR);
