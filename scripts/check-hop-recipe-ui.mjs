// Browser plugin unavailable in this workspace; use the repository's Puppeteer workflow.
// Flow: real App -> creation -> simulation -> persistence -> reload -> consultation -> variant.
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
const buildDir = resolve(process.env.HOP_QA_BUILD_DIR || resolve(tmpdir(), 'laffinee-hop-qa-build'));
const out = resolve(process.env.HOP_QA_OUTPUT || resolve(tmpdir(), 'laffinee-hop-qa-evidence'));
await mkdir(out, { recursive: true });
if (process.env.HOP_QA_SKIP_BUILD !== '1') await buildHopRecipeQa(buildDir);
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(buildDir, path === '/' ? 'tests/qa/hop-recipe/index.html' : '.' + path);
    if (!file.startsWith(buildDir + sep)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [];
let active;
const click = async (page, label, partial = false) => {
  const h = await page.waitForFunction((label, partial) => {
    const labels = label === '+ Recette' ? [label, 'Nouvelle recette'] : [label];
    return [...document.querySelectorAll('button')].find(b => {
      if (!b.getClientRects().length || b.disabled) return false;
      const values = [b.textContent.trim(), b.getAttribute('aria-label') || ''];
      return labels.some(candidate => values.some(value => partial ? value.includes(candidate) : value === candidate));
    });
  }, {}, label, partial);
  await h.asElement().evaluate(e => e.scrollIntoView({ block: 'center' })); await h.asElement().click(); await h.dispose();
};
const chooseOption = async (page, text) => {
  const h = await page.waitForFunction(text => [...document.querySelectorAll('[role="option"]')].find(e => e.getClientRects().length && e.textContent.trim().startsWith(text)), {}, text);
  await h.asElement().click(); await h.dispose();
};
const fillCombobox = async (page, selector, value) => {
  const field = page.locator(selector);
  if (await page.$eval(selector, element => element.readOnly)) {
    await field.click();
    await field.click();
    await page.waitForFunction(selector => !document.querySelector(selector)?.readOnly, {}, selector);
  }
  await field.fill(value);
};
const fillVisibleInput = async (page, selector, value) => {
  const element = await page.waitForSelector(selector);
  await element.evaluate((element, value) => {
    element.scrollIntoView({ block: 'center' });
    element.focus();
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};
const details = async (page, label, open = true) => {
  const h = await page.waitForFunction(label => [...document.querySelectorAll('summary')].find(e => e.getClientRects().length && e.textContent.includes(label)), {}, label);
  const current = await h.evaluate(e => e.parentElement.open);
  if (current !== open) { await h.asElement().evaluate(e => e.scrollIntoView({ block: 'center' })); await h.asElement().click(); }
  await h.dispose();
};
const openAdvancedAnalysis = async page => {
  const h = await page.waitForFunction(() => [...document.querySelectorAll('summary')]
    .find(element => element.getClientRects().length && element.textContent.includes('Analyses aromatiques avancées')));
  await h.evaluate(element => {
    element.parentElement.open = true;
    element.scrollIntoView({ block: 'center' });
  });
  await h.dispose();
};
const openHopSimulation = async page => {
  const summary = await page.waitForFunction(() => [...document.querySelectorAll('summary')].find(element => {
    if (!element.getClientRects().length) return false;
    return element.textContent.includes('Potentiel aromatique')
      || element.textContent.includes('Recherche avancée · arômes, essais et analyses');
  }));
  const label = await summary.evaluate(element => element.textContent.includes('Potentiel aromatique')
    ? 'Potentiel aromatique'
    : 'Recherche avancée · arômes, essais et analyses');
  await summary.dispose();
  await details(page, label);
  await page.waitForSelector('[aria-label="Simulation de mes ajouts"]');
};
const selectField = async (page, label, value) => {
  const h = await page.waitForFunction(label => [...document.querySelectorAll('label')].find(e => e.textContent.trim() === label && e.getClientRects().length)?.control, {}, label);
  await h.asElement().select(value); await h.dispose();
};
const solverIdle = page => page.waitForFunction(() => ![...document.querySelectorAll('[aria-label="Solver de houblonnage"] button')].some(b => b.textContent.includes('Arrêter la recherche')));
const checkbox = async (page, name, checked) => {
  const selector = `[aria-label="Simulation de mes ajouts"] input[aria-label="${name}"]`;
  const visible = await page.$$eval(selector, elements => elements.some(element => !!element.getClientRects().length));
  if (!visible && name === 'Toutes les saveurs et la chimie') {
    await openAdvancedAnalysis(page);
  }
  const handle = await page.waitForFunction(selector => [...document.querySelectorAll(selector)]
    .find(element => element.getClientRects().length), {}, selector);
  const element = handle.asElement();
  if (await element.evaluate(e => e.checked) !== checked) {
    await element.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.click(); });
  }
  await page.waitForFunction((selector, checked) => [...document.querySelectorAll(selector)]
    .some(element => element.getClientRects().length && element.checked === checked), {}, selector, checked);
  await handle.dispose();
};
const capture = async (page, name, selector = '[aria-label="Simulation de mes ajouts"]') => {
  const element = await page.$(selector); if (element) await element.evaluate(e => e.scrollIntoView({ block: 'start' }));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow: ${name}`);
  await page.screenshot({ path: resolve(out, name + '.png') });
};
const back = async page => {
  const button = await page.waitForFunction(() => [...document.querySelectorAll('button')].find(b => b.getClientRects().length && ['Retour', 'Fermer', 'Revenir'].some(s => (b.getAttribute('aria-label') || '') === s)));
  await button.asElement().click(); await button.dispose();
};
import { verifyGraph } from './qa/verify-hop-graph.mjs';

try {
  const widths = process.env.HOP_QA_WIDTH
    ? [Number(process.env.HOP_QA_WIDTH)]
    : process.env.HOP_QA_PROBE ? [390] : [320, 390, 1280];
  for (const width of widths) {
    const context = await browser.createBrowserContext(), page = await context.newPage(); active = page;
    await page.setViewport({ width, height: 1000, isMobile: width < 600, hasTouch: width < 600 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const errors = [], remote = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['error', 'warn'].includes(m.type())) errors.push(m.text()); });
    page.on('request', r => { requests.push(r.url()); if (/^https?:/.test(r.url()) && !r.url().startsWith(base + '/')) remote.push(r.url()); });
    const cdp = await page.createCDPSession(); await cdp.send('Network.enable');
    await cdp.send('Network.setBlockedURLs', { urlPatterns: [{ urlPattern: base + '/*', block: false }], urls: ['http://*', 'https://*'] });
    await page.evaluateOnNewDocument(() => {
      if (!localStorage.getItem('laffinee_ui_state')) localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' }));
      window.__qaWorkers = { created: 0, terminated: 0 };
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(...args) { super(...args); window.__qaWorkers.created++; }
        terminate() { window.__qaWorkers.terminated++; return super.terminate(); }
      };
    });
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());
    assert((await page.title()).includes('banc QA')); assert(!(await page.$('vite-error-overlay')));
    if (process.env.HOP_QA_PROBE) {
      await page.evaluate(() => window.__hopQa.seedRecipe(window.__hopQa.recipe()));
      await click(page, 'Recettes', true);
      await click(page, 'Test houb', true);
      await openHopSimulation(page);
      await capture(page, 'probe');
      await writeFile(resolve(out, 'probe.txt'), await page.evaluate(() => document.body.innerText));
      console.log(JSON.stringify({ errors, remoteRequests: remote }));
      continue;
    }
    // Extended assertions are kept in this single compiled-browser flow below.
    await click(page, 'Recettes', true);
    await click(page, '+ Recette', true);
    await page.locator('#wz-title').fill(`QA recette ${width}`);
    await capture(page, `creation-${width}`, '#wz-title');
    await click(page, 'Houblons', true);
    await fillCombobox(page, '[aria-label^="Ajouter un houblon"]', 'Cascade');
    await chooseOption(page, 'Cascade');
    await openHopSimulation(page);
    await page.locator('[aria-label="Alpha de Cascade en pourcent"]').fill('6.2');
    await page.locator('[aria-label="Quantité en g"]').fill('48');
    await page.locator('[aria-label="Minutes avant la fin pour Cascade"]').fill('10');
    await page.keyboard.press('Tab');
    const initialConditions = await page.$eval('[aria-label="Simulation de mes ajouts"]', e => e.textContent);
    await page.locator('[aria-label="Minutes avant la fin pour Cascade"]').fill('15'); await page.keyboard.press('Tab');
    assert.notEqual(await page.$eval('[aria-label="Simulation de mes ajouts"]', e => e.textContent), initialConditions, 'Changing contact updates the actual result');
    await page.locator('[aria-label="Minutes avant la fin pour Cascade"]').fill('10'); await page.keyboard.press('Tab');
    await capture(page, `saisie-${width}`);
    await click(page, 'Levure et fermentation');
    await page.locator('[aria-label="Rechercher une levure"]').fill('SafAle US-05');
    await page.locator('[aria-label="Comparer SafAle US-05"]').click();
    await click(page, 'Appliquer le scénario');
    await click(page, 'Houblons', true);
    await page.waitForFunction(() => document.querySelector('[aria-label="Simulation de mes ajouts"]')?.textContent.includes('SafAle US-05'));
    const varietyId = await page.evaluate(() => window.__hopQa.partialCoa());
    await details(page, 'Lots, COA et conditions de contact');
    await selectField(page, 'Référence documentaire de l’ajout 1', varietyId);
    await selectField(page, 'Lot de l’ajout 1', 'qa-partial-coa');
    await capture(page, `coa-associe-${width}`, '[aria-label="Guide aromatique de la recette"]');
    await details(page, 'Lots, COA et conditions de contact', false);
    const referenceRequests = requests.length, referenceWrites = await page.evaluate(() => window.__hopQa.metrics.writes), referenceCalls = await page.evaluate(() => window.__hopQa.calls.length);
    for (const [all, cumulative] of [[false, false], [true, false], [true, true], [false, true]]) {
      await checkbox(page, 'Toutes les saveurs et la chimie', all);
      await checkbox(page, 'Cumuler tous les ajouts', cumulative);
      assert.equal(!!(await page.$('[aria-label="Chimie des ajouts simulés"]')), all);
      await capture(page, `cases-${Number(all)}${Number(cumulative)}-${width}`);
      if (all && cumulative) {
        await capture(page, `chimie-${width}`, '[aria-label="Chimie des ajouts simulés"]');
        assert.match(await page.$eval('[aria-label="Chimie des ajouts simulés"]', e => e.textContent), /2[\s ]?880–3[\s ]?360 mg/, 'Partial COA alpha 48g × 6–7% = 2880–3360mg');
      }
    }
    assert.equal(await page.evaluate(() => window.__hopQa.metrics.writes), referenceWrites, 'Simulation writes');
    assert.equal(await page.evaluate(() => window.__hopQa.calls.length), referenceCalls, 'Simulation callable attempts');
    assert.equal(requests.length, referenceRequests, 'Simulation requests, even local');
    // Real production Worker, quick search, explicit stop, invalidation and navigation.
    await click(page, 'Trouver mon combo');
    const beforeSearch = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length }));
    const quickStart = performance.now();
    await click(page, 'Trouver mes combinaisons'); await solverIdle(page);
    const quickMs = performance.now() - quickStart;
    assert(await page.$('[aria-label="Programme proposé par le solver"]'), 'Quick search returns a usable proposal');
    await capture(page, `recherche-${width}`, '[aria-label="Programme proposé par le solver"]');
    await selectField(page, 'Étendue de la recherche', 'exhaustive');
    await click(page, 'Trouver mes combinaisons'); await click(page, 'Arrêter la recherche'); await solverIdle(page);
    const stoppedWorkers = await page.evaluate(() => window.__qaWorkers.terminated);
    assert(stoppedWorkers > 0, 'Stop terminates the real Worker');
    await click(page, 'Trouver mes combinaisons');
    await click(page, 'Agrumes'); await solverIdle(page);
    await page.evaluate(() => new Promise(r => setTimeout(r, 250)));
    assert.equal(await page.$('[aria-label="Programme proposé par le solver"]'), null, 'No stale proposal after context change');
    await click(page, 'Trouver mes combinaisons');
    const navStart = performance.now(); await click(page, 'Levure et fermentation');
    await page.waitForSelector('[aria-label="Rechercher une levure"]');
    const navigationMs = performance.now() - navStart;
    assert(navigationMs < 1000, 'Navigation stays responsive during exhaustive search');
    assert((await page.evaluate(() => window.__qaWorkers.terminated)) > stoppedWorkers, 'Navigation cancels Worker');
    assert.deepEqual(await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length })), beforeSearch, 'Search never persists or calls a backend');
    await click(page, 'Houblons', true); await openHopSimulation(page);
    await checkbox(page, 'Cumuler tous les ajouts', true);
    await page.evaluate(() => window.__hopQa.failNext());
    await click(page, 'Conserver le programme pour une dégustation');
    await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some(e => e.textContent.includes('confirmation de persistance refusée')));
    await capture(page, `persistance-refusee-${width}`);
    const snapshots = await page.evaluate(() => window.__hopQa.storage.getHopPredictions().length);
    await click(page, 'Conserver le programme pour une dégustation');
    await page.waitForFunction(() => document.body.innerText.includes('Simulation conservée avec ses conditions'));
    assert.equal(await page.evaluate(() => window.__hopQa.storage.getHopPredictions().length), snapshots, 'Retry duplicate');
    await click(page, 'Récapitulatif', true); await click(page, 'Enregistrer la recette');
    await page.waitForFunction(name => window.__hopQa.storage.getRecipes().some(r => r.name === name), {}, `QA recette ${width}`);
    const saved = await page.evaluate(name => window.__hopQa.storage.getRecipes().find(r => r.name === name), `QA recette ${width}`);
    assert.equal(saved.hops[0].name, 'Cascade'); assert.equal(saved.hops[0].weightG, 48); assert.equal(saved.hops[0].timeMin, 10); assert.equal(saved.yeast.name, 'SafAle US-05');
    assert.equal(saved.hops[0].hopLotId, 'qa-partial-coa');
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForFunction(() => window.__hopQa?.ready());
    await click(page, 'Recettes', true); await click(page, `QA recette ${width}`, true);
    await openHopSimulation(page);
    assert.equal(await page.$$eval('[aria-label="Potentiel aromatique de la recette"] input:not([type="checkbox"]),[aria-label="Potentiel aromatique de la recette"] textarea', e => e.length), 0);
    await capture(page, `lecture-${width}`);
    await checkbox(page, 'Toutes les saveurs et la chimie', true);
    const coaProof = await verifyGraph(page, saved, false);
    assert.deepEqual(coaProof.raw.chemistry.introduced.alpha.range, { min: 2880, max: 3360 });
    assert.equal(coaProof.raw.chemistry.introduced.totalOil.range, null, 'Variety oil of unspecified form is documentary, not an invented mass');
    assert(coaProof.raw.chemistry.introduced.totalOil.sources.some(s => s.author === 'Hopsteiner'), 'Unmeasured lot oil preserves manufacturer fallback evidence');
    await checkbox(page, 'Toutes les saveurs et la chimie', false);
    await openAdvancedAnalysis(page);
    await click(page, 'Explorer une variante');
    await capture(page, `variante-${width}`, '[aria-label="Simulateur aromatique expérimental"]');
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(r => r.id === id), saved.id), saved, 'Readonly variant mutated recipe');
    await back(page);
    const scientific = await page.evaluate(() => { const r = window.__hopQa.documented(); window.__hopQa.seedRecipe(r); return r; });
    await click(page, 'Cascade documenté', true); await openHopSimulation(page);
    await checkbox(page, 'Toutes les saveurs et la chimie', true);
    const documented = await verifyGraph(page, scientific, false);
    assert(documented.checked.some(c => c.range && c.range.max - c.range.min < 20), 'Documented bounded output actually displayed');
    await openAdvancedAnalysis(page);
    await capture(page, `documente-${width}`);
    await details(page, 'Calcul et portée du résultat');
    await page.$$eval('summary', els => els.find(e => e.textContent.includes('Calcul et portée du résultat')).parentElement.setAttribute('data-qa-open-calculation', 'true'));
    await capture(page, `details-${width}`, '[data-qa-open-calculation]');
    await click(page, 'Explorer une variante');
    const comparisonBefore = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length }));
    const comparisonRequests = requests.length;
    await click(page, 'Garder ce graphe pour comparer');
    await fillVisibleInput(page, '[aria-label="Simulateur aromatique expérimental"] [aria-label="Dose (g/L)"]', '2');
    if (width < 640) assert.equal(await page.$$eval('.brewer-global-companion', elements => elements.filter(element => element.getClientRects().length).length), 0, 'Typing must not restore a floating control over the graph');
    await page.keyboard.press('Tab');
    const comparisonProof = await page.evaluate(scientific => {
      const qa = window.__hopQa, old = qa.raw(scientific, false).additions[0];
      const current = qa.rawTriplet({ ...old.triplet, doseGL: 2, matrixId: null }, scientific.hopAromaTarget);
      const root = document.querySelector('[aria-label="Simulateur aromatique expérimental"]');
      const issues = [], axes = qa.axes();
      if (!root.textContent.includes('Trait inférieur : comparaison conservée')) issues.push('Missing retained legend');
      for (const axis of axes) {
        const group = root.querySelector(`[data-axis="${axis.id}"]`);
        for (const [kind,prediction,selector] of [['retained',old,'circle[data-aroma-baseline]'],['current',current,'[data-aroma-point]']]) {
          const estimate=prediction.profile[axis.id],range=estimate?.range,marker=group?.querySelector(selector);
          const known=range&&!(range.min<=axis.lowMax&&range.max>axis.mediumMax)&&Number.isFinite(estimate.central);
          if(!known&&marker)issues.push(axis.id+': unresolved '+kind+' drawn');
          if(known&&!marker)issues.push(axis.id+': missing '+kind+' marker');
          if(known&&marker){
            const radius=Math.hypot(Number(marker.getAttribute('cx'))-220,Number(marker.getAttribute('cy'))-190);
            const expected=92*(estimate.central-axis.scale.min)/(axis.scale.max-axis.scale.min);
            if(Math.abs(radius-expected)>1e-5)issues.push(axis.id+': wrong '+kind+' geometry');
          }
        }
      }
      return { issues, retainedBands: root.querySelectorAll('.aroma-interval-baseline').length };
    }, scientific);
    assert.deepEqual(comparisonProof.issues, []);
    assert(comparisonProof.retainedBands > 0, 'Actual published baseline retained across a condition change');
    await capture(page, `comparaison-${width}`, '[aria-label="Simulateur aromatique expérimental"]');
    await capture(page, `comparaison-radar-${width}`, '[aria-label="Simulateur aromatique expérimental"] [aria-label="Graphe de la prédiction expérimentale"]');
    await click(page, 'Effacer la comparaison');
    if (width < 640) {
      await page.waitForFunction(() => !!document.querySelector('[data-inline-companion]')?.getClientRects().length);
      assert.equal(await page.$$eval('.brewer-global-companion', elements => elements.filter(element => element.getClientRects().length).length), 0, 'Reserved companion restored after typing');
    }
    assert.equal(await page.$$eval('[aria-label="Simulateur aromatique expérimental"] [data-aroma-baseline]', e => e.length), 0);
    assert.deepEqual(await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length })), comparisonBefore);
    assert.equal(requests.length, comparisonRequests, 'Comparison stays local');
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(r => r.id === id), scientific.id), scientific, 'Comparison changed the saved recipe');
    await back(page);
    const twenty = await page.evaluate(() => { const r = { ...window.__hopQa.recipe(20), id: 'qa-twenty', name: 'Vingt ajouts' }; window.__hopQa.seedRecipe(r); return r; });
    await click(page, 'Vingt ajouts', true); await openHopSimulation(page);
    const beforeTwenty = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length }));
    const twentyRequests = requests.length;
    await checkbox(page, 'Toutes les saveurs et la chimie', true);
    const updateMs = await page.evaluate(async () => {
      const start = performance.now(); document.querySelector('input[aria-label="Cumuler tous les ajouts"]').click();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - start;
    });
    assert(updateMs < 500, `Twenty-addition update: ${updateMs.toFixed(1)}ms`);
    const twentyProof = await verifyGraph(page, twenty, true);
    await capture(page, `cumul-20-${width}`);
    assert.deepEqual(await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes, calls: window.__hopQa.calls.length })), beforeTwenty);
    assert.equal(requests.length, twentyRequests);
    const checkboxOrder = await page.$$eval('[aria-label="Simulation de mes ajouts"] input[type="checkbox"]', elements => elements
      .filter(element => element.getClientRects().length)
      .map(element => ({ label: element.getAttribute('aria-label'), tabIndex: element.tabIndex, disabled: element.disabled })));
    assert.deepEqual(checkboxOrder.slice(0, 2).map(element => element.label), ['Toutes les saveurs et la chimie', 'Cumuler tous les ajouts'], 'Keyboard focus order');
    assert(checkboxOrder.slice(0, 2).every(element => element.tabIndex === 0 && !element.disabled), 'Simulation toggles stay keyboard-focusable');
    await back(page);
    for (const confidence of ['medium', 'high']) {
    const synthetic = await page.evaluate(confidence => window.__hopQa.syntheticConfidence(confidence), confidence);
    await click(page, 'Contrôle synthétique de confiance', true); await openHopSimulation(page);
    await checkbox(page, 'Toutes les saveurs et la chimie', true);
    const confidenceProof = await verifyGraph(page, synthetic, false);
    assert(confidenceProof.checked.some(c => c.axis === 'qa-citrus' && c.confidence === (confidence === 'medium' ? 'moyenne' : 'élevée')), 'Actual model confidence rendered');
    await capture(page, `confiance-${confidence}-${width}`); await back(page);
    }
    reports.push({ width, errors, remoteRequests: remote.length, simulationWrites: 0, simulationRequests: 0, updateTwentyMs: updateMs, quickSearchMs: quickMs, navigationMs, partialCoaPreserved: true, searchCancellation: true, staleResultDiscarded: true,
      documented: documented.checked, comparison: comparisonProof, twenty: twentyProof.checked, savedHops: saved.hops.length, persistenceRetryIdempotent: true });
    console.log(`QA ${width}px: creation, toggles, persistence, reload, documented graph, twenty additions ${updateMs.toFixed(1)}ms.`);
    assert.deepEqual(errors, []); assert.equal(remote.length, 0);
    await context.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify(reports, null, 2));
} catch (error) {
  if (active && !active.isClosed()) { await active.screenshot({ path: resolve(out, 'failure.png'), fullPage: true }); await writeFile(resolve(out, 'failure.txt'), await active.evaluate(() => document.body.innerText)); }
  throw error;
} finally { await browser.close(); await new Promise(r => server.close(r)); }
