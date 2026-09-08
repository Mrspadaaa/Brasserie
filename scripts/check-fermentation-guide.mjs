// End-to-end checks against synthetic local recipes only; all external requests blocked.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = process.env.FERMENTATION_QA_URL || 'http://127.0.0.1:3013';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base));
const out = resolve('.codex-remote-attachments/yeast-guide/qa');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [];
const click = async (page, label, contains = false) => {
  const handle = await page.waitForFunction((label, contains) => [...document.querySelectorAll('button')].find(b => b.getClientRects().length && !b.disabled && (contains ? b.textContent.includes(label) : b.textContent.trim() === label)), {}, label, contains);
  await handle.asElement().evaluate(b => b.scrollIntoView({ block: 'center' })); await handle.asElement().click(); await handle.dispose();
};
const field = async (page, label) => {
  const id = await page.evaluate(label => [...document.querySelectorAll('label')].find(l => l.textContent.trim() === label)?.htmlFor, label);
  assert(id, `Accessible label: ${label}`); return `[id="${id}"]`;
};
const overflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
try {
  for (const width of [390, 320, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [];
    page.setDefaultTimeout(60000);
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', e => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', r => r.url().startsWith(base + '/') || /^(data|blob):/.test(r.url()) ? r.continue() : r.abort());
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(base + '/?dev-local', { waitUntil: 'networkidle0' });
    await page.waitForFunction(async () => (await import('/src/services/storage.ts')).StorageService.isReady());
    await page.waitForFunction(() => !document.body.innerText.includes('Base initialisée avec'));
    await click(page, '📜 Recettes', true); await click(page, 'Importer / Créer', true);
    const name = `Weissbier témoin ${width}`; await page.locator('#wz-title').fill(name);
    const count = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length);
    await click(page, 'Choisir les arômes de levure', true);
    await page.waitForSelector('[aria-label="Atelier des arômes de levure"]');
    assert.equal(await page.$$eval('[aria-label="Souches documentées pour cet objectif"] button', b => b.length), 4);
    await click(page, 'White Labs WLP300', true);
    await page.select(await field(page, 'Objectif de fermentation'), 'balanced');
    await page.select(await field(page, 'Objectif de fermentation'), 'banana');
    await page.select(await field(page, 'Forme recherchée'), 'sèche');
    assert.equal(await page.$$eval('[aria-label="Souches documentées pour cet objectif"] button', b => b.length), 2);
    await click(page, 'LalBrew Munich Classic', true);
    await overflow(page);
    await page.$eval('[aria-label="Atelier des arômes de levure"]', el => el.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(out, `choix-${width}.png`) });
    await page.locator(await field(page, 'Température du palier 1 (°C)')).fill('19');
    await page.locator(await field(page, 'Quantité prévue de levure sèche (g)')).fill('12');
    await page.locator(await field(page, 'Durée du palier 1 (jours)')).fill('6');
    await page.locator(await field(page, 'Durée du palier 2 (jours)')).click();
    await page.$eval('[aria-label="Programme de levure proposé"]', el => el.scrollIntoView({ block: 'start' }));
    await overflow(page); await page.screenshot({ path: resolve(out, `paliers-${width}.png`) });
    assert.equal(await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length), count, 'Preview must not write');
    await click(page, 'Appliquer cette levure et ces paliers');
    await page.waitForFunction(() => document.body.innerText.includes('Levure et paliers appliqués.'));
    await click(page, 'Récapitulatif'); await click(page, 'Enregistrer la recette');
    await page.waitForFunction(async name => (await import('/src/services/storage.ts')).StorageService.getRecipes().some(r => r.name === name), {}, name);
    const saved = await page.evaluate(async name => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.name === name), name);
    assert.equal(saved.yeast.hopIndexId, 'lallemand-munich-classic'); assert.equal(saved.yeast.qty, 12); assert.equal(saved.yeast.unit, 'g');
    assert.equal(saved.fermentation[0].tempC, 19); assert.equal(saved.fermentation[0].days, 6);
    assert.equal(saved.yeastGuide.guide.kind, 'fermentation'); assert.equal(saved.yeastGuide.programApplied, true);
    const stableCount = await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length);
    await click(page, name, true);
    const panel = await page.waitForSelector('[aria-label="Conduite de levure de la recette"]');
    assert.equal(await panel.$$eval('input,select,textarea', el => el.length), 0, 'Read-only recipe');
    assert(!(await panel.evaluate(el => el.innerText)).includes('La recette diffère'), 'Freshly saved plan remains consistent');
    await panel.evaluate(el => el.scrollIntoView({ block: 'start' })); await overflow(page);
    await page.screenshot({ path: resolve(out, `lecture-${width}.png`) });
    assert.equal(await page.evaluate(async () => (await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length), stableCount);
    assert.deepEqual(errors, []);
    reports.push({ width, recipe: saved.name, yeast: saved.yeast.name, phases: saved.fermentation, readOnly: true, noPreviewWrites: true, errors });
    console.log(`Fermentation vérifiée à ${width}px : choix, paliers personnalisés, sauvegarde, lecture seule.`);
    await context.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(reports, null, 2));
} catch (error) {
  const page = (await browser.pages()).at(-1);
  if (page) { await page.screenshot({ path: resolve(out, 'failure.png'), fullPage: true }); await writeFile(resolve(out, 'failure.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally { await browser.close(); }
