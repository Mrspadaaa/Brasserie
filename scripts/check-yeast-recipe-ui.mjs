// Real React application, isolated Firebase/auth/AI adapters. No live account or API calls.
// Browser plugin is unavailable in this workspace; use the repository's existing Puppeteer runtime.
import assert from 'node:assert/strict';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const dir = resolve(tmpdir(), 'laffinee-hop-qa-yeast-design');
const out = resolve(tmpdir(), 'laffinee-yeast-design-evidence');
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
async function clickText(page, text, contains = false, tag = 'button') {
  const handle = await page.waitForFunction((text, contains, tag) => [...document.querySelectorAll(tag)].find(e => e.getClientRects().length && (contains ? e.textContent.trim().includes(text) : e.textContent.trim() === text)), {}, text, contains, tag);
  await handle.asElement().click();
}
async function step(page, label) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(e => e.getClientRects().length && e.getAttribute('aria-label') === label), {}, label);
  await handle.asElement().click();
}
async function fill(page, label, value) {
  const field = await page.waitForSelector(byLabel(label), { visible: true });
  await field.click({ clickCount: 3 }); await page.keyboard.press('Backspace');
  if (value) await field.type(value); await page.keyboard.press('Tab');
}
async function capture(page, name, selector = '[aria-label="Choix et simulation de levure"]') {
  const el = await page.$(selector);
  if (el) await el.evaluate(e => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: resolve(out, name + '.png') });
  const state = await page.evaluate(() => ({
    width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
    text: document.body.innerText, fixed: [...document.querySelectorAll('.recipe-wizard header,.recipe-wizard footer')].filter(e => e.getClientRects().length).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height })),
    escaping: [...document.querySelectorAll('.yeast-workbench *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 90) })).slice(0, 10),
  }));
  assert(!state.overflow, `Page overflow: ${name}`); assert.equal(state.escaping.length, 0, `Yeast control overflow: ${name} ${JSON.stringify(state.escaping)}`);
  assert(!/NaN|Infinity/.test(state.text)); reports.push({ name, ...state });
}
async function openEdit(page, name) {
  const selector = byLabel(`Modifier la recette ${name}`);
  await page.waitForSelector(selector);
  const field = await page.$(selector);
  const summary = await field.evaluateHandle(e => { const detail = e.closest('details'); return detail && !detail.open ? detail.querySelector('summary') : null; });
  if (summary.asElement()) await summary.asElement().asLocator().click();
  await page.locator(selector).click(); await page.waitForSelector('#wz-title');
}
async function seed(page, name, kind) {
  return page.evaluate((name, kind) => {
    const r = window.__hopQa.recipe();
    Object.assign(r, { id: `qa-yeast-${kind}`, name, style: kind === 'hazy' ? 'NEIPA' : kind === 'unknown' ? 'Projet personnel' : 'Hefeweizen', styleRef: undefined, nolo: undefined, yeastGuide: undefined, yeastDesign: undefined,
      volumeL: 20, ogTarget: 1.05, ibuTarget: 12, batchRef: undefined,
      yeast: kind === 'hazy' ? { name: 'LalBrew Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 20 }
        : { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }],
      mash: { ...r.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
      hops: kind === 'hazy' ? [{ name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop', dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 20 },
        { name: 'Mosaic', weightG: 40, alpha: 12, stage: 'dryHop', dayOffset: 8 }]
        : [{ name: 'Hallertau', weightG: 20, alpha: 4, stage: 'boil', timeMin: 60 }],
    });
    if (kind === 'unknown') { r.fermentables = []; r.ogTarget = null; r.fermentation = []; r.mash.steps = []; }
    window.__hopQa.seedRecipe(r); return r;
  }, name, kind);
}
try {
  // Phone first; full journey at each supported width.
  for (const width of [375, 320, 430, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    const remote = [];
    page.on('pageerror', error => errors.push({ width, message: error.message }));
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (/^https?:/.test(request.url()) && !request.url().startsWith(base + '/')) { remote.push(request.url()); request.abort(); }
      else request.continue();
    });
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(base); await page.waitForFunction(() => window.__hopQa?.ready());
    const name = `QA Hefeweizen ${width}`, original = await seed(page, name, 'wheat');
    await openEdit(page, name); await step(page, 'Levure');
    assert.equal(await page.$eval(byLabel('Filtrer les levures par style'), e => e.value), 'weissbier');
    if (width < 600) {
      const commands = await page.$$eval('.recipe-titlebar > button', buttons => buttons.map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })));
      assert(commands.length >= 2 && commands.every(e => e.width === 28 && e.height === 28));
    }
    await capture(page, `after-style-${width}`);
    const writes = await page.evaluate(() => window.__hopQa.metrics.writes);
    // Keyboard selection also exercises the roving radio group.
    await page.focus('.yeast-goals [aria-checked="true"]'); await page.keyboard.press('ArrowRight');
    assert.match(await page.$eval('.yeast-goals [aria-checked="true"]', e => e.textContent), /Banane/);
    await clickText(page, 'Girofle · épices');
    await clickText(page, 'Comparer les souches du style', true, 'summary');
    await page.waitForSelector('.yeast-strain-comparison[open]');
    await page.locator(byLabel('Comparer WLP380 · Hefeweizen IV')).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Scénario de levure"] h3')?.textContent.includes('WLP380'));
    await capture(page, `after-alternative-${width}`, '[aria-label="Scénario de levure"]');
    await clickText(page, 'Réinitialiser');
    await fill(page, 'Température principale du scénario', '27');
    assert.match(await page.$eval('[aria-label="Scénario de levure"] [role="alert"]', e => e.textContent), /hors de la fenêtre/);
    assert(await page.$$eval('.yeast-actions button', rows => rows.find(e => e.textContent === 'Appliquer le scénario').disabled));
    await fill(page, 'Température principale du scénario', '22,5');
    await clickText(page, 'Pression précoce', true, 'summary');
    await fill(page, 'Contre-pression du scénario en bar', '0,8');
    await page.waitForSelector('[data-effect="pressure"]');
    assert.match(await page.$eval('[data-effect="pressure"]', e => e.textContent), /Esters potentiellement freinés/);
    await clickText(page, 'Girofle · épices'); await clickText(page, 'Préparer un essai girofle');
    await fill(page, 'Contre-pression du scénario en bar', '0');
    await clickText(page, 'Recette → scénario', true, 'summary');
    await capture(page, `after-proposal-${width}`, '[aria-label="Scénario de levure"] details[open]');
    assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), writes);
    await clickText(page, 'Appliquer le scénario');
    await page.waitForFunction(() => document.body.innerText.includes('Scénario repris dans la recette.'));
    assert(!await page.evaluate(() => document.body.innerText.includes('La recette a changé pendant la comparaison')));
    await step(page, 'Paliers');
    assert.match(await page.$eval(byLabel('Nom du palier 1'), e => e.value ?? e.textContent), /Repos férulique/);
    await capture(page, `after-mash-${width}`, '.recipe-wizard main');
    await step(page, 'Houblons');
    assert.match(await page.$eval(byLabel('Levure et conduite liées à la recette'), e => e.textContent), /Girofle/);
    await step(page, 'Récapitulatif'); await clickText(page, 'Enregistrer la recette');
    await page.waitForFunction(name => window.__hopQa.storage.getRecipes().some(r => r.name === name && r.yeastDesign?.goal === 'clove'), {}, name);
    const saved = await page.evaluate(name => window.__hopQa.storage.getRecipes().find(r => r.name === name && r.yeastDesign), name);
    assert.equal(saved.yeastDesign.pressureBar, 0); assert.equal(saved.fermentation[0].tempC, 18);
    assert.deepEqual(saved.fermentation[1], original.fermentation[1]); assert.deepEqual(saved.hops, original.hops); assert.equal(saved.mash.steps.length, 2);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__hopQa?.ready());
    await page.click(byLabel(`Ouvrir la recette ${name}`));
    await page.waitForSelector(byLabel('Conduite de levure de la recette'));
    // RecipePage puts sections behind disclosure only on some formats.
    const section = await page.$(byLabel('Conduite de levure de la recette'));
    const summary = await section.evaluateHandle(e => { const d = e.closest('details'); return d && !d.open ? d.querySelector('summary') : null; });
    if (summary.asElement()) await summary.asElement().asLocator().click();
    await capture(page, `after-saved-${width}`, byLabel('Conduite de levure de la recette'));
    const stored = await page.evaluate(() => JSON.stringify(window.__hopQa.storage.getRecipes()));
    await clickText(page, 'Simuler une variante de levure');
    await fill(page, 'Température principale du scénario', '21'); await clickText(page, 'Appliquer le scénario');
    await clickText(page, 'Fermer la variante de levure');
    assert.equal(await page.evaluate(() => JSON.stringify(window.__hopQa.storage.getRecipes())), stored);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__hopQa?.ready());
    await openEdit(page, name); await step(page, 'Levure');
    assert.equal(await page.$eval(byLabel('Température principale du scénario'), e => e.value), '18');
    assert.match(await page.$eval('.yeast-goals [aria-checked="true"]', e => e.textContent), /Girofle/);
    await clickText(page, 'Programme détaillé et guides enregistrés', false, 'summary');
    assert(!await page.evaluate(() => document.body.innerText.includes('Trouver une conduite')));
    assert(!await page.$eval('[aria-label="Résultat de ma fermentation"]', e => e.textContent.includes('DF documentaire')));
    await clickText(page, 'Tester mes températures et durées', false, 'summary');
    if (width === 375 || width === 1280) await capture(page, `after-program-${width}`, '[aria-label="Résultat de ma fermentation"]');
    await clickText(page, 'Programme détaillé et guides enregistrés', false, 'summary');
    // Emulate browser text zoom: normal CSS reflow, no scaling screenshot.
    if (width === 320) {
      await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      await page.waitForFunction(() => getComputedStyle(document.documentElement).fontSize === '32px');
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await capture(page, 'after-zoom-320');
      await capture(page, 'after-zoom-effects-320', '.yeast-effects');
      await clickText(page, 'Comparer les souches du style', true, 'summary');
      await page.waitForSelector('.yeast-strain-comparison[open]');
      await capture(page, 'after-zoom-comparison-320', '.yeast-candidates');
    }
    const calls = await page.evaluate(() => window.__hopQa.calls);
    assert.deepEqual(calls.filter(name => !['getBrewerActivity', 'getBrewerConversation'].includes(name)), []);
    reports.push({ width, remoteBlocked: remote, localAdapterCalls: calls, completed: 'style, keyboard, alternative, errors, pressure, ferulic rest, cross-step, save, reload, read-only variant' });
    console.log('YEAST UI passed', width); await context.close();
  }
  // Separate Hazy IPA exercise reads two real dry-hop inputs, one without a biological phase.
  const context = await browser.createBrowserContext(), page = await context.newPage();
  await page.setViewport({ width: 375, height: 900, isMobile: true, hasTouch: true });
  page.on('pageerror', error => errors.push({ kind: 'hazy', message: error.message }));
  await page.setRequestInterception(true); page.on('request', r => r.url().startsWith(base) || !/^https?:/.test(r.url()) ? r.continue() : r.abort());
  await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
  await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__hopQa?.ready());
  await seed(page, 'QA Hazy houblons', 'hazy'); await openEdit(page, 'QA Hazy houblons'); await step(page, 'Levure');
  await clickText(page, 'Interactions avec la recette', true, 'summary');
  await capture(page, 'after-hazy-contacts-375', '.yeast-contacts');
  assert.match(await page.$eval('.yeast-contacts', e => e.textContent), /Fermentation active/);
  assert.match(await page.$eval('.yeast-contacts', e => e.textContent), /À préciser/);
  await clickText(page, 'Ensemencement et durée à préparer', true, 'summary'); await fill(page, 'Masse de levure du scénario en grammes', '15');
  await clickText(page, 'Appliquer le scénario');
  await clickText(page, 'Vérifier les houblons');
  await capture(page, 'after-hazy-linked-375', byLabel('Levure et conduite liées à la recette'));
  assert.match(await page.$eval(byLabel('Levure et conduite liées à la recette'), e => e.textContent), /5 g\/L/);
  const phase = await page.evaluateHandle(() => [...document.querySelectorAll('label')].find(e => e.textContent.startsWith('Phase de Mosaic')).querySelector('select'));
  await phase.asElement().select('postFermentation');
  await fill(page, 'Contact à cru de Mosaic, en heures', '24'); await fill(page, 'Température à cru de Mosaic', '18');
  await clickText(page, 'Comparer');
  await clickText(page, 'Interactions avec la recette', true, 'summary');
  assert.match(await page.$eval('.yeast-contacts', e => e.textContent), /Après fermentation/);
  assert(!await page.evaluate(() => document.querySelector('[aria-label="Choix et simulation de levure"]').textContent.includes('contexte actif / après fermentation inconnu')));
  await clickText(page, 'Ensemencement et durée à préparer', true, 'summary');
  await fill(page, 'Masse de levure du scénario en grammes', '8');
  assert.match(await page.$eval('.yeast-figures', e => e.textContent), /sous le repère fabricant/);
  await capture(page, 'after-dose-375', '.yeast-figures');
  await fill(page, 'Masse de levure du scénario en grammes', '15');
  await capture(page, 'after-hazy-corrected-375', '.yeast-contacts');
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__hopQa?.ready());
  await seed(page, 'QA levure incomplète', 'unknown'); await openEdit(page, 'QA levure incomplète'); await step(page, 'Levure');
  assert.equal(await page.$eval(byLabel('Filtrer les levures par style'), e => e.value), 'unknown');
  await capture(page, 'after-empty-style-375');
  await page.select(byLabel('Filtrer les levures par style'), 'belgian-ale'); await page.select(byLabel('Forme à comparer'), 'liquide');
  assert.match(await page.$eval('[aria-label="Choix et simulation de levure"] [role="status"]', e => e.textContent), /Aucune souche/);
  await capture(page, 'after-empty-filter-375');
  await page.select(byLabel('Filtrer les levures par style'), 'weissbier');
  assert.equal(await page.$eval(byLabel('Température principale du scénario'), e => e.value), '');
  assert.equal(await page.$('.yeast-temperature-range'), null);
  await clickText(page, 'Ensemencement et durée à préparer', true, 'summary');
  await fill(page, 'Taux de cellules visé par mL et degré Plato', '0,75');
  assert.match(await page.$eval('[aria-label="Scénario de levure"] output[aria-live]', e => e.textContent), /Renseigne volume, densité et taux/);
  await capture(page, 'after-missing-inputs-375', '.yeast-figures');
  await fill(page, 'Durée principale du scénario en jours', '10'); await fill(page, 'Température principale du scénario', '20');
  await clickText(page, 'Banane'); await clickText(page, 'Appliquer le scénario');
  await step(page, 'Paliers'); await step(page, 'Levure');
  assert.equal(await page.$eval(byLabel('Filtrer les levures par style'), e => e.value), 'weissbier');
  assert.match(await page.$eval('.yeast-goals [aria-checked="true"]', e => e.textContent), /Banane/);
  await context.close();
  assert.deepEqual(errors, []); await writeFile(resolve(out, 'after.json'), JSON.stringify({ reports, errors }, null, 2));
  console.log('YEAST UI SUCCESS', out);
} catch (error) {
  const pages = await browser.pages();
  for (const [i, page] of pages.entries()) if (page.url().startsWith(base)) {
    await page.screenshot({ path: resolve(out, `failure-${i}.png`) });
    await writeFile(resolve(out, `failure-${i}.json`), JSON.stringify({ error: String(error), text: await page.$eval('body', e => e.innerText), pageErrors: errors }, null, 2));
  }
  throw error;
} finally { await browser.close(); server.close(); }
