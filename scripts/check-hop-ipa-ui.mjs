// Real React screens and solver; only network/persistence use isolated QA adapters.
// Browser plugin unavailable: use the repository's existing Puppeteer runtime.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';

const before = process.argv.includes('--before');
const phase = before ? 'before' : 'after';
const dir = resolve(tmpdir(), `laffinee-hop-qa-ipa-${phase}`);
const out = resolve(tmpdir(), 'laffinee-hop-ipa-evidence');
await mkdir(out, { recursive: true });
if (!process.argv.includes('--reuse-build')) await buildHopRecipeQa(dir);
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
const label = value => `[aria-label=${JSON.stringify(value)}]`;
async function clickText(page, text, tag = 'button') {
  const h = await page.waitForFunction((text, tag) => [...document.querySelectorAll(tag)].find(e => e.getClientRects().length && e.textContent.trim() === text), {}, text, tag);
  await h.asElement().asLocator().click(); await h.dispose();
}
async function openRecipeHops(page, name) {
  const edit = await page.waitForSelector(label(`Modifier la recette ${name}`));
  const summary = await edit.evaluateHandle(e => { const d = e.closest('details'); return d && !d.open ? d.querySelector('summary') : null; });
  if (summary.asElement()) await summary.asElement().asLocator().click();
  await summary.dispose();
  await page.locator(label(`Modifier la recette ${name}`)).click();
  const hopStep = await page.waitForFunction(() => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(e => e.getClientRects().length && e.getAttribute('aria-label') === 'Houblons'));
  await hopStep.asElement().asLocator().click(); await hopStep.dispose();
}
async function capture(page, name, selector = label('Solver de houblonnage')) {
  if (selector) await page.$eval(selector, e => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: resolve(out, `${phase}-${name}.png`) });
  const state = await page.evaluate(scope => ({
    width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
    text: document.querySelector(scope)?.textContent,
    bars: [...document.querySelectorAll('.recipe-wizard header,.recipe-wizard footer')].filter(e => e.getClientRects().length).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height })),
    escaping: [...document.querySelectorAll(scope + ' *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 80) })).slice(0, 10),
  }), selector === '.hop-workbench' ? '.hop-workbench' : '[aria-label="Solver de houblonnage"]');
  assert(!state.overflow, `overflow ${name}`); assert.deepEqual(state.escaping, [], `escaping ${name}`);
  assert(!/NaN|Infinity/.test(state.text), `invalid number ${name}`); reports.push({ name, ...state });
}
async function search(page) {
  await clickText(page, 'Trouver mes combinaisons');
  await page.waitForSelector(label('Programme proposé par le solver'), { timeout: 30000 });
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].some(e => e.textContent.trim() === 'Arrêter la recherche'), { timeout: 30000 });
}
async function choices(page) {
  return page.$$eval('[aria-label="Pistes de houblonnage"] > button > span:first-child > span:first-child', elements => elements.map(e => e.textContent.trim()));
}
async function chooseHop(page, name) {
  const field = page.locator(label('Ajouter un houblon à comparer'));
  await field.click();
  if (await page.$eval(label('Ajouter un houblon à comparer'), e => e.readOnly)) await field.click();
  await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace'); await page.keyboard.type(name);
  await page.waitForFunction(name => document.querySelector('[aria-label="Ajouter un houblon à comparer"]')?.value === name, {}, name);
  const option = await page.waitForFunction(name => [...document.querySelectorAll('[role="option"]')].find(e => e.getAttribute('aria-label')?.startsWith(name + ' · ')), {}, name);
  await option.asElement().asLocator().click(); await option.dispose();
}
try {
  for (const width of before ? [375, 1280] : [375, 320, 430, 1280]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.on('pageerror', e => errors.push({ width, message: e.message }));
    await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.setRequestInterception(true); page.on('request', r => /^https?:/.test(r.url()) && !r.url().startsWith(base + '/') ? r.abort() : r.continue());
    await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
    await page.goto(base); await page.waitForFunction(() => window.__hopQa?.ready());
    const name = `QA Double IPA ${width}`;
    await page.evaluate(name => {
      const r = window.__hopQa.recipe(), lotus = window.__hopQa.storage.getHopVarieties().find(v => v.name === 'Lotus');
      Object.assign(r, { id: 'qa-double-ipa', name, style: 'Double IPA', styleRef: undefined, nolo: undefined, yeastDesign: undefined, yeastGuide: undefined, hopSolverIntent: undefined,
        volumeL: 24, ogTarget: 1.078, ibuTarget: 65,
        yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 20 },
        fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }],
        hops: [252.78, 144].map(weightG => ({ name: 'Lotus', hopVarietyId: lotus.id, weightG, stage: 'dryHop', aromaTiming: 'postFermentation', aromaTemperatureC: 16, aromaContactHours: 48 })),
        hopAromaTarget: Object.fromEntries(['tropical', 'berries', 'melon', 'floral'].map(id => [id, { min: 66, max: 100 }])),
      });
      window.__hopQa.seedRecipe(r);
    }, name);
    await openRecipeHops(page, name);
    await page.locator('.recipe-hop-tools > summary').click();
    await clickText(page, 'Goût / levure'); await clickText(page, 'Fruits tropicaux');
    await capture(page, `workbench-flavor-${width}`, '.hop-workbench');
    if (!before) {
      const more = await page.waitForFunction(() => [...document.querySelectorAll('.hop-workbench summary')].find(e => e.textContent.startsWith('Voir les ') && e.textContent.includes('autres références')));
      await more.asElement().asLocator().click(); await more.dispose();
      await page.locator(label('Préparer un ajout de Lotus')).click();
      assert.equal(await page.$eval(label('Houblon du scénario'), e => e.value), 'Lotus');
      await capture(page, `workbench-adjust-${width}`, '.hop-workbench');
    }
    await page.locator('.recipe-hop-tools > summary').click();
    await clickText(page, 'Recherche avancée · arômes, essais et analyses', 'summary');
    await clickText(page, 'Trouver mon combo');
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Trouver mes combinaisons')?.disabled);
    await capture(page, `choices-${width}`);
    await search(page);
    await capture(page, `results-${width}`, label('Programme proposé par le solver'));
    if (!before) {
      const defaultNames = await choices(page);
      assert.equal(new Set(defaultNames).size, defaultNames.length, 'Timing variants must not hide other hop varieties');
      assert.equal(defaultNames.length, 6);
      assert.match(await page.$eval('[aria-label="Pistes de houblonnage"]', e => e.textContent), /Usage documenté/);
      const writes = await page.evaluate(() => window.__hopQa.metrics.writes);
      for (const hop of width === 375 ? ['Lotus', 'Azacca', 'Strata', 'Cashmere', 'Citra', 'Idaho 7', 'Galaxy'] : ['Galaxy']) {
        await clickText(page, 'Automatique'); await chooseHop(page, hop);
        await page.waitForFunction(() => !document.querySelector('[aria-label="Programme proposé par le solver"]'));
        await search(page);
        assert.deepEqual(await choices(page), [hop], 'Explicit selection must restrict the actual solver');
        assert(await page.$eval(label('Conserver SafAle US-05'), e => e.checked));
      }
      if (width === 375) {
        await capture(page, 'galaxy-375', label('Programme proposé par le solver'));
        await clickText(page, 'Style, usage et sources', 'summary');
        assert.match(await page.$eval(label('Programme proposé par le solver'), e => e.textContent), /Hop Products Australia/);
        await capture(page, 'sources-375', label('Programme proposé par le solver'));
        await clickText(page, 'Automatique'); await chooseHop(page, 'Citra'); await chooseHop(page, 'Idaho 7');
        await search(page);
        assert.deepEqual((await choices(page)).sort(), ['Citra', 'Idaho 7']);
        // Keyboard selection, visible pressed state, and stale-preview invalidation.
        const citra = await page.waitForFunction(() => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Citra' && e.hasAttribute('aria-pressed')));
        await citra.asElement().focus(); await page.keyboard.press('Space'); await citra.dispose();
        await page.waitForFunction(() => !document.querySelector('[aria-label="Programme proposé par le solver"]'));
        assert.equal(await page.$eval(label('Ajouter un houblon à comparer'), e => e.getAttribute('role')), 'combobox');
        await clickText(page, 'Automatique');
        await page.locator(label('Ajouter un houblon à comparer')).click();
        // On touch, the first tap opens the catalogue and the second enables typing.
        await page.locator(label('Ajouter un houblon à comparer')).click();
        await page.keyboard.type('Galaxy');
        await page.waitForFunction(() => document.querySelector('[aria-label="Ajouter un houblon à comparer"]')?.value === 'Galaxy');
        await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')].length === 1);
        assert.match(await page.$eval('[role="option"]', e => e.textContent), /^Galaxy/);
        await capture(page, 'catalogue-375', null);
        const galaxy = await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')].find(e => e.textContent.startsWith('Galaxy')));
        await galaxy.asElement().asLocator().click(); await galaxy.dispose();
        await search(page); assert.deepEqual(await choices(page), ['Galaxy']);
      }
      assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), writes, 'Comparisons must not persist changes');
      await clickText(page, 'Ajouter ce programme à ma recette');
      await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('Programme appliqué') || document.body.innerText.includes('Programme appliqué.'));
      const recap = await page.$eval('[aria-label="Solver de houblonnage"]', e => e.textContent);
      assert.match(recap, /Lotus 252,78 g \+ Lotus 144 g \+ Galaxy/);
      assert.match(recap, /SafAle US-05/);
      await capture(page, `applied-${width}`);
      const style = await page.waitForFunction(() => [...document.querySelectorAll('select')].find(e => [...e.labels].some(l => l.textContent.trim() === 'Point de départ par style')));
      await style.asElement().select('free'); await style.dispose();
      await page.waitForFunction(() => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Automatique')?.getAttribute('aria-pressed') === 'true');
      assert.equal(await page.$eval(label('Ajouter un houblon à comparer'), e => e.value), '');
      assert.equal(await page.$(label('Programme proposé par le solver')), null);
      if (width === 375) {
        for (const styleName of ['Hazy IPA', 'English IPA']) {
          const selectedStyle = await page.waitForFunction(styleName => {
            const select = [...document.querySelectorAll('select')].find(e => [...e.labels].some(l => l.textContent.trim() === 'Point de départ par style'));
            return select && [...select.options].find(o => o.textContent.startsWith(styleName + ' ·'))?.value;
          }, {}, styleName);
          const value = await selectedStyle.jsonValue(); await selectedStyle.dispose();
          const select = await page.waitForFunction(() => [...document.querySelectorAll('select')].find(e => [...e.labels].some(l => l.textContent.trim() === 'Point de départ par style')));
          await select.asElement().select(value); await select.dispose();
          await capture(page, `style-${styleName.split(' ')[0].toLowerCase()}-375`);
          await chooseHop(page, styleName === 'Hazy IPA' ? 'Cashmere' : 'Challenger');
          await search(page);
          await clickText(page, 'Style, usage et sources', 'summary');
          assert.match(await page.$eval(label('Programme proposé par le solver'), e => e.textContent), /document|IPA|hazy/i);
          await capture(page, `sources-${styleName.split(' ')[0].toLowerCase()}-375`, label('Programme proposé par le solver'));
        }
      }
    }
    if (!before && [375, 1280].includes(width)) {
      await page.reload(); await page.waitForFunction(() => window.__hopQa?.ready());
      const englishName = `QA English IPA ${width}`;
      await page.evaluate(name => {
        const r = window.__hopQa.recipe();
        Object.assign(r, { id: 'qa-english-ipa', name, style: 'English IPA', styleRef: undefined, nolo: undefined, hops: [], yeastDesign: undefined });
        window.__hopQa.seedRecipe(r);
      }, englishName);
      await openRecipeHops(page, englishName);
      await page.locator('.recipe-hop-tools > summary').click(); await clickText(page, 'Goût / levure');
      assert(await page.$$eval('.hop-workbench [role="radio"]', rows => rows.some(e => e.textContent.trim() === 'Équilibre' && e.getAttribute('aria-checked') === 'true')));
      assert(await page.$(label('Préparer un ajout de Challenger')));
      await capture(page, `workbench-english-${width}`, '.hop-workbench');
      await page.locator('.recipe-hop-tools > summary').click();
      const field = page.locator('[role="combobox"][aria-label^="Ajouter un houblon en "]');
      await field.click();
      if (await page.$eval('[role="combobox"][aria-label^="Ajouter un houblon en "]', e => e.readOnly)) await field.click();
      await page.keyboard.type('Jester');
      const option = await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')].find(e => e.getAttribute('aria-label')?.startsWith('Jester · Repères')));
      await capture(page, `ingredient-english-${width}`, null);
      await option.asElement().asLocator().click(); await option.dispose();
      await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard li')].some(e => e.textContent.includes('Jester')));
      assert.equal(await page.$eval(label('Alpha de Jester en pourcent'), e => e.value), '', 'An unknown lot alpha must stay blank');
      await capture(page, `ingredient-added-${width}`, null);
      await page.locator(label('Alpha de Jester en pourcent')).fill('7.5');
      await page.keyboard.press('Tab');
      assert.match(await page.$eval(label('Alpha de Jester en pourcent'), e => e.value), /^7[.,]5$/);
      await page.locator(label('Alpha de Jester en pourcent')).fill('');
      await page.keyboard.press('Tab');
      assert.equal(await page.$eval(label('Alpha de Jester en pourcent'), e => e.value), '');
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, `${phase}-report.json`), JSON.stringify({ reports, errors }, null, 2));
  console.log(`IPA_UI_${phase.toUpperCase()}_PASS ${reports.length} captures: ${out}`);
} catch (error) {
  const pages = await browser.pages();
  const page = pages.at(-1);
  if (page) {
    await page.screenshot({ path: resolve(out, `${phase}-failure.png`) });
    const state = await page.evaluate(() => ({ text: document.body.innerText.slice(0, 5000),
      active: document.activeElement?.getAttribute('aria-label'),
      query: document.querySelector('[aria-label="Ajouter un houblon à comparer"]')?.value }));
    console.error(JSON.stringify({ errors, state }, null, 2));
  }
  throw error;
} finally { await browser.close(); await new Promise(r => server.close(r)); }
