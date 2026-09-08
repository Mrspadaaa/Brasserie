// Synthetic local recipes only. All non-local requests, including AI, are blocked.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = process.env.HOP_WORKSHOP_QA_URL || 'http://127.0.0.1:3009';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base));
const out = resolve('.codex-remote-attachments/hop-index/extrapolation');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [];
const click = async (page, label, contains = false) => {
  const handle = await page.waitForFunction((label, contains) => [...document.querySelectorAll('button')].find(b => b.getClientRects().length && !b.disabled && (contains ? b.textContent.includes(label) : b.textContent.trim() === label)), {}, label, contains);
  await handle.asElement().evaluate(b => b.scrollIntoView({ block: 'center' })); await handle.asElement().click(); await handle.dispose();
};
const choose = async (page, label, value) => {
  const id = await page.evaluate(label => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === label)?.htmlFor, label);
  assert(id, label); await page.select(`select[id="${id}"]`, value);
};
const checkOverflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
try {
  for (const width of [390, 320, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [];
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', e => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', req => req.url().startsWith(`${base}/`) || /^(data|blob):/.test(req.url()) ? req.continue() : req.abort());
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(`${base}/?dev-local`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(async () => (await import('/src/services/storage.ts')).StorageService.isReady());
    await page.waitForFunction(() => !document.body.innerText.includes('Base initialisée avec'));
    await click(page, '📜 Recettes', true); await click(page, 'Importer / Créer', true);
    const name = `Extrapolation témoin ${width}`;
    await page.locator('#wz-title').fill(name);
    await click(page, 'Construire le goût de ma bière', true); await click(page, 'Mon adaptation');
    await page.waitForSelector('[aria-label="Simulateur aromatique expérimental"]');
    await page.waitForFunction(() => document.querySelector('[aria-label="Graphe de la prédiction expérimentale"]')?.textContent.includes('Agrumes'));
    const before = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length);
    const initial = await page.$eval('[aria-label="Graphe de la prédiction expérimentale"]', e => e.textContent);
    await click(page, 'Garder ce graphe pour comparer');
    await choose(page, 'Levure à simuler', 'lalbrew-verdant-ipa');
    await page.waitForFunction(initial => document.querySelector('[aria-label="Graphe de la prédiction expérimentale"]')?.textContent !== initial, {}, initial);
    assert.equal(await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length), before, 'Simulation must not write');
    await page.locator('[aria-label="Dose (g/L)"]').fill('3');
    await click(page, 'Agrumes'); await click(page, 'Forte');
    await click(page, 'Chercher des houblons pour cet objectif');
    await page.waitForFunction(() => document.body.textContent.includes('Même levure, timing et dose.'));
    await checkOverflow(page);
    await page.$eval('[aria-label="Simulateur aromatique expérimental"]', e => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(out, `simulateur-${width}.png`) });
    await page.$eval('[aria-label="Graphe de la prédiction expérimentale"]', e => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: resolve(out, `graphe-${width}.png`) });
    await click(page, 'Appliquer ce scénario à la recette');
    await page.waitForFunction(() => document.body.innerText.includes('Scénario appliqué.'));
    await click(page, 'Conserver pour une dégustation');
    await page.waitForFunction(() => document.body.innerText.includes('Prédiction conservée avec ses sources'));
    const snapshot = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopPredictions().at(-1));
    assert.equal(snapshot.engineVersion, 'hop-experimental-v3'); assert(snapshot.prediction.profile.citrus.range);
    await click(page, 'Récapitulatif'); await click(page, 'Enregistrer la recette');
    await page.waitForFunction(async name => (await import('/src/services/storage.ts')).StorageService.getRecipes().some(r => r.name === name), {}, name);
    const saved = await page.evaluate(async name => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.name === name), name);
    assert.equal(saved.hops[0].hopVarietyId, 'hopsteiner-cas'); assert.equal(saved.hops[0].weightG, saved.volumeL * 3);
    assert.equal(saved.yeast.hopIndexId, 'lalbrew-verdant-ipa'); assert.equal(saved.hops[0].aromaTiming, 'postFermentation');
    await click(page, name, true);
    const report = await page.waitForSelector('[aria-label="Potentiel aromatique de la recette"]');
    assert.equal(await report.$$eval('input,textarea', els => els.length), 0);
    await report.evaluate(e => e.scrollIntoView({ block: 'start' })); await checkOverflow(page);
    await page.screenshot({ path: resolve(out, `bilan-${width}.png`) });
    await click(page, 'Explorer une variante sans modifier la recette');
    await choose(page, 'Levure à simuler', 'fermentis-us05');
    const after = await page.evaluate(async id => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.id === id), saved.id);
    assert.deepEqual(after, saved); assert.deepEqual(errors, []);
    reports.push({ width, recipe: saved.name, snapshotVersion: snapshot.engineVersion, interval: snapshot.prediction.profile.citrus.range, readOnlyUnchanged: true, errors });
    console.log(`Simulation, comparaison, application, instantané et lecture seule vérifiés à ${width}px.`);
    await context.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(reports, null, 2));
} catch (error) {
  const page = (await browser.pages()).at(-1);
  if (page) { await page.screenshot({ path: resolve(out, 'failure.png'), fullPage: true }); await writeFile(resolve(out, 'failure.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally { await browser.close(); }
