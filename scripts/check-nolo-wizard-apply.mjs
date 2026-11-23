// Local QA only: real App with fixture adapters, no remote requests or production writes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';

const buildDir = resolve(tmpdir(), 'laffinee-hop-qa-nolo-wizard');
const output = resolve(process.env.NOLO_WIZARD_QA_OUTPUT || resolve(tmpdir(), 'laffinee-nolo-wizard-apply-20260925'));
await mkdir(output, { recursive: true });
if (process.env.NOLO_WIZARD_QA_SKIP_BUILD !== '1') await buildHopRecipeQa(buildDir);
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(buildDir, path === '/' ? 'tests/qa/hop-recipe/index.html' : '.' + path);
    if (!file.startsWith(buildDir + sep)) { response.writeHead(403); response.end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [];

async function button(page, label) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('button')]
    .find(element => element.getClientRects().length && !element.disabled && element.textContent.trim().includes(label)), {}, label);
  await handle.asElement().evaluate(element => element.scrollIntoView({ block: 'center' }));
  await handle.asElement().click();
  await handle.dispose();
}
async function step(page, label) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')]
    .find(element => element.getClientRects().length && (element.getAttribute('aria-label') === label || element.textContent.trim() === label)), {}, label);
  await handle.asElement().click();
  await handle.dispose();
}
async function openEdit(page, name) {
  const selector = `[aria-label=${JSON.stringify(`Modifier la recette ${name}`)}]`;
  const handle = await page.waitForSelector(selector, { timeout: 12000 });
  const closed = await handle.evaluateHandle(element => { const details = element.closest('details'); return details && !details.open ? details.querySelector('summary') : null; });
  if (closed.asElement()) await closed.asElement().click();
  await page.locator(selector).click();
  await page.waitForSelector('#wz-title', { visible: true });
}
async function capture(page, name, selector, block = 'start') {
  const target = await page.$(selector);
  if (target) await target.evaluate((element, block) => element.scrollIntoView({ block }), block);
  const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth }));
  assert(dimensions.scrollWidth <= dimensions.width + 1, `${name}: débordement horizontal`);
  const file = resolve(output, `${name}.png`);
  await page.screenshot({ path: file });
  return { file, ...dimensions };
}

