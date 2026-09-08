// Local, synthetic recipes only. Every request outside the local Vite server is blocked.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const base = process.env.HOP_GUIDE_QA_URL || 'http://127.0.0.1:3009';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base), 'Local Vite server required.');
const out = resolve('.codex-remote-attachments/hop-index/recipe-guide');
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
    guide: [...document.querySelectorAll('[aria-label="Guide aromatique de la recette"]')].filter(e => e.getClientRects().length).map(e => ({ scroll: e.scrollWidth, client: e.clientWidth })) }));
  assert(result.content <= result.width, JSON.stringify(result));
  for (const box of result.guide) assert(box.scroll <= box.client + 1, JSON.stringify(result));
};
try {
  for (const width of [390, 320, 1280]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage(), errors = [], blocked = [];
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (req.url().startsWith(`${base}/`) || /^(data|blob):/.test(req.url())) return req.continue();
      blocked.push(req.url().split('?')[0]); return req.abort();
    });
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(`${base}/?dev-local`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(async () => (await import('/src/services/storage.ts')).StorageService.isReady());
    await page.waitForFunction(() => !document.body.innerText.includes('Base initialisée avec'));
    await click(page, '📜 Recettes', true);
    await click(page, 'Importer / Créer', true);
    const name = `Profil créé — contrôle ${width}`;
    await page.locator('#wz-title').fill(name);
    await click(page, 'Houblons');
    await click(page, 'Agrumes');
    await page.waitForFunction(() => document.querySelector('button[aria-pressed="true"]')?.textContent.includes('Agrumes'));
    await click(page, 'Forte');
    await click(page, 'Choisir la levure');
    await click(page, 'Houblons');
    assert(await page.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Forte' && b.getAttribute('aria-pressed') === 'true')));
    await overflow(page);
    await page.screenshot({ path: resolve(out, `creation-${width}.png`) });
    await click(page, 'Récapitulatif');
    await click(page, 'Enregistrer la recette');
    await waitSaved(page, name);
    const saved = await page.evaluate(async name => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.name === name), name);
    assert.deepEqual(saved.hopAromaTarget.citrus, { min: 66, max: 100 });
    const fixtureName = 'Cascade × Idaho 7 — contrôle local';
    await page.evaluate(async ({ saved, fixtureName }) => {
      const s = (await import('/src/services/storage.ts')).StorageService;
      s.updateRecipe({ ...saved, name: fixtureName, volumeL: 24, boilMin: 95,
        hops: [{ name: 'Cascade', weightG: 14, alpha: 6.5, stage: 'boil', timeMin: 95 },
          { name: 'Houblon Idaho 7 12.7%', weightG: 20, alpha: 0, stage: 'dryHop', dayOffset: 3 }],
        yeast: { name: 'Fermentis Levure Safale US-05', form: 'sèche', qty: 1, unit: 'sachet', pitchTempC: 22.5, fermTempMinC: 12, fermTempMaxC: 22 } });
    }, { saved, fixtureName });
    await click(page, fixtureName, true);
    const predictionPanel = await page.waitForSelector('[aria-label="Potentiel aromatique de la recette"]');
    await predictionPanel.evaluate(e => e.querySelector('details').open = true);
    assert((await predictionPanel.evaluate(e => e.innerText)).includes('Cascade × Fermentis Levure Safale US-05'));
    assert((await predictionPanel.evaluate(e => e.innerText)).includes('0,58 g/L'));
    assert((await predictionPanel.evaluate(e => e.innerText)).includes('1 h 35 min'));
    await click(page, 'Choisir le profil et les références');
    await click(page, 'Relier SafAle US-05 (Fermentis)');
    await page.waitForFunction(() => document.body.innerText.includes('Référence associée : SafAle US-05 (Fermentis)'));
    await select(page, 'Référence documentaire de l’ajout 1', 'hopsteiner-cas');
    await page.waitForFunction(() => !document.body.innerText.includes('Enregistrement des références…'));
    await select(page, 'Référence documentaire de l’ajout 2', 'ych-idaho7');
    await page.waitForFunction(() => !document.body.innerText.includes('Enregistrement des références…'));
    assert(await page.evaluate(() => document.body.innerText.includes('J+3 indique un jour')));
    await select(page, 'Phase du houblonnage à cru 2', 'fermentation');
    await click(page, 'Enregistrer le profil et les références');
    const associated = await page.evaluate(async id => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.id === id), saved.id);
    assert.equal(associated.yeast.hopIndexId, 'fermentis-us05');
    assert.equal(associated.hops[1].hopVarietyId, 'ych-idaho7');
    assert.equal(associated.hops[1].alpha, 0); assert.equal(associated.hops[1].weightG, 20);
    assert.equal(associated.hops[1].dayOffset, 3); assert.equal(associated.hops[1].aromaTiming, 'fermentation');
    await page.locator('[aria-label="Modifier la recette"]').click();
    await click(page, 'Houblons');
    await click(page, 'Trouver des houblons pour ce profil');
    await select(page, 'Moment envisagé pour une nouvelle piste', 'postFermentation');
    await page.waitForSelector('[aria-label="Guide aromatique de la recette"] article');
    const addName = await page.$eval('[aria-label="Guide aromatique de la recette"] article button', b => b.textContent);
    await click(page, addName);
    await page.waitForFunction(() => document.body.innerText.includes('renseigne sa quantité'));
    await overflow(page);
    await page.$eval('[aria-label="Guide aromatique de la recette"] article', e => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: resolve(out, `pistes-${width}.png`) });
    await click(page, 'Récapitulatif'); await click(page, 'Enregistrer la recette');
    const final = await page.evaluate(async id => (await import('/src/services/storage.ts')).StorageService.getRecipes().find(r => r.id === id), saved.id);
    assert.equal(final.hops.length, 3); assert.equal(final.hops[2].weightG, 0); assert.equal(final.hops[2].alpha, 0);
    assert.equal(final.hops[2].stage, 'dryHop'); assert.equal(final.hops[2].aromaTiming, 'postFermentation');
    assert.deepEqual(final.hopAromaTarget.citrus, { min: 66, max: 100 });
    assert.deepEqual(errors, []);
    reports.push({ width, createdTarget: saved.hopAromaTarget, associatedYeast: final.yeast.hopIndexId,
      preservedDoseG: final.hops[1].weightG, preservedDay: final.hops[1].dayOffset, addedDoseG: final.hops[2].weightG,
      errors, blockedNetworkRequests: [...new Set(blocked)] });
    console.log(`Recipe guide verified at ${width}px.`);
    await context.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports, null, 2));
} catch (error) {
  const page = (await browser.pages()).at(-1);
  if (page) { await page.screenshot({ path: resolve(out, 'failure.png') }); await writeFile(resolve(out, 'failure.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally { await browser.close(); }
