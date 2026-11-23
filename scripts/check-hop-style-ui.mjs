// Actual React application with isolated persistence/auth/API adapters.
// Browser plugin unavailable: use the repository's existing Puppeteer runtime.
import assert from 'node:assert/strict';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
const dir = resolve(tmpdir(), 'laffinee-hop-qa-style');
const out = process.env.HOP_STYLE_EVIDENCE_DIR || resolve(tmpdir(), 'laffinee-hop-style-evidence');
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
const byLabel = label => `[aria-label=${JSON.stringify(label)}]`;
async function clickText(page, text, tag = 'button') {
  const h = await page.waitForFunction((text, tag) => [...document.querySelectorAll(tag)].find(e => e.getClientRects().length && e.textContent.trim() === text), {}, text, tag);
  await h.asElement().asLocator().click(); await h.dispose();
}
async function step(page, label) {
  const h = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(e => e.getClientRects().length && e.getAttribute('aria-label') === label), {}, label);
  await h.asElement().asLocator().click(); await h.dispose();
}
async function fill(page, label, value) {
  const h = await page.waitForSelector(byLabel(label), { visible: true });
  await h.click({ clickCount: 3 }); await page.keyboard.press('Backspace');
  if (value) await h.type(value); await page.keyboard.press('Tab');
}
async function capture(page, name, selector = '.hop-workbench') {
  if (selector) {
    const h = await page.$(selector);
    if (h) await h.evaluate(e => e.scrollIntoView({ block: 'start' }));
  }
  await page.screenshot({ path: resolve(out, name + '.png') });
  const state = await page.evaluate(() => ({
    width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, text: document.body.innerText,
    bars: [...document.querySelectorAll('.recipe-wizard header,.recipe-wizard footer')].filter(e => e.getClientRects().length).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height })),
    escaping: [...document.querySelectorAll('.hop-workbench *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 80) })).slice(0, 10),
    overlappingPhases: [...document.querySelectorAll('.hop-phase-list>div')].filter(e => {
      if (!e.getClientRects().length) return false;
      const a = e.querySelector('dt').getBoundingClientRect(), b = e.querySelector('dd').getBoundingClientRect();
      return a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
    }).map(e => e.textContent),
  }));
  assert(!state.overflow, `overflow ${name}`); assert.equal(state.escaping.length, 0, `escaping ${name}: ${JSON.stringify(state.escaping)}`);
  assert.deepEqual(state.overlappingPhases, [], `Phase and mass overlap: ${name}`);
  assert(!/NaN|Infinity/.test(state.text), `invalid number ${name}`); reports.push({ name, ...state });
}
async function openEdit(page, name) {
  const selector = byLabel(`Modifier la recette ${name}`), edit = await page.waitForSelector(selector);
  const summary = await edit.evaluateHandle(e => { const d = e.closest('details'); return d && !d.open ? d.querySelector('summary') : null; });
  if (summary.asElement()) await summary.asElement().asLocator().click();
  await page.locator(selector).click(); await page.waitForSelector('#wz-title');
}
async function seed(page, name, kind = 'wheat') {
  await page.evaluate((name, kind) => {
    const r = window.__hopQa.recipe();
    Object.assign(r, { id: `qa-hop-${kind}`, name, style: kind === 'hazy' ? 'NEIPA' : kind === 'unknown' ? 'Projet personnel' : 'Hefeweizen', styleRef: undefined, nolo: undefined, yeastDesign: undefined, yeastGuide: undefined, hopSolverIntent: undefined,
      volumeL: 20, ogTarget: 1.05, ibuTarget: kind === 'hazy' ? 35 : 12,
      yeast: kind === 'hazy' ? { name: 'LalBrew Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 20 }
        : { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }],
      hops: kind === 'unknown' ? [] : [{ name: 'Hallertauer Mittelfrüh', weightG: 20, alpha: 4, stage: 'boil', timeMin: 60 }],
      mash: { ...r.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
    });
    window.__hopQa.seedRecipe(r);
  }, name, kind);
}
async function freshPage(width) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  page.on('pageerror', e => errors.push({ width, message: e.message }));
  await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
  await page.setRequestInterception(true); page.on('request', r => /^https?:/.test(r.url()) && !r.url().startsWith(base + '/') ? r.abort() : r.continue());
  await page.evaluateOnNewDocument(() => localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })));
  await page.goto(base); await page.waitForFunction(() => window.__hopQa?.ready());
  assert((await page.title()).includes('banc QA')); assert(!(await page.$('vite-error-overlay')));
  return { context, page };
}
try {
  for (const width of [375, 320, 430, 1280]) {
    const { context, page } = await freshPage(width), name = `QA Houblons Weissbier ${width}`;
    await seed(page, name); await openEdit(page, name); await step(page, 'Houblons');
    await capture(page, `after-top-${width}`, null);
    const writes = await page.evaluate(() => window.__hopQa.metrics.writes);
    await page.focus('.hop-tool-tabs [aria-selected="true"]'); await page.keyboard.press('ArrowRight');
    assert.match(await page.$eval('.hop-tool-tabs [aria-selected="true"]', e => e.textContent), /Simuler/);
    assert(await page.$eval('.hop-tool-tabs [aria-selected="true"]', e => e === document.activeElement));
    await fill(page, 'Cible totale à chaud', '12');
    await step(page, 'Levure'); await step(page, 'Houblons');
    assert.equal(await page.$eval(byLabel('Cible totale à chaud'), e => e.value), '12', 'Unapplied hop draft must survive step navigation');
    await fill(page, 'Alpha du lot à simuler', '');
    assert(await page.$eval('.hop-apply', e => e.disabled));
    await capture(page, `after-error-${width}`);
    await fill(page, 'Alpha du lot à simuler', '4');
    assert(!(await page.$eval('.hop-apply', e => e.disabled)));
    await capture(page, `after-simulation-${width}`);
    assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), writes);
    await clickText(page, 'Appliquer cet ajout');
    await page.waitForFunction(() => document.querySelector('.hop-notice')?.textContent.includes('Ajout repris'));
    await clickText(page, 'Bilan');
    assert.match(await page.$eval('.hop-ibu-range figcaption', e => e.textContent), /12$/);
    await clickText(page, 'Simuler'); await page.select(byLabel('Outil de simulation houblon'), 'move');
    await fill(page, 'Minutes avant la fin', '10');
    const sameMass = await page.$eval('.hop-ibu-range figcaption', e => e.textContent);
    assert(!sameMass.endsWith('→ 12'));
    await page.locator('.hop-check input[type=checkbox]').click();
    assert.match(await page.$eval('.hop-ibu-range figcaption', e => e.textContent), /→ 12$/);
    await capture(page, `after-move-${width}`);
    if (width === 375) {
      await page.select(byLabel('Outil de simulation houblon'), 'replace');
      await page.locator(byLabel('Houblon du scénario')).click();
      await capture(page, 'after-catalogue-375');
      const option = await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')].find(e => e.textContent.startsWith('Tettnanger')));
      await option.asElement().asLocator().click();
      await fill(page, 'Alpha du lot de remplacement', '4,5'); assert(await page.$eval('.hop-apply', e => e.disabled));
      await page.select(byLabel('Forme du houblon actuel'), 'pelletT90');
      await page.select(byLabel('Forme du houblon de remplacement'), 'pelletT90');
      assert.match(await page.$eval('.hop-ibu-range figcaption', e => e.textContent), /→ 12$/);
      await capture(page, 'after-replacement-375');
      // Keep this comparison unapplied, then exercise the other thermal context.
      await page.select(byLabel('Outil de simulation houblon'), 'move');
      await page.select(byLabel('Moment du scénario houblon'), 'whirlpool');
      await fill(page, 'Contact au whirlpool', '20'); await fill(page, 'Température du whirlpool', '80');
      assert(!(await page.$eval('.hop-apply', e => e.disabled)));
      await capture(page, 'after-whirlpool-375');
    }
    await clickText(page, 'Goût / levure'); await clickText(page, 'Girofle');
    await clickText(page, 'Alternatives de levure · 3 à comparer', 'summary');
    const alternative = await page.waitForFunction(() => [...document.querySelectorAll('.hop-yeast-alternatives li')].find(e => e.textContent.includes('WLP380'))?.querySelector('button'));
    await alternative.asElement().asLocator().click();
    assert.match(await page.$eval('[aria-label="Scénario de levure"] h3', e => e.textContent), /WLP380/);
    assert.match(await page.$eval('.yeast-goals [aria-checked="true"]', e => e.textContent), /Girofle/);
    await capture(page, `after-alternative-${width}`, '[aria-label="Choix et simulation de levure"]');
    // An alternative is only a local comparison. Return to the current strain's clove trial.
    await step(page, 'Houblons'); await clickText(page, 'Goût / levure'); await clickText(page, 'Girofle'); await clickText(page, 'Simuler girofle avec la levure');
    await clickText(page, 'Préparer un essai girofle');
    await clickText(page, 'Appliquer le scénario');
    await page.waitForFunction(() => document.body.innerText.includes('Scénario repris dans la recette.'));
    await step(page, 'Paliers'); assert.match(await page.$eval(byLabel('Nom du palier 1'), e => e.value ?? e.textContent), /Repos férulique/);
    await capture(page, `after-mash-${width}`, '.recipe-wizard main');
    await step(page, 'Levure');
    assert.match(await page.$eval('.yeast-goals [aria-checked="true"]', e => e.textContent), /Girofle/);
    assert.match(await page.$eval('[aria-label="Scénario de levure"] h3', e => e.textContent), /3068/);
    await step(page, 'Récapitulatif'); await clickText(page, 'Enregistrer la recette');
    await page.waitForFunction(name => window.__hopQa.storage.getRecipes().some(r => r.name === name && r.yeastDesign?.goal === 'clove'), {}, name);
    const saved = await page.evaluate(name => window.__hopQa.storage.getRecipes().find(r => r.name === name), name);
    assert.equal(saved.yeast.hopIndexId, 'wyeast-3068'); assert.equal(saved.fermentation[0].tempC, 18);
    assert.equal(saved.mash.steps[0].tempC, 44); assert.equal(saved.mash.steps[1].tempC, 66);
    assert.equal(saved.hops[0].timeMin, 60); assert(saved.hops[0].weightG > 20 && saved.hops[0].weightG < 30);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__hopQa?.ready());
    await openEdit(page, name); await step(page, 'Houblons');
    assert.match(await page.$eval('.hop-ibu-range figcaption', e => e.textContent), /12$/);
    await capture(page, `after-saved-${width}`);
    if (width === 320) {
      await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await capture(page, 'after-zoom-320');
      await clickText(page, 'Calculer ma dose amère'); await fill(page, 'Cible totale à chaud', '10'); await capture(page, 'after-zoom-simulation-320');
    }
    reports.push({ width, completed: 'keyboard, style, missing alpha, correction, IBU dose, move with constant IBU, yeast alternative, clove, mash, save, reload' });
    await context.close(); console.log('HOP STYLE passed', width);
  }
  const { context, page } = await freshPage(375), name = 'QA Hazy houblonnage';
  await seed(page, name, 'hazy'); await openEdit(page, name); await step(page, 'Houblons');
  await clickText(page, 'Goût / levure'); await clickText(page, 'Fruits tropicaux');
  await capture(page, 'after-hazy-flavor-375');
  const citra = await page.waitForFunction(() => [...document.querySelectorAll('.hop-sensory-varieties li')].find(e => e.textContent.startsWith('Citra'))?.querySelector('button'));
  await citra.asElement().asLocator().click();
  await fill(page, 'Dose de cet ajout à cru', '4'); await fill(page, 'Température du contact à cru', '16'); await fill(page, 'Durée de contact à cru', '48');
  assert(await page.$eval('.hop-apply', e => e.disabled));
  await page.select(byLabel('Phase du dry hop'), 'postFermentation');
  await capture(page, 'after-hazy-dry-375');
  await clickText(page, 'Appliquer cet ajout'); await page.waitForFunction(() => document.querySelector('.hop-notice')?.textContent.includes('Ajout repris'));
  await clickText(page, 'Bilan'); await clickText(page, 'Planning du houblonnage à cru', 'summary');
  assert.match(await page.$eval('.hop-workbench', e => e.textContent), /80 g · 4 g\/L/);
  await capture(page, 'after-hazy-plan-375');
  await step(page, 'Levure'); await clickText(page, 'Interactions avec la recette · 4 g/L à cru', 'summary');
  assert.match(await page.$eval('.yeast-contacts', e => e.textContent), /Après fermentation/);
  assert.match(await page.$eval('.yeast-contacts', e => e.textContent), /48 h/);
  await capture(page, 'after-hazy-yeast-375', '.yeast-contacts');
  await step(page, 'Récapitulatif'); await clickText(page, 'Enregistrer la recette');
  await page.waitForFunction(name => window.__hopQa.storage.getRecipes().some(r => r.name === name && r.hops.length === 2), {}, name);
  const saved = await page.evaluate(name => window.__hopQa.storage.getRecipes().find(r => r.name === name), name);
  assert.deepEqual({ mass: saved.hops[1].weightG, phase: saved.hops[1].aromaTiming, t: saved.hops[1].aromaTemperatureC, hours: saved.hops[1].aromaContactHours }, { mass: 80, phase: 'postFermentation', t: 16, hours: 48 });
  await page.reload(); await page.waitForFunction(() => window.__hopQa?.ready());
  await seed(page, 'QA style inconnu', 'unknown'); await openEdit(page, 'QA style inconnu'); await step(page, 'Houblons');
  await capture(page, 'after-empty-375'); await clickText(page, 'Goût / levure');
  assert.match(await page.$eval('.hop-workbench', e => e.textContent), /Aucune famille de levure n’est supposée/);
  await capture(page, 'after-unknown-style-375');
  await context.close(); assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'after-report.json'), JSON.stringify({ reports, errors }, null, 2));
  console.log('HOP STYLE QA PASSED', out);
} catch (error) {
  for (const [i, page] of (await browser.pages()).entries()) if (page.url().startsWith(base)) {
    await page.screenshot({ path: resolve(out, `failure-${i}.png`) });
    await writeFile(resolve(out, `failure-${i}.json`), JSON.stringify({ error: String(error), text: await page.$eval('body', e => e.innerText), errors }, null, 2));
  }
  throw error;
} finally { await browser.close(); await new Promise(r => server.close(r)); }
