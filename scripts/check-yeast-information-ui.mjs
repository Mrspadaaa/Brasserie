// Browser plugin unavailable: real installed Chrome + existing Puppeteer, isolated app adapters.
import assert from 'node:assert/strict';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
const dir = resolve(tmpdir(), 'laffinee-hop-qa-yeast-information');
const out = resolve(tmpdir(), 'laffinee-yeast-information-evidence');
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
  if (selector) await page.$eval(selector, e => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: resolve(out, name + '.png') });
  const state = await page.evaluate(() => ({ width: innerWidth, text: document.body.innerText,
    overflow: document.documentElement.scrollWidth > innerWidth,
    bars: [...document.querySelectorAll('.recipe-wizard header,.recipe-wizard footer')].filter(e => e.getClientRects().length).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height })),
    escaping: [...document.querySelectorAll('.yeast-workbench *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 70) })).slice(0, 8),
  }));
  assert(!state.overflow, `Overflow ${name}`); assert.deepEqual(state.escaping, [], `${name}: ${JSON.stringify(state.escaping)}`); assert(!/NaN|Infinity/.test(state.text));
  reports.push({ name, ...state });
}
const info = '.yeast-strain-details';
async function openInfo(page) {
  await page.locator(info + ' > summary').click(); await page.waitForSelector(info + '[open]');
}
async function reload(page) { await page.reload(); await page.waitForFunction(() => window.__hopQa?.ready()); }
try {
  for (const width of process.argv.includes('--375-only') ? [375] : [375, 320, 430, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.on('pageerror', error => errors.push({ width, message: error.message }));
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.setRequestInterception(true);
    page.on('request', request => /^https?:/.test(request.url()) && !request.url().startsWith(base + '/') ? request.abort() : request.continue());
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(base); await page.waitForFunction(() => window.__hopQa?.ready());
    const name = `Informations levure ${width}`;
    await page.evaluate(name => {
      const r = window.__hopQa.recipe();
      Object.assign(r, { id: 'QA-YEAST-INFO', name, style: 'American IPA', styleRef: undefined, nolo: undefined, yeastGuide: undefined, yeastDesign: undefined, volumeL: 20, ogTarget: 1.05,
        yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 20 },
        fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }],
        mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
        hops: [{ name: 'Citra', stage: 'dryHop', alpha: 12, weightG: 40, dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 20 }],
      }); window.__hopQa.seedRecipe(r);
    }, name);
    await openEdit(page, name); await step(page, 'Levure');
    assert.equal(await page.$eval(info, e => e.open), false);
    assert.match(await page.$eval('[aria-label="Scénario de levure"]', e => e.innerText), /20 °C · dans la fenêtre/);
    await capture(page, `closed-${width}`, '[aria-label="Choix et simulation de levure"]');
    const writes = await page.evaluate(() => window.__hopQa.metrics.writes);
    // Native details must open and close with the keyboard, without writing a recipe.
    await page.focus(info + ' > summary'); await page.keyboard.press('Enter'); await page.waitForSelector(info + '[open]');
    assert.match(await page.$eval(info, e => e.innerText), /25–29 °C/);
    assert.equal(await page.$eval(info + ' details', e => e.open), false);
    await capture(page, `preparation-${width}`, info);
    await page.locator(info + ' details > summary').click();
    assert(await page.$$eval(info + ' details a[href]', rows => rows.some(a => a.href.includes('fermentis.com'))));
    await capture(page, `sources-${width}`, info + ' details');
    await page.locator(info + ' details > summary').click();
    await page.focus(info + ' > summary'); await page.keyboard.press('Enter');
    assert.equal(await page.$eval(info, e => e.open), false);
    assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), writes);
    if (!process.argv.includes('--base-only')) {
      await page.select(byLabel('Filtrer les levures par style'), 'belgian-ale');
      await page.locator(byLabel('Rechercher une levure')).fill('3787');
      const radio = await page.waitForFunction(() => [...document.querySelectorAll('.yeast-candidates input')].find(e => e.getAttribute('aria-label').includes('3787')));
      await radio.asElement().asLocator().click();
      await page.waitForFunction(() => document.querySelector('[aria-label="Scénario de levure"] h3')?.textContent.includes('3787'));
      await openInfo(page); assert.match(await page.$eval(info, e => e.innerText), /mousse|espace libre/i);
      await capture(page, `belgian-${width}`, info);
      await page.select(byLabel('Filtrer les levures par style'), 'lager');
      await page.locator(byLabel('Rechercher une levure')).fill('S-189');
      const lager = await page.waitForFunction(() => [...document.querySelectorAll('.yeast-candidates input')].find(e => e.getAttribute('aria-label').includes('S-189')));
      await lager.asElement().asLocator().click();
      await page.waitForFunction(() => document.querySelector('[aria-label="Scénario de levure"] h3')?.textContent.includes('S-189'));
      await openInfo(page); await capture(page, `lager-${width}`, info);
      await clickText(page, 'Réinitialiser');
    }
    await clickText(page, 'Appliquer le scénario');
    await step(page, 'Récapitulatif'); await clickText(page, 'Enregistrer la recette');
    await page.waitForFunction(() => window.__hopQa.storage.getRecipes().some(r => r.id === 'QA-YEAST-INFO' && r.yeastDesign));
    await reload(page); await page.locator(byLabel(`Ouvrir la recette ${name}`)).click();
    const section = '[data-recipe-section="Levure"]';
    await page.waitForSelector(section);
    if (!await page.$eval(section, e => e.open)) await page.locator(section + ' > summary').click();
    await openInfo(page); assert.match(await page.$eval(info, e => e.innerText), /25–29 °C/);
    await capture(page, `overview-${width}`, info);
    await page.evaluate(() => {
      const r = window.__hopQa.storage.getRecipes().find(r => r.id === 'QA-YEAST-INFO');
      window.__hopQa.storage.addBatch({ ...r, id: 'B-INFO', name: 'Brassin levure figé', status: 'planifie', brewDate: '12.09.2026', stockAccountingVersion: 1, gravityLog: [], recipeSnapshot: { ...r, capturedAt: '2026-09-12' }, brewDay: { steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0, tempC: 20 }], currentIndex: 0, readings: [] } });
      window.__hopQa.seedRecipe({ ...r, yeast: { name: 'Autre levure', form: 'levain', qty: 99, unit: 'mL' } });
    });
    await reload(page);
    const batches = await page.waitForFunction(() => [...document.querySelectorAll('button')].find(e => e.getClientRects().length && e.getAttribute('aria-label') === 'Brassins (1)'));
    await batches.asElement().asLocator().click();
    await page.locator(byLabel('Jour de brassage · B-INFO')).click();
    await page.waitForSelector('[aria-label="Conduite de levure du brassin"]');
    await openInfo(page); assert.equal(await page.$eval(info, e => e.dataset.yeastInformation), 'fermentis-us05');
    await capture(page, `brew-day-${width}`, info);
    if (width === 375) {
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.waitForFunction(() => getComputedStyle(document.documentElement).fontSize === '32px');
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await capture(page, 'text-200-percent-375', info);
    }
    await context.close();
  }
  assert.deepEqual(errors, []); await writeFile(resolve(out, 'after.json'), JSON.stringify({ reports, errors }, null, 2));
  console.log('YEAST INFORMATION UI SUCCESS', out);
} catch (error) {
  for (const [i, page] of (await browser.pages()).entries()) if (page.url().startsWith(base)) {
    await page.screenshot({ path: resolve(out, `failure-${i}.png`) });
    await writeFile(resolve(out, `failure-${i}.json`), JSON.stringify({ error: String(error), text: await page.$eval('body', e => e.innerText), errors }, null, 2));
  } throw error;
} finally { await browser.close(); server.close(); }
