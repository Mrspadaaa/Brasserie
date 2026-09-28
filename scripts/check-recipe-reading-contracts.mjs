// Local production build with QA boundaries only. Never connect this to a real origin.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { tmpdir } from 'node:os';

const buildDir = resolve(process.env.HOP_QA_BUILD_DIR || resolve(tmpdir(), 'laffinee-hop-qa-recipe-open-final'));
const output = resolve(process.env.RECIPE_READING_OUTPUT || 'work/recipe-open-performance/evidence/reading-contracts');
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(buildDir, path === '/' ? 'tests/qa/hop-recipe/index.html' : `.${path}`);
    if (!file.startsWith(buildDir + sep)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const result = { buildDir, viewports: [], external: [], errors: [] };
let lastPage;
const click = async (page, selector) => {
  const node = await page.waitForSelector(selector, { visible: true });
  await node.evaluate(e => e.scrollIntoView({ block: 'center' }));
  await node.click();
};
const reading = page => page.waitForSelector('.recipe-reference button[aria-label="Modifier la recette"]', { visible: true });
try {
  for (const width of [390, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    lastPage = page;
    await page.setViewport({ width, height: width === 390 ? 844 : 900, hasTouch: width === 390, isMobile: width === 390 });
    page.on('pageerror', e => result.errors.push({ width, message: e.message }));
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (/^https?:/.test(req.url()) && !req.url().startsWith(origin + '/')) { result.external.push(req.url()); req.abort(); }
      else req.continue();
    });
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());
    const installedWrites = await page.evaluate(() => {
      const qa = window.__hopQa, normal = qa.recipe(4), other = qa.recipe(1), nolo = qa.nolo.recipe(2);
      Object.assign(normal, { id: 'reading-one', name: 'Lecture témoin', volumeL: 24 });
      Object.assign(other, { id: 'reading-two', name: 'Autre lecture', volumeL: 37 });
      Object.assign(nolo, { id: 'reading-nolo', name: 'Lecture NOLO' });
      qa.seedRecipes([normal, other, nolo]);
      return qa.metrics.writes;
    });
    await click(page, 'button[aria-label="Ouvrir la recette Lecture témoin"]');
    await reading(page);
    const before = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length,
      closed: !document.querySelector('.recipe-reference details[data-recipe-section="Potentiel aromatique"]').open }));
    assert(before.closed);
    assert.equal(before.writes, installedWrites, 'Opening the reading page must not write.');
    const unexpectedCalls = () => page.evaluate(() => window.__hopQa.calls.filter(name => name !== 'getBrewerActivity'));
    // The app's existing activity polling runs even without opening a recipe.
    // It is local in QA; any other call remains a failure here. In production
    // that endpoint can also mark expired jobs, independently of this gesture.
    assert.deepEqual(await unexpectedCalls(), []);
    // Cut the network before any secondary section has been visited.
    await page.setOfflineMode(true);
    await click(page, '.recipe-reference details[data-recipe-section="Potentiel aromatique"] > summary');
    await page.waitForSelector('.recipe-reference [aria-label="Outils de houblonnage"]', { visible: true });
    await click(page, '.recipe-reference [aria-label="Potentiel aromatique de la recette"] > details > summary');
    await page.waitForSelector('.recipe-reference input[aria-label="Toutes les saveurs et la chimie"]', { visible: true });
    await click(page, '.recipe-reference details[data-recipe-section="Conduite de levure"] > summary');
    await page.waitForSelector('.recipe-reference [aria-label="Conduite de levure de la recette"]', { visible: true });
    const offline = await page.evaluate(() => ({ online: navigator.onLine, errors: [...document.querySelectorAll('.recipe-reference [role="alert"]')].map(e => e.textContent),
      catalogueUnavailable: document.querySelector('.recipe-reference')?.textContent.includes('Catalogue indisponible'),
      primary: !!document.querySelector('.recipe-reference [aria-label="Repères de la recette"] dd') }));
    assert.equal(offline.online, false); assert(offline.primary);
    assert.equal(offline.catalogueUnavailable, false, 'An unvisited documentary catalogue must be available after the reading page is ready.');
    assert.equal(offline.errors.length, 0);
    assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), installedWrites, 'Opening reports must not write.');
    assert.deepEqual(await unexpectedCalls(), [], 'Reading reports must not call AI or mutation Functions.');
    // Local simulation state survives close/reopen and unrelated snapshot updates.
    await click(page, '.recipe-reference [aria-label="Outils de houblonnage"] [role="tab"]:nth-child(2)');
    await click(page, '.recipe-reference details[data-recipe-section="Potentiel aromatique"] > summary');
    await click(page, '.recipe-reference details[data-recipe-section="Potentiel aromatique"] > summary');
    await page.waitForFunction(() => document.querySelector('.recipe-reference [aria-label="Outils de houblonnage"] [aria-selected="true"]')?.textContent === 'Simuler');
    await page.evaluate(() => {
      const storage = window.__hopQa.storage, row = storage.getHopKnowledge().find(r => r.kind === 'yeast') ?? window.__hopQa.documentaryReference();
      storage.saveHopKnowledge({ ...row, name: row.name + ' · référence actualisée' });
      const recipe = storage.getRecipes().find(r => r.id === 'reading-one');
      storage.updateRecipe({ ...recipe, name: 'Lecture actualisée', volumeL: 30 });
    });
    await page.waitForFunction(() => document.querySelector('.recipe-reference h1')?.textContent === 'Lecture actualisée' &&
      document.querySelector('.recipe-reference [aria-label="Outils de houblonnage"] [aria-selected="true"]')?.textContent === 'Simuler');
    await page.waitForFunction(() => document.querySelector('.recipe-reference [role="alert"]')?.textContent.includes('La recette a changé'));
    await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
    const search = await page.waitForSelector('[name="universal_command_search_query"]', { visible: true });
    await search.focus(); await search.type('Autre lecture');
    await page.waitForFunction(() => [...document.querySelectorAll('[cmdk-item]')].some(e => e.textContent.includes('Autre lecture')));
    await page.keyboard.press('Enter');
    await reading(page);
    await page.waitForFunction(() => document.querySelector('.recipe-reference h1')?.textContent === 'Autre lecture');
    assert(await page.evaluate(() => !!document.activeElement?.closest('.recipe-reference')), 'The new reading page receives focus.');
    assert.equal(await page.$eval('.recipe-reference details[data-recipe-section="Potentiel aromatique"]', e => e.open), false);
    await page.keyboard.press('Escape');
    await page.waitForSelector('button[aria-label="Ouvrir la recette Lecture actualisée"]', { visible: true });
    const returnFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    assert.equal(returnFocus, 'Ouvrir la recette Lecture actualisée', 'Direct command navigation returns focus to the original catalogue trigger.');
    await click(page, 'button[aria-label="Ouvrir la recette Lecture NOLO"]');
    await reading(page);
    await page.waitForSelector('.recipe-reference [aria-label="Aperçu NOLO"]', { visible: true });
    await click(page, '.recipe-reference details[data-recipe-section="Suivi NOLO"] > summary');
    await page.waitForSelector('.recipe-reference [aria-label="Objectif NOLO"]', { visible: true });
    await page.screenshot({ path: resolve(output, `nolo-offline-${width}.png`) });
    assert.equal(result.external.length, 0);
    result.viewports.push({ width, offline, stateRetainedAfterDisclosureAndSnapshots: true, changedRecipeDetected: true,
      freshStateForDirectCommandRecipe: true, directCommandReturnFocus: returnFocus, primaryAndUnvisitedNoloAvailableOffline: true,
      initialReadWrites: before.writes - installedWrites, fixtureUpdatesOnly: true });
    await context.close();
  }
  assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
  await writeFile(resolve(output, 'results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  const state = lastPage && await lastPage.evaluate(() => ({ text: document.body.innerText,
    inputs: [...document.querySelectorAll('input')].map(e => ({name:e.name,role:e.getAttribute('role'),cmdk:e.hasAttribute('cmdk-input'),visible:!!e.getClientRects().length,inert:!!e.closest('[inert]')})),
    calls: window.__hopQa.calls, focus: document.activeElement?.outerHTML.slice(0, 800) }));
  await writeFile(resolve(output, 'failure.json'), JSON.stringify({ ...result, state, failure: error.stack }, null, 2));
  throw error;
} finally { await browser.close(); await new Promise(r => server.close(r)); }