try {
  for (const width of [390, 1280]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width === 390, hasTouch: width === 390 });
    await page.setRequestInterception(true);
    page.on('request', request => /^https?:/.test(request.url()) && !request.url().startsWith(base + '/')
      ? (external.push(request.url()), request.abort()) : request.continue());
    await page.evaluateOnNewDocument(() => { localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })); });
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());
    const name = `NOLO raccord ${width}`, id = `QA-NOLO-RACCORD-${width}`, batchId = `QA-FROZEN-RACCORD-${width}`;
    const original = await page.evaluate(({ name, id, batchId }) => {
      const recipe = window.__hopQa.nolo.recipe(20);
      Object.assign(recipe, { id, name, yeastGuide: undefined, yeastDesign: undefined, batchRef: undefined });
      window.__hopQa.seedRecipe(recipe);
      const batch = { ...recipe, id: batchId, name: `Brassin figé ${name}`, status: 'planifie', brewDate: '25.09.2026', stockAccountingVersion: 1, gravityLog: [],
        recipeSnapshot: { ...structuredClone(recipe), capturedAt: '2026-09-25' }, brewDay: { steps: [], currentIndex: 0, readings: [] } };
      window.__hopQa.storage.addBatch(batch);
      return { recipe: structuredClone(window.__hopQa.storage.getRecipes().find(row => row.id === id)),
        snapshot: structuredClone(window.__hopQa.storage.getBatches().find(row => row.id === batchId).recipeSnapshot) };
    }, { name, id, batchId });
    await openEdit(page, name);
    await step(page, 'Levure');
    assert.equal(await page.$('[aria-label="Simulateur de recette NOLO"]'), null, 'L’adoption du matériel précède la proposition');
    const before = await capture(page, `nolo-avant-adoption-${width}`, '[role="status"]');
    await button(page, 'Adapter à mon matériel actuel');
    await page.waitForSelector('[aria-label="Simulateur de recette NOLO"]', { visible: true });
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(row => row.id === id), id), original.recipe, 'Adoption limitée au brouillon');
    await page.select('[aria-label="Levure de la simulation"]', 'lalbrew-lona');
    await page.waitForFunction(() => !document.querySelector('.nolo-solver-apply')?.disabled);
    const proposed = await page.evaluate(() => {
      const table = document.querySelector('[aria-label="Changements proposés dans la recette NOLO"]');
      const water = [...table.querySelectorAll('tr')].find(row => row.querySelector('th')?.textContent.trim() === 'Eau');
      const band = document.querySelector('[aria-label="Résultat de la simulation NOLO"]');
      const preview = document.querySelector('[aria-label="Eau proposée pour le scénario NOLO"]');
      return { water: water?.cells[2]?.textContent.trim(), max: Number(band.getAttribute('data-nolo-max')),
        preview: preview?.innerText };
    });
    assert.equal(proposed.water, '15,5 L + 17,4 L');
    assert(Number.isFinite(proposed.max));
    assert.match(proposed.preview, /Ratio atteint 9,16 L\/kg/);
    assert.match(proposed.preview, /Aucune dose d’acide calculée/);
    await page.evaluate(() => {
      const simulator = document.querySelector('[aria-label="Simulateur de recette NOLO"]');
      [...simulator.querySelectorAll('details')].filter(details => /Champs de la recette|Hypothèses, limites/.test(details.querySelector('summary')?.textContent || ''))
        .forEach(details => { details.open = true; });
    });
    const proposal = await capture(page, `nolo-proposition-${width}`, '[aria-label="Simulateur de recette NOLO"]');
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(row => row.id === id), id), original.recipe, 'Simulation locale sans sauvegarde');
    await button(page, 'Appliquer à la recette');
    await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(element => element.textContent.includes('Programme appliqué à la recette')));
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(row => row.id === id), id), original.recipe, 'Application limitée au brouillon');
    let waterDraft;
    let saltsDraft;
    if (process.env.NOLO_WIZARD_QA_SKIP_WATER !== '1') {
      await step(page, 'Eau et sels');
      await writeFile(resolve(output, `nolo-eau-texte-${width}.txt`), await page.evaluate(() => document.body.innerText));
      await writeFile(resolve(output, `nolo-eau-erreurs-${width}.json`), JSON.stringify(errors, null, 2));
      await page.screenshot({ path: resolve(output, `nolo-eau-diagnostic-${width}.png`) });
      await page.waitForFunction(() => {
        const value = id => Number(document.getElementById(id)?.value.replace(',', '.'));
        return value('wz-mash-water') === 15.5 && value('wz-sparge-water') === 17.4 &&
          document.body.innerText.includes('dose d’acide non calculée');
      });
      const waterText = await page.evaluate(() => document.body.innerText);
      assert(!waterText.includes('3,2 mL') && !waterText.includes('3,1 mL'), 'Aucune dose d’acide automatique hors modèle dans l’étape Eau');
      waterDraft = await capture(page, `nolo-eau-brouillon-${width}`, 'main');
      if (width === 390) await button(page, '2. Sels');
      await page.waitForSelector('[data-water-acids]', { visible: true });
      saltsDraft = await capture(page, `nolo-sels-brouillon-${width}`, '[data-water-acids]', 'center');
    }
    await step(page, 'Récapitulatif');
    await page.waitForFunction(() => { const overview = document.querySelector('[aria-label="Aperçu NOLO"]'); return overview && !overview.textContent.includes('Simulation à recalculer'); });
    const applied = await capture(page, `nolo-brouillon-${width}`, '[aria-label="Aperçu NOLO"]');
    const waterReview = await page.evaluate(() => {
      const summary = [...document.querySelectorAll('summary')].find(element => element.textContent.includes('9,2 L/kg'));
      if (!summary) throw Error('Résumé Eau de la recette absent');
      summary.click();
      return summary.parentElement.innerText;
    });
    assert.match(waterReview, /Alcalinité\s+125\b/, 'L’alcalinité ne reprend pas une dose d’acide non retenue');
    assert(!waterReview.includes('Acide lactique 80 %'), 'Aucune dose d’acide inventée dans le récapitulatif');
    await writeFile(resolve(output, `nolo-recap-eau-${width}.txt`), waterReview);
    const waterReviewCapture = await capture(page, `nolo-recap-eau-${width}`, '[aria-label="Doses à préparer, tableau défilant horizontalement"]');
    await button(page, 'Enregistrer la recette');
    await page.waitForSelector(`[aria-label=${JSON.stringify(`Ouvrir la recette ${name}`)}]`, { visible: true });
    const saved = await page.evaluate(id => {
      const recipe = window.__hopQa.storage.getRecipes().find(row => row.id === id);
      const result = window.__hopQa.nolo.raw(recipe);
      return { recipe, simulationActive: result?.simulationActive, projectionMax: result?.projection.max };
    }, id);
    assert.equal(saved.recipe.yeast.hopIndexId, 'lalbrew-lona');
    assert.deepEqual([saved.recipe.waterPlan.mashWaterL, saved.recipe.waterPlan.spargeWaterL], [15.5, 17.4]);
    assert.equal(saved.recipe.installation.manualWaterSplit, false);
    assert.equal(saved.recipe.waterPlan.acid, undefined);
    assert.equal(saved.simulationActive, true);
    assert(Math.abs(saved.projectionMax - proposed.max) < 1e-8);
    assert.deepEqual(await page.evaluate(batchId => window.__hopQa.storage.getBatches().find(row => row.id === batchId).recipeSnapshot, batchId), original.snapshot);
    await openEdit(page, name);
    await step(page, 'Récapitulatif');
    await page.waitForFunction(() => { const overview = document.querySelector('[aria-label="Aperçu NOLO"]'); return overview && !overview.textContent.includes('Simulation à recalculer'); });
    const reopened = await capture(page, `nolo-reouverture-${width}`, '[aria-label="Aperçu NOLO"]');
    await step(page, 'Paliers');
    const initialTemperature = saved.recipe.mash.steps[0].tempC;
    await page.locator('#wz-mash-temp-0').fill(String(initialTemperature + 1));
    await step(page, 'Récapitulatif');
    await page.waitForFunction(() => document.querySelector('[aria-label="Aperçu NOLO"]')?.textContent.includes('Simulation à recalculer'));
    const corrected = await capture(page, `nolo-correction-${width}`, '[aria-label="Aperçu NOLO"]');
    await step(page, 'Paliers');
    await page.locator('#wz-mash-temp-0').fill(String(initialTemperature));
    await step(page, 'Récapitulatif');
    await page.waitForFunction(() => { const overview = document.querySelector('[aria-label="Aperçu NOLO"]'); return overview && !overview.textContent.includes('Simulation à recalculer'); });
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(row => row.id === id), id), saved.recipe, 'Correction puis retour limités au brouillon');
    assert.deepEqual(errors, [], `Erreurs navigateur : ${errors.join(' | ')}`);
    assert.deepEqual(external, [], `Requêtes externes : ${external.join(' | ')}`);
    reports.push({ width, before, proposal, proposed, waterDraft, saltsDraft, applied, waterReviewCapture, reopened, corrected, correctionRestored: true,
      saved: { water: saved.recipe.waterPlan, mashRatio: saved.recipe.mash.ratioLPerKg, preBoilL: saved.recipe.preBoilL, preBoilHotL: saved.recipe.preBoilHotL,
        brewhouse: saved.recipe.brewhouse, simulationActive: saved.simulationActive, projectionMax: saved.projectionMax },
      snapshotPreserved: true, errors, externalRequests: external.length });
    await context.close();
  }
  const file = resolve(output, 'report.json');
  await writeFile(file, JSON.stringify({ reports }, null, 2));
  console.log(file);
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
