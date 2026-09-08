// Local, synthetic recipes only. Every request outside the local Vite server is blocked.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const base = process.env.HOP_WORKSHOP_QA_URL || 'http://127.0.0.1:3009';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base), 'Local Vite server required.');
const out = resolve('.codex-remote-attachments/hop-index/workshop');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [];
const click = async (page, text, contains = false) => {
  const handle = await page.waitForFunction((text, contains) => [...document.querySelectorAll('button')].find(b =>
    b.getClientRects().length && !b.disabled && (contains ? b.textContent.includes(text) : b.textContent.trim() === text)), {}, text, contains);
  await handle.asElement().evaluate(b => b.scrollIntoView({ block: 'center' }));
  await handle.asElement().click(); await handle.dispose();
};
const select = async (page, label, value) => {
  const id = await page.evaluate(label => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === label)?.htmlFor, label);
  assert(id, `Missing label: ${label}`); await page.select(`select[id="${id}"]`, value);
};
const waitSaved = async (page, name) => page.waitForFunction(async name =>
  (await import('/src/services/storage.ts')).StorageService.getRecipes().some(r => r.name === name), {}, name);
const overflow = async page => {
  const result = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth,
    guide: [...document.querySelectorAll('[aria-label="Atelier aromatique"]')].filter(e => e.getClientRects().length).map(e => ({ scroll: e.scrollWidth, client: e.clientWidth })) }));
  assert(result.content <= result.width, JSON.stringify(result));
  for (const box of result.guide) assert(box.scroll <= box.client + 1, JSON.stringify(result));
};
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
    const name = `Atelier documenté — ${width}`;
    await page.locator('#wz-title').fill(name);
    await click(page, 'Construire le goût de ma bière', true);
    await page.waitForSelector('[aria-label="Atelier aromatique"]');
    await page.$eval('[aria-label="Atelier aromatique"]', e => e.scrollIntoView({ block: 'start' }));
    await overflow(page); await page.screenshot({ path: resolve(out, `programmes-${width}.png`) });
    const before = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopVarieties().length);
    await click(page, 'Préparer ce programme pour', true);
    assert(await page.$('[aria-label="Aperçu du programme"]'));
    assert.equal(await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopVarieties().length), before);
    await click(page, 'Remplacer le houblonnage et la levure');
    await page.waitForFunction(() => document.body.innerText.includes('Programme repris.'));
    await click(page, 'Agrumes');
    await page.waitForFunction(() => !document.body.innerText.includes('Enregistrement des références…'));
    await click(page, 'Forte');
    await page.waitForFunction(() => !document.body.innerText.includes('Enregistrement des références…'));
    await select(page, 'Levure à simuler', 'fermentis-us05');
    await click(page, 'Appliquer ce scénario à la recette');
    await page.waitForFunction(() => document.querySelector('[aria-label="Écarts au programme documenté"]')?.textContent.includes('SafAle US-05'));
    const comparisonSummary = await page.waitForFunction(() => [...document.querySelectorAll('summary')].find(e => e.textContent.startsWith('Comparer au protocole choisi')));
    await comparisonSummary.asElement().evaluate(e => e.scrollIntoView({ block: 'center' })); await comparisonSummary.asElement().click(); await comparisonSummary.dispose();
    await overflow(page);
    await page.$eval('[aria-label="Écarts au programme documenté"]', e => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: resolve(out, `adaptation-${width}.png`) });
    await click(page, 'Chimie'); await click(page, 'Phénols et polyphénols');
    assert(await page.evaluate(() => document.body.innerText.includes('PAD1/FDC1')));
    await page.$eval('[aria-label="Chimie et biotransformation"]', e => e.scrollIntoView({ block: 'start' }));
    await overflow(page); await page.screenshot({ path: resolve(out, `chimie-${width}.png`) });
    await click(page, 'Récapitulatif'); await click(page, 'Enregistrer la recette'); await waitSaved(page, name);
    const saved = await page.evaluate(async name => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.name === name), name);
    assert.equal(saved.hopTrialId, 'trial-split-verdant-2026'); assert.equal(saved.yeast.hopIndexId, 'fermentis-us05');
    assert.deepEqual(saved.hops.map(h => h.weightG), [saved.volumeL * 2, saved.volumeL * 2, saved.volumeL * 4]);
    assert(saved.hops.every(h => h.alpha === 0 && h.timeMin == null && h.tempC == null));
    assert.deepEqual(saved.hopAromaTarget.citrus, { min: 66, max: 100 });
    await click(page, name, true);
    const panel = await page.waitForSelector('[aria-label="Potentiel aromatique de la recette"]');
    assert.equal(await panel.$$eval('input,textarea', els => els.length), 0);
    assert((await panel.evaluate(e => e.innerText)).includes('lecture seule'));
    await panel.evaluate(e => e.scrollIntoView({ block: 'start' }));
    await overflow(page); await page.screenshot({ path: resolve(out, `bilan-${width}.png`) });
    const afterRead = await page.evaluate(async id => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.id === id), saved.id);
    assert.deepEqual(afterRead, saved);
    await click(page, 'Modifier dans l’atelier de recette'); await click(page, 'Houblons');
    await click(page, 'Houblonnage à cru');
    const picker = '[role="combobox"][aria-label^="Ajouter un houblon en"]';
    await page.locator(picker).fill('Cascade');
    const option = await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')].find(e => e.textContent.includes('Cascade') && e.textContent.includes('Hopsteiner')));
    await option.asElement().click();
    await page.waitForFunction(() => document.body.innerText.includes('Phase de Cascade'));
    const phase = await page.evaluate(() => [...document.querySelectorAll('label')].find(l => l.textContent.startsWith('Phase de Cascade'))?.querySelector('select')?.outerHTML);
    assert(phase);
    await page.locator('label select').filter(e => e.parentElement.textContent.startsWith('Phase de Cascade')).fill('postFermentation');
    await overflow(page); await page.screenshot({ path: resolve(out, `cascade-${width}.png`) });
    await click(page, 'Récapitulatif'); await click(page, 'Enregistrer la recette');
    const edited = await page.evaluate(async id => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.id === id), saved.id);
    assert.equal(edited.hops.length, 4); assert.equal(edited.hops[3].hopVarietyId, 'hopsteiner-cas');
    assert.equal(edited.hops[3].aromaTiming, 'postFermentation'); assert.equal(edited.hops[3].weightG, 0);
    assert.equal(edited.hopTrialId, saved.hopTrialId);
    assert.deepEqual(errors, []);
    reports.push({ width, persistedTrial: edited.hopTrialId, sourceMasses: saved.hops.map(h => h.weightG), adaptedYeast: edited.yeast.name, catalogueCascade: edited.hops[3], readOnlyUnchanged: true, errors });
    console.log(`Atelier, adaptation, chimie et bilan vérifiés à ${width}px.`);
    await context.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(reports, null, 2));
} catch (error) {
  const pages = await browser.pages(), page = pages.at(-1);
  if (page) { await page.screenshot({ path: resolve(out, 'failure.png') }); await writeFile(resolve(out, 'failure.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally { await browser.close(); }
