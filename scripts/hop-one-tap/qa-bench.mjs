// Adaptateur : app actuelle sur le banc QA local (tests/qa/hop-recipe : vraie interface,
// données isolées, réseau externe bloqué). Recette neuve, style Stout, étape Houblons,
// stock de production du 17.10.2026. Témoin négatif tant que l'étape n'est pas refaite.
// SKIP_BUILD=1 réutilise la construction existante dans TEMP.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { productionHopStock, productionCatalogueOnly } from './stock-production.mjs';

export const stock = productionHopStock;
export const catalogueOnly = productionCatalogueOnly;
export const scope = '.recipe-wizard';
export const settleMs = 1500;
const style = process.env.STYLE || 'Stout';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };

export async function setup({ repo }) {
  const buildDir = path.resolve(os.tmpdir(), process.env.QA_BUILD_DIR || 'laffinee-hop-qa-one-tap');
  if (process.env.SKIP_BUILD !== '1' || !fs.existsSync(buildDir)) {
    const { buildHopRecipeQa } = await import(pathToFileURL(path.resolve(repo, 'scripts/build-hop-recipe-qa.mjs')).href);
    await buildHopRecipeQa(buildDir);
  }
  const server = createServer(async (req, res) => {
    try {
      const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(buildDir, p === '/' ? 'tests/qa/hop-recipe/index.html' : `.${p}`);
      if (!file.startsWith(buildDir + path.sep)) { res.writeHead(403); res.end(); return; }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function clickVisible(page, selector, label) {
  for (const h of await page.$$(selector)) {
    const ok = await h.evaluate((e, m) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' &&
      (!m || (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ') === m), label);
    if (ok) { await h.click(); return true; }
  }
  return false;
}

export async function open(page, { ctx }) {
  // Réseau externe bloqué : seul le banc local répond.
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(ctx.base) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
  await page.evaluateOnNewDocument(() => {
    try { if (!localStorage.getItem('laffinee_ui_state')) localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })); } catch { /* about:blank */ }
  });
  // QA_CATALOGUE=production : catalogue limité à l'instantané de production (tests/fixtures/production/).
  await page.goto(ctx.base + (process.env.QA_CATALOGUE === 'production' ? '/?catalogue=production' : '/'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__hopQa?.ready(), { timeout: 30000 });
  await page.waitForFunction(() => document.body.innerText.includes('Recettes'), { timeout: 30000 });
  await page.evaluate((rows) => {
    rows.forEach((s, i) => {
      const id = 'prod-hop-' + i;
      window.__hopQa.storage.addStockItem('rawMaterials', { id, ref: id, name: s.name, category: 'Houblon', unit: 'g', currentStock: s.grams, minStock: 0, reorder: false, ...(s.alphaPct ? { alphaPct: s.alphaPct } : {}) });
    });
  }, stock);
  await clickVisible(page, '.floating-actions button[aria-label="Actions rapides"]');
  await clickVisible(page, '[role="menuitem"]', 'Créer une recette');
  await page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
  const styleSelector = '.recipe-wizard [aria-label="Style de la bière"]';
  await page.waitForSelector(styleSelector, { visible: true });
  if (await page.$eval(styleSelector, (e) => e.readOnly)) { const f = page.locator(styleSelector); await f.click(); await f.click(); }
  await page.locator(styleSelector).fill(style);
  await sleep(400);
  await page.evaluate((s) => {
    const opts = [...document.querySelectorAll('li[role="option"]')].filter((n) => n.getClientRects().length);
    (opts.find((n) => n.querySelector('span span')?.textContent?.trim() === s) || opts.find((n) => n.innerText.includes(s)))?.click();
  }, style);
  await sleep(300);
  await clickVisible(page, '.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Houblons"]');
  await page.waitForFunction(() => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === 'Houblons', { timeout: 20000 });
  await sleep(2500);
}

export function teardown(ctx) { ctx?.server?.close(); }
