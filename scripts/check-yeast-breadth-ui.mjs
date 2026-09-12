// Browser plugin unavailable: real installed Chrome + existing Puppeteer, isolated app adapters.
import assert from 'node:assert/strict';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
const dir = resolve(tmpdir(), 'laffinee-hop-qa-yeast-breadth');
const out = resolve(tmpdir(), 'laffinee-yeast-breadth-evidence');
if (!process.argv.includes('--reuse-build')) await buildHopRecipeQa(dir);
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(dir, path === '/' ? 'tests/qa/hop-recipe/index.html' : '.' + path);
    if (!file.startsWith(dir + sep)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [], errors = [];
const byLabel = label => `[aria-label=${JSON.stringify(label)}]`;
async function clickText(page, text, tag = 'button', contains = false) {
  const handle = await page.waitForFunction((text, tag, contains) => [...document.querySelectorAll(tag)].find(e => e.getClientRects().length && (contains ? e.textContent.trim().includes(text) : e.textContent.trim() === text)), {}, text, tag, contains);
  await handle.asElement().asLocator().click();
}
async function openEdit(page, name) {
  const selector = byLabel(`Modifier la recette ${name}`);
  await page.waitForSelector(selector);
  const field = await page.$(selector);
  const summary = await field.evaluateHandle(e => { const detail = e.closest('details'); return detail && !detail.open ? detail.querySelector('summary') : null; });
  if (summary.asElement()) await summary.asElement().asLocator().click();
  await page.locator(selector).click(); await page.waitForSelector('#wz-title');
}
async function step(page, label) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(e => e.getClientRects().length && e.getAttribute('aria-label') === label), {}, label);
  await handle.asElement().asLocator().click();
}
async function capture(page, name, selector) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  if (selector) await page.$eval(selector, e => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: resolve(out, name + '.png') });
  const state = await page.evaluate(() => ({ width: innerWidth, text: document.body.innerText,
    overflow: document.documentElement.scrollWidth > innerWidth,
    bars: [...document.querySelectorAll('.recipe-wizard header,.recipe-wizard footer')].filter(e => e.getClientRects().length).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height })),
    escaping: [...document.querySelectorAll('.yeast-workbench *')].filter(e => {
      const head = e.closest('thead');
      return e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.sr-only') && (!head || getComputedStyle(head).clip === 'auto');
    }).filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 70) })).slice(0, 8),
  }));
  assert(!state.overflow, `Overflow ${name}`); assert.deepEqual(state.escaping, [], `${name}: ${JSON.stringify(state.escaping)}`); assert(!/NaN|Infinity/.test(state.text));
  reports.push({ name, ...state });
}
const info = '.yeast-strain-details';
async function openInfo(page) {
  if (!await page.$eval(info, e => e.open)) await page.locator(info + ' > summary').click();
  await page.waitForSelector(info + '[open]');
}
async function usesDetails(page, open) {
  const handle = await page.waitForFunction(() => [...document.querySelectorAll('summary')].find(e => e.textContent.includes('Usages et caractère')));
  if (await handle.asElement().evaluate(e => e.parentElement.open) !== open) await handle.asElement().asLocator().click();
  assert.equal(await handle.asElement().evaluate(e => e.parentElement.open), open);
}
async function reload(page) { await page.reload(); await page.waitForFunction(() => window.__hopQa?.ready()); }
const scenario = byLabel('Scénario de levure');
async function selectLabel(page, label, value) {
  const id = await page.evaluate(label => [...document.querySelectorAll('label')].find(e => e.textContent.trim() === label)?.htmlFor, label);
  assert(id, `Label missing: ${label}`); await page.select(`[id=${JSON.stringify(id)}]`, value);
}
async function search(page, value) { await page.locator(byLabel('Rechercher une levure')).fill(value); }
async function choose(page, name, exact = false) {
  const handle = await page.waitForFunction((name, exact) => [...document.querySelectorAll('.yeast-candidates input')].find(e => exact ? e.getAttribute('aria-label') === `Comparer ${name}` : e.getAttribute('aria-label').includes(name)), {}, name, exact);
  await handle.asElement().asLocator().click();
  await page.waitForFunction(name => document.querySelector('[aria-label="Scénario de levure"] h3')?.textContent.includes(name), {}, name);
}
try {
  for (const width of process.argv.includes('--375-only') ? [375] : [375, 320, 430, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    await context.overridePermissions(base, ['clipboard-read', 'clipboard-sanitized-write']);
    page.on('pageerror', error => errors.push({ width, message: error.message }));
    await page.setViewport({ width, height: width < 600 ? 812 : 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.setRequestInterception(true);
    page.on('request', request => request.url().startsWith(base) || /^(data|blob):/.test(request.url()) ? request.continue() : request.abort());
    await page.evaluateOnNewDocument(() => { if (!localStorage.getItem('laffinee_ui_state')) localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })); });
    await page.goto(base); await page.waitForFunction(() => window.__hopQa?.ready());
    const name = 'Kölsch · essai Dieter', id = 'QA-YEAST-BREADTH';
    await page.evaluate(({ name, id }) => {
      const r = window.__hopQa.recipe();
      Object.assign(r, { id, name, style: 'Kölsch', styleRef: undefined, batchRef: undefined, nolo: undefined, yeastGuide: undefined, yeastDesign: undefined, volumeL: 20, ogTarget: 1.05,
        yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 18 },
        fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 18, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }],
        mash: { ...r.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
        hops: [{ name: 'Citra', stage: 'dryHop', alpha: 12, weightG: 40, dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 18 }],
      }); window.__hopQa.seedRecipe(r);
    }, { name, id });
    await openEdit(page, name); await step(page, 'Levure');
    const writes = await page.evaluate(() => window.__hopQa.metrics.writes);
    await capture(page, `closed-${width}`, '[aria-label="Choix et simulation de levure"]');
    const compare = await page.waitForFunction(() => [...document.querySelectorAll('summary')].find(e => e.textContent.includes('Comparer les souches du style')));
    await compare.asElement().focus(); await page.keyboard.press('Enter');
    await page.waitForSelector('.yeast-picker-search', { visible: true });
    await capture(page, `style-picker-${width}`, '.yeast-picker');
    const scope = byLabel('Étendue de la recherche de levure');
    await page.focus(scope + ' [aria-checked="true"]'); await page.keyboard.press('ArrowRight');
    assert.match(await page.$eval(scope + ' [aria-checked="true"]', e => e.textContent), /Tout le catalogue/);
    await clickText(page, 'Suivantes');
    assert.match(await page.$eval('.yeast-picker-pages', e => e.textContent), /7–12/);
    await search(page, 'zzzz-sans-reference');
    assert.match(await page.$eval('.yeast-picker', e => e.textContent), /Aucune référence/);
    assert.match(await page.$eval(scenario, e => e.textContent), /US-05/);
    await capture(page, `empty-preserved-${width}`, '.yeast-picker');
    await clickText(page, 'Effacer les filtres'); await search(page, 'US-05');
    assert.match(await page.$eval('.yeast-candidates input', e => e.getAttribute('aria-label')), /US-05/);
    await page.select(byLabel('Filtrer les levures par style'), 'weissbier');
    await search(page, 'Hefeweizen I'); await choose(page, 'Hefeweizen I', true);
    await clickText(page, 'Banane');
    await usesDetails(page, true);
    assert.match(await page.$eval(scenario, e => e.textContent), /banana/i);
    await capture(page, `omega-wheat-${width}`, scenario);
    await page.select(byLabel('Filtrer les levures par style'), 'lager');
    await search(page, 'NovaLager'); await choose(page, 'NovaLager');
    await openInfo(page); assert.match(await page.$eval(info, e => e.textContent), /trois jours|3 jours/);
    await capture(page, `novalager-preparation-${width}`, info);
    await page.select(byLabel('Filtrer les levures par style'), 'hazy-ipa');
    await selectLabel(page, 'Laboratoire à comparer', 'Escarpment Labs');
    await selectLabel(page, 'Forme à comparer', 'liquide'); await search(page, 'Hydra');
    await capture(page, `hazy-filter-${width}`, '.yeast-picker');
    await choose(page, 'Hydra');
    assert.match(await page.$eval(scenario, e => e.textContent), /65–72/);
    await page.select(byLabel('Filtrer les levures par style'), 'kolsch-alt');
    await search(page, 'Dieter'); await selectLabel(page, 'Laboratoire à comparer', 'Imperial Yeast');
    await selectLabel(page, 'Forme à comparer', 'unknown'); await choose(page, 'Dieter');
    await capture(page, `form-to-confirm-${width}`, scenario);
    assert.equal(await page.$$eval(scenario + ' button', rows => rows.find(e => e.textContent === 'Appliquer le scénario').disabled), true);
    assert.match(await page.$eval(scenario, e => e.textContent), /Confirme la forme/);
    await selectLabel(page, 'Forme du produit utilisé', 'liquide');
    await usesDetails(page, true);
    assert.match(await page.$eval(scenario, e => e.innerText), /Altbier, Gose, Kölsch/);
    await capture(page, `documented-use-${width}`, scenario);
    await usesDetails(page, false);
    if (width === 375) {
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await capture(page, 'text-200-percent-375', scenario);
      await page.addStyleTag({ content: 'html { font-size: 100% !important; }' });
    }
    assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), writes);
    const knowledgeBefore = await page.evaluate(() => window.__hopQa.storage.getHopKnowledge().map(r => r.id));
    await clickText(page, 'Appliquer le scénario');
    await clickText(page, 'Saisie libre et stock', 'summary', true);
    await page.locator(byLabel('Quantité de levure, en mL')).fill('100');
    await page.keyboard.press('Tab');
    // Refresh the snapshot with the actual package quantity entered by the brewer.
    await clickText(page, 'Réinitialiser'); await clickText(page, 'Appliquer le scénario');
    await capture(page, `applied-${width}`, scenario);
    await step(page, 'Récapitulatif'); await page.bringToFront();
    await clickText(page, 'Copier la recette en texte');
    await page.waitForFunction(() => document.body.innerText.includes('Recette copiée'));
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /Dieter/); assert.match(copied, /kolsch-alt/);
    await clickText(page, 'Enregistrer la recette');
    await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(r => r.id === id)?.yeastDesign?.styleId === 'kolsch-alt', {}, id);
    const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(r => r.id === id), id);
    assert.equal(saved.yeast.hopIndexId, 'yeast-imperial-947efa83-687a-4ee2-96ec-b66ffbd54339');
    assert.equal(saved.yeast.qty, 100); assert.equal(saved.yeast.form, 'liquide');
    const added = await page.evaluate(ids => window.__hopQa.storage.getHopKnowledge().filter(r => !ids.includes(r.id)).map(r => r.id), knowledgeBefore);
    assert.deepEqual(added, [saved.yeast.hopIndexId]);
    await reload(page); await page.locator(byLabel(`Ouvrir la recette ${name}`)).click();
    const section = '[data-recipe-section="Levure"]';
    await page.waitForSelector(section);
    if (!await page.$eval(section, e => e.open)) await page.locator(section + ' > summary').click();
    assert.match(await page.$eval(section, e => e.textContent), /Dieter/);
    await openInfo(page); assert.match(await page.$eval(info, e => e.textContent), /Altbier, Gose, Kölsch/);
    await capture(page, `overview-${width}`, section);
    await page.evaluate(saved => window.__hopQa.seedRecipe({ ...saved, id: 'QA-BREADTH-IMPORT', name: 'Cible import Dieter', yeastDesign: undefined, yeast: { name: 'Autre', form: 'sèche', qty: 1, unit: 'g' } }), saved);
    await reload(page); await openEdit(page, 'Cible import Dieter'); await clickText(page, 'Coller une recette trouvée');
    await page.locator(byLabel('Texte de la recette')).fill(copied); await clickText(page, 'Lire la recette');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(e => e.getClientRects().length && e.textContent.trim() === 'Reprendre'));
    const yeastPreview = await page.evaluate(() => [...document.querySelectorAll('h3')].find(e => e.textContent === 'Levure').parentElement.innerText);
    assert.equal(yeastPreview.match(/Imperial Yeast/g)?.length, 1); assert.equal(yeastPreview.match(/G03/g)?.length, 1);
    await capture(page, `import-preview-${width}`);
    await clickText(page, 'Reprendre'); await step(page, 'Récapitulatif'); await clickText(page, 'Enregistrer la recette');
    await page.waitForFunction(() => window.__hopQa.storage.getRecipes().find(r => r.id === 'QA-BREADTH-IMPORT')?.yeastDesign?.styleId === 'kolsch-alt');
    const restored = await page.evaluate(() => window.__hopQa.storage.getRecipes().find(r => r.id === 'QA-BREADTH-IMPORT'));
    assert.deepEqual(restored.yeast, saved.yeast); assert.deepEqual(restored.yeastDesign, saved.yeastDesign);
    assert.deepEqual(restored.hops, saved.hops); assert.deepEqual(restored.fermentation, saved.fermentation);
    await page.evaluate(saved => {
      window.__hopQa.storage.addBatch({ ...saved, id: 'B-BREADTH', name: 'Brassin Dieter figé', status: 'planifie', brewDate: '12.09.2026', stockAccountingVersion: 1, gravityLog: [], recipeSnapshot: { ...saved, capturedAt: '2026-09-12' }, brewDay: { steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0, tempC: 18 }], currentIndex: 0, readings: [] } });
      window.__hopQa.seedRecipe({ ...saved, yeast: { name: 'Autre levure', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 12, unit: 'g' } });
    }, saved);
    await reload(page); await page.locator(byLabel('Brassins (1)')).click();
    await page.locator(byLabel('Jour de brassage · B-BREADTH')).click();
    await page.waitForSelector('[aria-label="Conduite de levure du brassin"]');
    await openInfo(page); assert.equal(await page.$eval(info, e => e.dataset.yeastInformation), saved.yeast.hopIndexId);
    await capture(page, `brew-day-${width}`, info);
    await context.close();
  }
  assert.deepEqual(errors, []); await writeFile(resolve(out, 'after.json'), JSON.stringify({ reports, errors }, null, 2));
  console.log('YEAST BREADTH UI SUCCESS', out);
} catch (error) {
  for (const [i, page] of (await browser.pages()).entries()) if (page.url().startsWith(base)) {
    await page.screenshot({ path: resolve(out, `failure-${i}.png`) });
    await writeFile(resolve(out, `failure-${i}.json`), JSON.stringify({ error: String(error), text: await page.$eval('body', e => e.innerText), errors }, null, 2));
  } throw error;
} finally { await browser.close(); server.close(); }
