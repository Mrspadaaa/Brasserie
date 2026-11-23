// Fixture-only browser exercise of the real App. Never imports production data or writes remotely.
// The Browser plugin is not available here; reuse the repository's isolated QA build and Puppeteer.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';

const buildDir = resolve(tmpdir(), 'laffinee-hop-qa-ux-mobile-poc');
const evidenceDir = resolve(process.env.UX_POC_EVIDENCE_DIR ?? resolve(tmpdir(), 'laffinee-ux-mobile-poc-evidence'));
if (!process.argv.includes('--reuse-build')) await buildHopRecipeQa(buildDir);
await mkdir(evidenceDir, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(buildDir, pathname === '/' ? 'tests/qa/hop-recipe/index.html' : `.${pathname}`);
    if (!file.startsWith(`${buildDir}${sep}`)) { response.writeHead(403); response.end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const evidence = [], checks = [];
const clickButton = async (page, label, contains = false) => {
  const found = await page.waitForFunction((label, contains) => [...document.querySelectorAll('button')]
    .find(button => button.getClientRects().length && !button.disabled && (contains ? button.textContent.trim().includes(label) : button.textContent.trim() === label)), {}, label, contains);
  await found.asElement().evaluate(element => element.scrollIntoView({ block: 'center' }));
  await found.asElement().click();
  await found.dispose();
};
const clickStep = async (page, label) => {
  const found = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')]
    .find(button => button.getClientRects().length && button.getAttribute('aria-label') === label), {}, label);
  await found.asElement().click();
  await found.dispose();
};
const clickVisibleSelector = async (page, selector) => {
  const found = await page.waitForFunction(selector => [...document.querySelectorAll(selector)]
    .find(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'), {}, selector);
  await found.asElement().click();await found.dispose();
};
const clickScopedButton = async (page, selector, label) => {
  const found = await page.waitForFunction((selector, label) => [...(document.querySelector(selector)?.querySelectorAll('button') ?? [])]
    .find(button => !button.disabled && !button.closest('details:not([open])') && button.getClientRects().length && button.textContent.trim() === label), {}, selector, label);
  await found.asElement().evaluate(element => element.scrollIntoView({ block: 'center' }));
  await found.asElement().click();
  await found.dispose();
};
const openYeastCatalogue = async page => {
  const search=await page.waitForSelector('.yeast-picker-search',{visible:true});
  await search.evaluate(node=>node.scrollIntoView({block:'center'}));await search.focus();await search.dispose();
  const browse=await page.evaluateHandle(()=>[...document.querySelectorAll('.yc-catalogue button')]
    .find(node=>node.getClientRects().length&&node.textContent.includes('Parcourir le catalogue')));
  if(browse.asElement())await browse.asElement().click();await browse.dispose();
};
const settle = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const navigate = async (page, tab) => {
  await page.evaluate(tab => window.__hopQa.storage.setUiState('app_active_tab', tab), tab);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__hopQa?.ready());
};
const openEditRecipe = async (page, name) => {
  await navigate(page, 'production');
  await clickButton(page, 'Recettes', true);
  const selector = `[aria-label="Modifier la recette ${name}"]`;
  await page.waitForSelector(selector);
  const edit = await page.$(selector);
  const summary = await edit.evaluateHandle(button => {
    const parent = button.closest('details');
    return parent && !parent.open ? parent.querySelector('summary') : null;
  });
  if (summary.asElement()) await summary.asElement().click();
  await page.$eval(selector, button => button.scrollIntoView({ block: 'center' }));
  await page.locator(selector).click();
  await page.waitForSelector('.recipe-wizard', { timeout: 12000 }).catch(async () => {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 2200));
    await page.screenshot({ path: resolve(evidenceDir, `debug-open-${name.replaceAll(' ', '-')}.png`) });
    throw Error(`L’éditeur de ${name} ne s’ouvre pas : ${body}`);
  });
};
const capture = async (page, name, width, selector) => {
  if (selector) {
    const target = await page.waitForSelector(selector, { visible: true, timeout: 10000 }).catch(async () => {
      const body = await page.evaluate(() => document.body.innerText.slice(0, 2200));
      await page.screenshot({ path: resolve(evidenceDir, `debug-${name}-${width}.png`) });
      throw Error(`${name}: ${selector} absent ; écran : ${body}`);
    });
    await target.evaluate((element, centered) => element.scrollIntoView({ block: centered ? 'center' : 'start' }),
      name === 'eau-essai' || name === 'fermentation-frise' || name === 'levure-m20-ia-conflits');
  }
  await settle(page);
  const facts = await page.evaluate(() => ({
    title: document.title,
    text: document.body.innerText.slice(0, 4000),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    frameworkOverlay: Boolean(document.querySelector('vite-error-overlay, [data-vite-dev-id], #webpack-dev-server-client-overlay')),
    width: innerWidth,
  }));
  assert(page.url().startsWith(`${origin}/`), `${name}: mauvaise page`);
  assert.match(facts.title, /L[’']Affinée/, `${name}: titre inattendu`);
  assert(facts.text.trim().length > 100, `${name}: écran vide`);
  assert.equal(facts.overflow, false, `${name}: débordement horizontal`);
  assert.equal(facts.frameworkOverlay, false, `${name}: erreur de framework`);
  const file = resolve(evidenceDir, `${name}-${width}.png`);
  await page.screenshot({ path: file });
  evidence.push({ name, file, ...facts });
};
const seed = page => page.evaluate(() => window.__hopQa.seedMobilePoc());
// Replays a small, separately opted-in set of PUBLIC provider responses through
// the actual UI. The browser has no provider transport and performs no paid call.
const checkCapturedAutocomplete = async (page, width) => {
  assert(process.env.YEAST_CAPTURED_RESPONSE_FILE, 'Fichier de réponses publiques requis');
  const source = JSON.parse(await readFile(resolve(process.env.YEAST_CAPTURED_RESPONSE_FILE), 'utf8'));
  const rows = source.results.filter(row => row.status === 200 && !row.error && !row.validationError && row.data?.found);
  assert.equal(rows.length, 3, 'Trois réponses réelles validées attendues');
  for (const [index, row] of rows.entries()) {
    const id = `qa-live-autocomplete-${index}`;
    const name = `QA autocomplete ${index + 1}`;
    const subject = row.requestedName;
    const hypothesis = index === 2 ? undefined : 73;
    const before = await page.evaluate(({ id, name, subject, hypothesis }) => {
      const base = window.__hopQa.storage.getRecipes().find(recipe => recipe.id === 'qa-poc-yeast');
      const recipe = { ...base, id, name, yeast: { name: subject, qty: 1, unit: 'sachet',
        notes: 'NOTE_OPERATIONNELLE_QA_CONSERVER', attenuationPct: hypothesis, attenuationBasis: 'recipe' },
        yeastDesign: undefined, yeastGuide: undefined };
      window.__hopQa.storage.addRecipe(recipe);
      return recipe;
    }, { id, name, subject, hypothesis });
    await openEditRecipe(page, name); await clickStep(page, 'Levure');
    await page.evaluate(({subject,data}) => window.__hopQa.yeast.setLookupResponse(subject,data), {subject,data:row.data});
    const sheet = '.yc-sheet-fold[data-sheet-scope="recipe"]';
    await page.waitForSelector(sheet,{visible:true});
    if (!await page.$eval(sheet,node=>node.open)) await page.click(`${sheet} > summary`);
    const lookup = await page.waitForFunction(selector => [...document.querySelectorAll(`${selector} button`)]
      .find(node=>node.getClientRects().length && /Rechercher la fiche|Enrichir la fiche|Compléter avec l|Contrôler.*fiche/i.test(node.textContent)),{},sheet);
    await lookup.asElement().click(); await lookup.dispose();
    const cited = new URL(row.data.sourceUrl);
    if (cited.pathname === '/' && !cited.search && !cited.hash) {
      await page.waitForFunction(selector=>/sources documentaires|source documentaire/i.test(document.querySelector(selector)?.textContent??''),{},sheet);
      assert.equal(await page.$('.yc-review-primary'),null,'Une réponse sans source localisée ne peut être adoptée');
      const unchanged=await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id),id);
      assert.deepEqual(unchanged.yeast,before.yeast,'Aucun champ sauvegardé par le lookup refusé');
      await capture(page,`autocomplete-${index+1}-source-refusee`,width,sheet);
      checks.push({name:'autocomplete-source-refusee',width,subject,raw:row.data,unchanged:true,providerCalls:0});
      continue;
    }
    await page.waitForSelector('[data-review-found]',{visible:true});
    const identity = await page.$('.yc-review-identity button');
    if (identity) { await identity.click(); await settle(page); }
    const request = await page.evaluate(() => window.__hopQa.calls.length && window.__hopQa.nolo.inputs.filter(row=>row.name==='aiTask').at(-1));
    await capture(page,`autocomplete-${index+1}-proposition`,width,sheet);
    const beforeAccept = await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id),id);
    assert.deepEqual(beforeAccept.yeast,before.yeast,'La recherche ne sauvegarde aucun champ');
    const primary = await page.$('.yc-review-primary:not(:disabled)');
    if(primary) { await primary.click(); await settle(page); }
    // Explicit decisions on each exception; no AI verification loop. A source
    // can offer several observations: choosing one never discards the others.
    for(let turn=0;turn<18;turn++) {
      const accept = await page.waitForFunction(()=>[...document.querySelectorAll('[data-review-gap] button')]
        .find(node=>node.getClientRects().length && !node.disabled && /^Prendre /.test(node.textContent.trim())),{timeout:500}).catch(()=>null);
      if(!accept) break;
      await accept.asElement().evaluate(node=>node.scrollIntoView({block:'center'}));
      await accept.asElement().click(); await accept.dispose(); await settle(page);
    }
    await capture(page,`autocomplete-${index+1}-retenu`,width,sheet);
    assert.equal(await page.$$eval('[data-review-gap]',nodes=>nodes.filter(node=>node.getClientRects().length).length),0,'Chaque écart proposé a reçu une décision explicite');
    if(index===2) {
      const field='[aria-label="Atténuation retenue pour cette recette, en pourcent"]';
      await page.waitForSelector(field,{visible:true});
      const state=await page.$eval(field,node=>({value:node.value,placeholder:node.placeholder}));
      assert.equal(state.value,'','Le point moyen73 de la réponse ne devient pas une hypothèse');
      assert.match(state.placeholder,/fiche 70[–-]76/,'Plage documentée visible sans remplir le scalaire');
      await capture(page,'hypothese-vide-plage-documentee',width,field);
      await page.$eval(field,node=>node.scrollIntoView({block:'center'}));
      await page.click(field);await page.keyboard.type('72,5');await page.keyboard.press('Tab');
    }
    await clickStep(page,'Récapitulatif'); await clickButton(page,'Enregistrer la recette');
    await page.waitForSelector(`[aria-label="Ouvrir la recette ${name}"]`,{visible:true});
    const saved = await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id),id);
    assert.equal(saved.yeast.qty,1); assert.equal(saved.yeast.unit,'sachet');
    assert.equal(saved.yeast.notes,'NOTE_OPERATIONNELLE_QA_CONSERVER');
    assert.equal(saved.yeast.attenuationPct,index===2?72.5:hypothesis); assert.equal(saved.yeast.attenuationBasis,'recipe');
    assert.equal(saved.yeast.stockItemRef,undefined);
    assert(saved.yeast.technicalFacts?.length,'Observations sourcées effectivement retenues');
    if(index===2) {
      const body=saved.yeast.localDocumentary??saved.yeast.adoptedDocumentary;
      await writeFile(resolve(evidenceDir,`adoption-3638-${width}.json`),JSON.stringify({saved,raw:row.data,request},null,2));
      const evidence=body?.technicalSelections?.flocculation??body?.technicalFacts?.find(fact=>fact.key==='flocculation');
      assert.equal(evidence?.origin,'ai','Le fait de floculation conserve son origine IA');
      assert.equal(evidence?.sourceUrl,row.data.sourceUrl);
    }
    await openEditRecipe(page,name); await clickStep(page,'Levure');
    await page.waitForSelector(sheet,{visible:true});
    if(!await page.$eval(sheet,node=>node.open))await page.click(`${sheet} > summary`);
    await capture(page,`autocomplete-${index+1}-reouvert`,width,sheet);
    if(index===2) {
      const floc=await page.$eval('[aria-label="Floculation"]',node=>node.innerText);
      assert.match(floc,/Low/);assert.match(floc,/Recherche IA/);assert(!floc.includes('Donnée personnelle'),'Pas de provenance personnelle fabriquée');
    }
    const reloaded = await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id),id);
    assert.deepEqual(reloaded,saved,'Recette entière identique après réouverture');
    checks.push({name:'autocomplete-reponse-reelle',width,subject,request,raw:row.data,saved,reopened:reloaded,providerCalls:0});
  }
};
// Folded stations open through their visible toggle, never by forcing hidden controls.
const openStation = async (target, fold) => {
  const toggle = await target.waitForSelector(`[data-station-toggle="${fold}"]`, { visible: true });
  if (await toggle.evaluate(node => node.getAttribute('aria-expanded') !== 'true')) {
    await toggle.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await toggle.click();
  }
  await target.waitForFunction(fold => {
    const node = document.querySelector(`[data-station-toggle="${fold}"]`);
    const body = node && document.getElementById(node.getAttribute('aria-controls'));
    return node?.getAttribute('aria-expanded') === 'true' && Boolean(body?.getClientRects().length);
  }, {}, fold);
  await toggle.dispose();
};
const foldState = target => target.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-station-toggle]')].map(node => [node.dataset.stationToggle, {
  expanded: node.getAttribute('aria-expanded'), text: node.innerText.replace(/\s+/g, ' ').trim(),
  bodyVisible: Boolean(document.getElementById(node.getAttribute('aria-controls'))?.getClientRects().length) }])));
const programmeState = target => target.$$eval('[aria-label="Programme proposé"] ol > li', rows => rows.map(row => ({
  start: row.dataset.phaseStart, days: row.dataset.phaseDays, temp: row.dataset.phaseTemp })));
// Real gesture on the chart handle: touchscreen at 390 px, mouse at 1280 px. Offsets come from the scale the chart publishes.
const dragHandle = async (target, width, selector, { days = 0, temp = 0 }) => {
  const handle = await target.waitForSelector(selector, { visible: true });
  await handle.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await settle(target);
  const g = await handle.evaluate(node => {
    const svg = node.closest('figure').querySelector('svg[data-plot-left]');
    const rect = svg.getBoundingClientRect(), box = node.getBoundingClientRect(), view = svg.viewBox.baseVal, d = svg.dataset;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2,
      perDay: (Number(d.plotRight) - Number(d.plotLeft)) / Number(d.scaleEndDay) * rect.width / view.width,
      perDegree: (Number(d.plotBottom) - Number(d.plotTop)) / (Number(d.scaleMax) - Number(d.scaleMin)) * rect.height / view.height };
  });
  const endX = g.x + days * g.perDay, endY = g.y - temp * g.perDegree, steps = 10;
  const scrollBefore = await target.evaluate(() => scrollY);
  let during, scrollDuring;
  if (width < 600) {
    await target.touchscreen.touchStart(g.x, g.y);
    for (let step = 1; step <= steps; step++) {
      await target.touchscreen.touchMove(g.x + (endX - g.x) * step / steps, g.y + (endY - g.y) * step / steps);
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    during = await target.$eval('[data-chart-readout]', node => node.textContent);
    scrollDuring = await target.evaluate(() => scrollY);
    await target.touchscreen.touchEnd();
  } else {
    await target.mouse.move(g.x, g.y); await target.mouse.down();
    for (let step = 1; step <= steps; step++) await target.mouse.move(g.x + (endX - g.x) * step / steps, g.y + (endY - g.y) * step / steps);
    during = await target.$eval('[data-chart-readout]', node => node.textContent);
    scrollDuring = await target.evaluate(() => scrollY);
    await target.mouse.up();
  }
  assert.equal(scrollDuring, scrollBefore, 'Le geste sur la poignée ne fait pas défiler la page');
  await handle.dispose();
  await settle(target);
  return during;
};
const comparisonSection = '[aria-label="Comparaison des levures"]';
const comparedScroller = `${comparisonSection} [aria-label="Colonnes comparées"]`;
const clickCentered = async (target, selector) => {
  const element = await target.waitForSelector(selector, { visible: true });
  await element.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await element.click();
  await element.dispose();
};
const setSearch = async (target, value) => {
  await target.click('.yeast-picker-search');
  await target.keyboard.down('Control'); await target.keyboard.press('A'); await target.keyboard.up('Control');
  await target.keyboard.type(value);
};
// An alternative only enters the comparison by an explicit tick; its label is the visible touch target.
const tickAlternative = async (target, checkbox) => {
  if (await checkbox.evaluate(input => input.checked)) return;
  const label = await checkbox.evaluateHandle(input => input.closest('label') ?? input);
  await label.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await label.asElement().click();
  await label.dispose();
  await target.waitForFunction(input => input.checked, {}, checkbox);
};
const compareSearch = async (target, query) => {
  await setSearch(target, query);
  const checkbox = await target.waitForFunction(query => [...document.querySelectorAll('.yc-list input[type="checkbox"][aria-label^="Comparer "]')]
    .find(input => input.getClientRects().length && !input.disabled && input.getAttribute('aria-label').includes(query)), {}, query);
  await tickAlternative(target, checkbox.asElement());
  await checkbox.dispose();
};
// Horizontal reading of the side by side: share of each alternative visible beside the reference column.
const comparedColumns = target => target.$eval(comparedScroller, scroller => {
  const box = scroller.getBoundingClientRect(), referenceCell = scroller.querySelector('th[data-role="reference"]');
  const reference = referenceCell?.getBoundingClientRect();
  const floor = reference ? Math.max(box.left, Math.min(reference.right, box.right)) : box.left;
  return {
    overflow: scroller.scrollWidth > scroller.clientWidth + 1, scrollLeft: Math.round(scroller.scrollLeft),
    maxScroll: Math.round(scroller.scrollWidth - scroller.clientWidth),
    position: scroller.closest('section')?.querySelector('.yc-compare-nav .yeast-small')?.textContent.trim() ?? null,
    reference: referenceCell ? { id: referenceCell.dataset.candidateId ?? null, label: referenceCell.querySelector('strong')?.textContent.trim() ?? '',
      text: referenceCell.innerText, pinned: reference.left >= box.left - 1 && reference.right <= box.right + 1 } : null,
    alternatives: [...scroller.querySelectorAll('th[data-role="alternative"]')].map(cell => {
      const rect = cell.getBoundingClientRect();
      return { id: cell.dataset.candidateId, label: cell.querySelector('strong')?.textContent.trim() ?? '',
        shown: Math.round(Math.max(0, Math.min(rect.right, box.right) - Math.max(rect.left, floor)) / rect.width * 100) / 100 };
    }),
  };
});
const settleColumns = target => target.$eval(comparedScroller, scroller => new Promise(done => {
  let last = NaN, still = 0;
  const tick = () => { still = scroller.scrollLeft === last ? still + 1 : 0; last = scroller.scrollLeft; if (still > 5) done(); else requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}));
// Real horizontal gesture on the columns: a touchscreen swipe at 390 px, a mouse wheel at 1280 px.
const swipeColumns = async (target, width, towardEnd) => {
  const scroller = await target.$(comparedScroller);
  await scroller.evaluate(element => element.scrollIntoView({ block: 'center' }));
  const box = await scroller.boundingBox(), { height } = target.viewport(), before = await scroller.evaluate(element => element.scrollLeft);
  // Start well inside the scroller: a left-edge swipe is Chrome's page-back gesture.
  const x = Math.round(box.x + box.width * (towardEnd ? 0.75 : 0.25));
  const y = Math.round(Math.min(Math.max(height / 2, box.y + 12), box.y + box.height - 12));
  if (width < 600) {
    const endX = Math.round(box.x + box.width * (towardEnd ? 0.25 : 0.75));
    for (let swipe = 0; swipe < 4; swipe++) {
      await target.touchscreen.touchStart(x, y);
      for (let step = 1; step <= 8; step++) {
        await target.touchscreen.touchMove(Math.round(x + (endX - x) * step / 8), y);
        await new Promise(resolve => setTimeout(resolve, 16));
      }
      await target.touchscreen.touchEnd();
      try { await settleColumns(target); }
      catch (error) {
        const state = await target.evaluate(() => ({ title: document.title, step: document.querySelector('nav[aria-label="Étapes"] [aria-current="step"]')?.textContent,
          comparison: Boolean(document.querySelector('[aria-label="Comparaison des levures"]')), body: document.body.innerText.slice(0, 350) }));
        await target.screenshot({ path: resolve(evidenceDir, `debug-touch-${width}.png`) });
        throw new Error(`Le geste tactile a quitté le comparatif : ${JSON.stringify({ x, y, box, state })}`, { cause: error });
      }
      if (await scroller.evaluate(element => element.scrollLeft >= element.scrollWidth - element.clientWidth - 2)) break;
    }
    const after = await scroller.evaluate(element => element.scrollLeft);
    assert(towardEnd ? after > before : after < before,
      `Le glissement tactile doit déplacer les colonnes dans le sens demandé : ${before} → ${after}`);
    await scroller.dispose();
    return 'touch';
  }
  {
    await target.mouse.move(x, y); await target.mouse.wheel({ deltaX: Math.round(box.width * 2) * (towardEnd ? 1 : -1) });
    await settleColumns(target);
  }
  await scroller.dispose();
  return 'wheel';
};

// Focused proof of the business outcome, independent of manual graph edits.
// Run with --guidance-only to avoid replaying the five already verified paths.
const tryYeast = async (target, query) => {
  await setSearch(target, query);
  const action = await target.waitForFunction(query => [...document.querySelectorAll('button[aria-label^="Essayer "]')]
    .find(button => button.getClientRects().length && !button.disabled && button.getAttribute('aria-label').includes(query)), {}, query);
  await action.asElement().click();
  await action.dispose();
  await target.waitForSelector('[aria-label="Scénario de levure"]', { visible: true });
};
const checkGuidanceDecision = async (page, width) => {
  for (const task of [
    { name: 'Weissbier objectif de contrôle', id: 'qa-poc-yeast-goal', candidate: null, expected: 22, outcome: 'proposed', capture: 'guide-3068-banane' },
    { name: 'Weissbier de contrôle', id: 'qa-poc-yeast', candidate: 'M20', expected: 18, outcome: 'unchanged', capture: 'guide-m20-conserve' },
  ]) {
    await openEditRecipe(page, task.name);
    const before = await page.evaluate(id => structuredClone(window.__hopQa.storage.getRecipes().find(item => item.id === id)), task.id);
    assert.deepEqual(before.fermentation.map(phase => [phase.tempC, phase.days]), [[18, 10], [4, 7]]);
    const frozen = await page.evaluate(id => {
      const storage = window.__hopQa.storage, recipe = storage.getRecipes().find(item => item.id === id);
      return storage.planRecipeBatch(recipe, `QA-GUIDANCE-FROZEN-${id}`).recipeSnapshot;
    }, task.id);
    await clickStep(page, 'Levure');
    if (task.candidate) {
      await openYeastCatalogue(page);
      await setSearch(page,task.candidate);
      const pick='.yc-list [data-choose="yeast-mangrove-jacks-132040951"]';
      await page.waitForSelector(pick,{visible:true});await page.click(pick);
    }
    await openStation(page, 'objectives');
    const goal = await page.waitForFunction(() => [...document.querySelectorAll('label')]
      .find(label => label.textContent.trim() === 'Profil recherché' && label.control?.getClientRects().length)?.control);
    await goal.asElement().select('banana'); await goal.dispose();
    await clickButton(page, 'Proposer une conduite');
    const selector = '[aria-label="Proposition de conduite"]';
    const proposal = await page.waitForSelector(selector, { visible: true });
    const reading = await proposal.evaluate(element => ({ outcome: element.dataset.outcome, text: element.innerText,
      valueRows: [...element.querySelectorAll('[data-proposal-row="value"]')].map(row => row.innerText),
      noteRows: [...element.querySelectorAll('[data-proposal-row="note"]')].map(row => row.innerText) }));
    assert.equal(reading.outcome, task.outcome, 'Le type de résultat dépend de réglages réels, pas de la présence d’un patch');
    if (task.candidate) {
      assert.equal(reading.valueRows.length, 0, 'M20 : aucune valeur documentée ne justifie un déplacement aromatique');
      assert.match(reading.text, /Aucun réglage propre|Aucun réglage de température plus précis/);
      assert.match(reading.text, /Aucune valeur modifiée/);
    } else {
      assert(reading.valueRows.length > 0, '3068 : une note seule ne valide pas cette preuve');
      assert(reading.valueRows.some(row => /18 °C.*22 °C/s.test(row)), 'Le guide doit proposer réellement 18 → 22 °C');
    }
    const sources = await page.$(`${selector} details.yc-proposal-sources`);
    if (sources && !await sources.evaluate(element => element.open)) await sources.$eval('summary', element => element.click());
    const rationale = await page.$eval(`${selector} .yc-rationale`, element => element.innerText);
    if (!task.candidate) assert.match(rationale, /Consigne éditoriale du guide L’Affinée/);
    await capture(page, `${task.capture}-proposition`, width, selector);
    assert.equal(await page.$eval(':is(input,textarea)[aria-label^="Température du palier 1 ·"]', element => element.value), String(task.expected));
    assert.equal(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id).fermentation[0].tempC, task.id), 18,
      'Proposer n’écrit pas la recette enregistrée');
    await clickButton(page, 'Appliquer au brouillon');
    await clickStep(page, 'Paliers');
    await page.waitForSelector('#wz-ferment-temp-0', { visible: true });
    assert.equal(await page.$eval('#wz-ferment-temp-0', element => element.value), String(task.expected), 'Paliers retrouve la température proposée appliquée');
    assert.equal(await page.$eval('#wz-ferment-days-0', element => element.value), '10', 'La durée existante reste conservée');
    assert.equal(await page.$eval('#wz-ferment-temp-1', element => element.value), '4');
    assert.equal(await page.$eval('#wz-ferment-days-1', element => element.value), '7');
    await capture(page, `${task.capture}-paliers`, width, '[id="wz-ferment-temp-0"]');
    await clickStep(page, 'Récapitulatif');
    await clickButton(page, 'Enregistrer la recette');
    await page.waitForSelector(`[aria-label="Ouvrir la recette ${task.name}"]`, { visible: true });
    await openEditRecipe(page, task.name);
    const saved = await page.evaluate(id => {
      const storage = window.__hopQa.storage;
      return { recipe: storage.getRecipes().find(item => item.id === id),
        frozen: storage.getBatches().find(item => item.id === `QA-GUIDANCE-FROZEN-${id}`).recipeSnapshot };
    }, task.id);
    assert.deepEqual(saved.recipe.fermentation.map(phase => [phase.tempC, phase.days]), [[task.expected, 10], [4, 7]]);
    assert.deepEqual(saved.recipe.hops, before.hops, 'Une cible banane ne réécrit pas les contacts à cru');
    assert.deepEqual(saved.frozen, frozen, 'Le brassin préexistant conserve tout son snapshot');
    assert.equal(saved.recipe.yeastDesign.goal, 'banana');
    if (!task.candidate) {
      assert.equal(saved.recipe.yeast.qty, before.yeast.qty);
      assert.equal(saved.recipe.yeast.unit, before.yeast.unit);
    }
    await clickStep(page, 'Paliers');
    await page.waitForSelector('#wz-ferment-temp-0', { visible: true });
    assert.equal(await page.$eval('#wz-ferment-temp-0', element => element.value), String(task.expected), 'Température exacte après sauvegarde et réouverture');
    const changeNotice = await page.$eval('[aria-label="Levure et conduite liées à la recette"]', element =>
      [...element.querySelectorAll('.yeast-notice')].map(notice => notice.textContent).join('\n'));
    assert.doesNotMatch(changeNotice, /Des réglages ont changé/, 'Un enrichissement de fiche ne se présente pas comme des consignes modifiées');
    if (!task.candidate) assert.match(changeNotice, /fiche.*actualisée.*programme.*conservé/s);
    await capture(page, `${task.capture}-reouvert`, width, '[id="wz-ferment-temp-0"]');
    checks.push({ name: task.capture, width, ...reading, rationale,
      before: before.fermentation.map(phase => [phase.tempC, phase.days]),
      saved: saved.recipe.fermentation.map(phase => [phase.tempC, phase.days]), frozenSnapshotPreserved: true,
      savedRecipe: saved.recipe, changeNotice });
  }
};
const editPhase = async (target,phase,field,value) => {
  const choice=await target.waitForSelector(`.yc-programme [data-phase-choice="${phase-1}"]`,{visible:true});
  await choice.evaluate(node=>node.scrollIntoView({block:'center'}));await choice.click();
  const selector=`:is(input,textarea)[aria-label^="${field} du palier ${phase} ·"]`;
  await target.waitForSelector(selector,{visible:true});await target.click(selector,{clickCount:3});await target.keyboard.press('Backspace');
  if(value!=='')await target.keyboard.type(value);await target.keyboard.press('Tab');
};

const checkDirectChoice = async (page, width) => {
  const id = 'qa-poc-yeast', name = 'Weissbier de contrôle';
  const choose = async (query, candidateId) => {
    await setSearch(page, query);
    const selector = `.yc-list button[data-choose="${candidateId}"]`;
    await page.waitForSelector(selector, { visible: true });
    await page.$eval(selector, element => element.scrollIntoView({ block: 'center' }));
    await page.click(selector);
    await page.waitForFunction(() => !!document.querySelector('[data-undo-change]'));
  };
  for (const task of [
    { query: 'M20', candidate: 'yeast-mangrove-jacks-132040951', form: 'sèche' },
    { query: '3638', candidate: 'wyeast-3638', form: 'liquide' },
  ]) {
    await openEditRecipe(page, name); await clickStep(page, 'Levure');
    await page.waitForSelector('.yeast-picker-search', { visible: true });
    const before = await page.evaluate(id => structuredClone(window.__hopQa.storage.getRecipes().find(item => item.id === id)), id);
    const launchedBefore=await page.evaluate(()=>structuredClone(window.__hopQa.storage.getBatches().find(batch=>batch.id==='QA-POC-3068-LAUNCHED').recipeSnapshot));
    await choose(task.query, task.candidate);
    assert.equal(await page.$('[data-yeast-state="trial"]'), null, 'Le choix direct ne demande pas un essai');
    await capture(page, `direct-${task.query}-choisi`, width, '.yc-identity-card');
    await clickStep(page, 'Paliers'); await page.waitForSelector('#wz-ferment-temp-0', { visible: true });
    assert.equal(await page.$eval('#wz-ferment-temp-0', node => node.value), '18');
    assert.equal(await page.$eval('#wz-ferment-days-0', node => node.value), '10');
    await page.click('#wz-ferment-days-1', { clickCount: 3 });
    await page.keyboard.press('Backspace'); await page.keyboard.type('8'); await page.keyboard.press('Tab');
    await clickStep(page, 'Levure'); await page.waitForSelector('[data-undo-change]', { visible: true });
    await page.click('[data-undo-change]');
    await page.waitForFunction(() => document.querySelector('.yc-identity-card')?.textContent.includes('3068'));
    await clickStep(page, 'Paliers'); await page.waitForSelector('#wz-ferment-days-1', { visible: true });
    assert.equal(await page.$eval('#wz-ferment-days-1', node => node.value), '8', 'Undo garde la durée corrigée indépendamment');
    assert.deepEqual(await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), id), before,
      'Choix direct et annulation ne sauvegardent pas la recette');
    await clickStep(page, 'Levure'); await page.waitForSelector('[data-undo-change]', { visible: true });
    await page.click('[data-undo-change]');
    await page.waitForFunction(candidate => document.querySelector('.yc-identity-card')?.textContent.includes(candidate), {}, task.query);
    await clickStep(page, 'Récapitulatif'); await clickButton(page, 'Enregistrer la recette');
    await page.waitForSelector(`[aria-label="Ouvrir la recette ${name}"]`, { visible: true });
    const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), id);
    assert.equal(saved.yeast.hopIndexId, task.candidate); assert.equal(saved.yeast.form, task.form);
    for (const key of ['qty', 'unit', 'pitchTempC', 'stockItemRef']) assert.equal(saved.yeast[key], undefined, `Aucun ${key} transplanté`);
    assert.deepEqual(saved.fermentation.map(phase => [phase.tempC, phase.days]), [[18, 10], [4, 8]]);
    assert.deepEqual(saved.hops, before.hops); assert.deepEqual(saved.mash.steps, before.mash.steps);
    assert.deepEqual(await page.evaluate(()=>window.__hopQa.storage.getBatches().find(batch=>batch.id==='QA-POC-3068-LAUNCHED').recipeSnapshot),launchedBefore,'Choisir et enregistrer ne réécrit pas le brassin lancé');
    await openEditRecipe(page, name); await clickStep(page, 'Levure');
    await page.waitForSelector('.yeast-picker-search', { visible: true });
    await capture(page, `direct-${task.query}-reouvert`, width, '.yeast-choice');
    checks.push({ name: `direct-${task.query}`, width, saved: saved.yeast, programme: saved.fermentation, undoKeptIndependentDays: true });
    await page.click('[aria-label="Abandonner le brouillon"]');
    await clickButton(page, 'Abandonner');
    await page.waitForSelector('.recipe-wizard', { hidden: true });
    await seed(page);
  }
};

const checkPersonalChoice = async (page, width) => {
  for (const source of ['stock', 'free']) {
    await openEditRecipe(page, 'Weissbier de contrôle'); await clickStep(page, 'Levure');
    const personal = await page.waitForSelector('.yc-personal-fold');
    if (!await personal.evaluate(node => node.open)) await personal.$eval('summary', node => node.click());
    if (source === 'stock') {
      await page.click('[role="combobox"][aria-label="Souche de levure"]');
      await page.keyboard.type('qa-us05');
      const option = await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')]
        .find(node => node.getClientRects().length && node.textContent.includes('qa-us05')));
      await option.asElement().click();
    } else {
      await clickButton(page, 'Saisir une levure hors catalogue');
      await page.click('[aria-label="Nom de la levure personnelle"]'); await page.keyboard.type('Culture personnelle QA-Z9');
      await clickButton(page, 'Utiliser cette levure');
    }
    await page.waitForSelector('[data-undo-change]', { visible: true });
    const identity = await page.$eval('.yc-identity-card', node => node.innerText);
    assert.match(identity, source === 'stock' ? /Lot qa-us05/ : /Saisie libre/);
    await capture(page, `direct-${source}-choisi`, width, '.yc-identity-card');
    await page.click('[data-undo-change]');
    await page.waitForFunction(() => document.querySelector('.yc-identity-card')?.textContent.includes('3068'));
    await page.click('[data-undo-change]');
    await page.waitForFunction(source => document.querySelector('.yc-identity-card')?.textContent.includes(source === 'stock' ? 'qa-us05' : 'QA-Z9'), {}, source);
    await clickStep(page, 'Récapitulatif'); await clickButton(page, 'Enregistrer la recette');
    await page.waitForSelector('[aria-label="Ouvrir la recette Weissbier de contrôle"]', { visible: true });
    await openEditRecipe(page, 'Weissbier de contrôle');
    const saved = await page.evaluate(() => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === 'qa-poc-yeast'));
    assert.equal(saved.yeast.stockItemRef, source === 'stock' ? 'qa-us05' : undefined);
    assert.equal(saved.yeast.qty, undefined); assert.equal(saved.yeast.pitchTempC, undefined);
    if (source === 'stock') assert.equal(saved.yeast.unit, 'sachet');
    else { assert.equal(saved.yeast.name, 'Culture personnelle QA-Z9'); assert.equal(saved.yeast.hopIndexId, undefined); }
    assert.deepEqual(saved.fermentation.map(phase => [phase.tempC, phase.days]), [[18, 10], [4, 7]]);
    await clickStep(page, 'Levure'); await page.waitForSelector('.yc-identity-card', { visible: true });
    await capture(page, `direct-${source}-reouvert`, width, '.yc-identity-card');
    checks.push({ name: `direct-${source}`, width, saved: saved.yeast, programme: saved.fermentation });
    await page.click('[aria-label="Abandonner le brouillon"]'); await clickButton(page, 'Abandonner');
    await page.waitForSelector('.recipe-wizard', { hidden: true }); await seed(page);
  }
};

const checkGraphAxes = async (page, width) => {
  await openEditRecipe(page, 'Programme générique de contrôle'); await clickStep(page, 'Levure');
  await openStation(page, 'conduct');
  const chart = '[aria-label="Scénario de levure"] figure';
  const readings = () => page.$$eval(`${chart} [data-step]`, nodes => nodes.map(node => [Number(node.dataset.temp), Number(node.dataset.end) - Number(node.dataset.start)]));
  const frame = () => page.$eval(`${chart} svg[data-plot-left]`, node => [node.dataset.scaleMin, node.dataset.scaleMax, node.dataset.scaleEndDay]);
  await page.click(`${chart} [data-phase-select="1"]`);
  assert(await page.$(`${chart} [data-phase-handle="1"][data-handle-axis="temperature"]`), 'Toucher un palier le sélectionne');
  await page.click(`${chart} [data-phase-select="0"]`);
  const drag = async (axis, delta, offAxis, cancel = false) => {
    const handle = await page.waitForSelector(`${chart} [data-phase-handle="0"][data-handle-axis="${axis}"]`, { visible: true });
    await handle.evaluate(node => node.scrollIntoView({ block: 'center' })); await settle(page);
    const g = await handle.evaluate(node => {
      const box = node.getBoundingClientRect(), svg = node.closest('figure').querySelector('svg[data-plot-left]');
      const rect = svg.getBoundingClientRect(), view = svg.viewBox.baseVal, d = svg.dataset;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height,
        day: (Number(d.plotRight) - Number(d.plotLeft)) / Number(d.scaleEndDay) * rect.width / view.width,
        degree: (Number(d.plotBottom) - Number(d.plotTop)) / (Number(d.scaleMax) - Number(d.scaleMin)) * rect.height / view.height };
    });
    assert(g.width >= 43.5 && g.height >= 43.5, 'Cible tactile44px');
    const beforeFrame = await frame(), scrollBefore = await page.evaluate(() => scrollY);
    const end = { x: g.x + (axis === 'duration' ? delta : offAxis) * g.day, y: g.y - (axis === 'temperature' ? delta : offAxis) * g.degree };
    if (width < 600) {
      await page.touchscreen.touchStart(g.x, g.y);
      for (let step = 1; step <= 8; step++) await page.touchscreen.touchMove(g.x + (end.x - g.x) * step / 8, g.y + (end.y - g.y) * step / 8);
      await settle(page);
      assert.equal(await handle.evaluate(node => Number(node.getAttribute('aria-valuenow'))), axis === 'temperature' ? 21 : 6, 'Valeur exacte pendant le geste');
      assert.deepEqual(await frame(), beforeFrame, 'Échelle stable pendant le geste');
      assert.equal(await page.evaluate(() => scrollY), scrollBefore, 'Le geste de poignée ne défile pas');
      if (cancel) await page.touchscreen.touchMove(2, 2);
      await page.touchscreen.touchEnd();
    } else {
      await page.mouse.move(g.x, g.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 8 });
      await settle(page);
      assert.equal(await handle.evaluate(node => Number(node.getAttribute('aria-valuenow'))), axis === 'temperature' ? 21 : 6);
      assert.deepEqual(await frame(), beforeFrame);
      if (cancel) await page.mouse.move(2, 2);
      await page.mouse.up();
    }
    await settle(page); await handle.dispose();
  };
  const before = await readings(); assert.deepEqual(before, [[19, 4], [21, 2], [3, 7]]);
  await drag('temperature', 2, 1);
  const warmer = await readings();
  assert.equal(warmer[0][0], 21); assert.deepEqual(warmer.map(phase => phase[1]), [4, 2, 7]);
  await capture(page, 'graphe-temperature-seule', width, chart);
  await clickButton(page, 'Annuler ce réglage'); assert.deepEqual(await readings(), before);
  await drag('duration', 2, 2);
  const longer = await readings(); assert.deepEqual(longer, [[19, 6], [21, 2], [3, 7]]);
  await capture(page, 'graphe-duree-seule', width, chart);
  await clickButton(page, 'Annuler ce réglage'); assert.deepEqual(await readings(), before);
  await drag('duration', 2, 1, true); assert.deepEqual(await readings(), before, 'Sortir puis relâcher annule le geste');
  const temperature = `${chart} [data-handle-axis="temperature"]`, duration = `${chart} [data-handle-axis="duration"]`;
  await page.focus(temperature); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowDown');
  assert.deepEqual(await readings(), [[19.5, 4], [21, 2], [3, 7]]);
  await clickButton(page, 'Annuler ce réglage'); assert.deepEqual(await readings(), before);
  await page.focus(duration); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  assert.deepEqual(await readings(), before, 'Retour clavier exact sur chaque axe');
  const add=await page.waitForSelector('[aria-label="Ajouter un palier après le palier 1"]',{visible:true});await add.click();
  const remove=await page.waitForSelector('[aria-label^="Supprimer le palier 2 ·"]',{visible:true});await remove.click();
  assert.deepEqual(await readings(),before,'Ajout puis suppression garde exactement les paliers existants');
  await page.click(`${chart} [data-phase-select="0"]`);
  if (width < 600) {
    await page.$eval(chart, node => node.scrollIntoView({ block: 'center' })); await settle(page);
    const box = await page.$eval(`${chart} svg`, node => node.getBoundingClientRect().toJSON());
    const scrollOffsets = () => page.evaluate(() => ({ window: scrollY, nodes: [...document.querySelectorAll('*')]
      .filter(node => node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(node).overflowY))
      .map(node => ({ tag: node.tagName, class: node.className?.baseVal ?? node.className, top: node.scrollTop })) }));
    const scrollBefore = await scrollOffsets(), x = Math.max(5, box.x + 5), y = box.y + box.height / 2;
    await page.touchscreen.touchStart(x, y);
    for (let step = 1; step <= 10; step++) { await page.touchscreen.touchMove(x, y - step * 9); await new Promise(done => setTimeout(done, 16)); }
    await page.touchscreen.touchEnd(); await settle(page);
    const scrollAfter = await scrollOffsets();
    assert(scrollAfter.window > scrollBefore.window || scrollAfter.nodes.some((node, index) => node.top > (scrollBefore.nodes[index]?.top ?? node.top)),
      `Hors poignées, la page défile : ${JSON.stringify({ scrollBefore, scrollAfter })}`);
    assert.deepEqual(await readings(), before, 'Défiler ne modifie ni température ni jours');
  }
  const temperatureField=':is(input,textarea)[aria-label^="Température du palier 1 ·"]';
  const durationField=':is(input,textarea)[aria-label^="Durée du palier 1 ·"]';
  await page.click(durationField,{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.press('Tab');
  assert.equal(await page.$eval(`${chart}`,node=>node.dataset.totalDays),'inconnu');
  assert.equal(await page.$(`${chart} [data-handle-axis="duration"]`),null,'Une durée inconnue ne devient paszéro');
  await page.click(durationField);await page.keyboard.type('0');await page.keyboard.press('Tab');
  assert(await page.$(`${chart} [data-zero-step="0"]`),'0j a sonrepère');
  assert(await page.$(`${chart} [data-handle-axis="duration"]`),'0j possède une poignée de fin');
  await page.click(durationField,{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.type('6');await page.keyboard.press('Tab');
  await page.click(temperatureField,{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.type('21');await page.keyboard.press('Tab');
  const snapshot=await page.evaluate(()=>{
    const storage=window.__hopQa.storage,recipe=storage.getRecipes().find(item=>item.id==='qa-poc-generic-programme');
    return storage.planRecipeBatch(recipe,'QA-MONO-FROZEN').recipeSnapshot;
  });
  await clickButton(page,'Appliquer au brouillon');await clickStep(page,'Paliers');await page.waitForSelector('#wz-ferment-temp-0',{visible:true});
  assert.equal(await page.$eval('#wz-ferment-temp-0',node=>node.value),'21');assert.equal(await page.$eval('#wz-ferment-days-0',node=>node.value),'6');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector('[aria-label="Ouvrir la recette Programme générique de contrôle"]',{visible:true});
  await openEditRecipe(page,'Programme générique de contrôle');await clickStep(page,'Levure');await openStation(page,'conduct');
  assert.deepEqual(await readings(),[[21,6],[21,2],[3,7]]);
  const frozen=await page.evaluate(()=>window.__hopQa.storage.getBatches().find(batch=>batch.id==='QA-MONO-FROZEN').recipeSnapshot);
  assert.deepEqual(frozen,snapshot,'Le brassin lancé restefigé');
  await capture(page,'graphe-mono-axe-reouvert',width,chart);
  checks.push({ name: 'graphe-mono-axe', width, before, warmer, longer, canceled: true, exactKeyboard: true,zeroUnknownDistinct:true,savedReopened:true,frozen:true });
};

const checkDiversity = async (page, width) => {
  const tasks = width === 390 ? [
    { key:'houblonnee', id:'lalbrew-verdant-ipa', query:'Verdant', style:'Ale de contrôle', temperature:20, days:6, og:1.06, view:'sheet' },
    { key:'attenuante', id:'lalbrew-belle-saison', query:'Belle Saison', style:'Style libre', temperature:24, days:12, og:1.065, view:'conduct' },
    { key:'acidifiante', id:'yeast-lallemand-brewing-18460-06-74', query:'Philly Sour', style:'Style libre', temperature:24, days:5, og:1.045, view:'sheet' },
  ] : [
    { key:'forte', id:'white-labs-wlp099', query:'WLP099', style:'Style libre', temperature:19, days:14, og:1.09, view:'sheet' },
    { key:'froide-independante', id:'wyeast-2124', query:'2124', style:'Style libre', temperature:10, days:2, og:1.05, view:'conduct', cold:7, coldDays:5 },
  ];
  for (const task of tasks) {
    const name = `QA diversité ${task.key}`, id = `qa-diversite-${task.key}`;
    await page.evaluate(task => {
      const storage = window.__hopQa.storage, recipe = structuredClone(storage.getRecipes().find(item=>item.id==='qa-poc-yeast'));
      recipe.id=task.id; recipe.name=task.name; recipe.style=task.style; recipe.styleRef=undefined;
      recipe.yeast={name:''}; recipe.yeastDesign=undefined; recipe.yeastGuide=undefined; recipe.ogTarget=task.og; recipe.fgTarget=null; recipe.abvTarget=null;
      recipe.fermentation=[{kind:'primaire',name:'Primaire',tempC:task.temperature,days:task.days},{kind:'garde',name:'Garde',tempC:task.cold??4,days:task.coldDays??3}];
      storage.addRecipe(recipe);
    }, {...task,name,id});
    await openEditRecipe(page,name); await clickStep(page,'Levure');
    await page.waitForSelector('.yeast-picker-search',{visible:true}); await setSearch(page,task.query);
    const choice=`.yc-list [data-choose="${task.id}"]`;
    await page.waitForSelector(choice,{visible:true}); await page.$eval(choice,node=>node.scrollIntoView({block:'center'})); await page.click(choice);
    await page.waitForSelector('.yc-identity-card',{visible:true});
    assert.equal(await page.$eval('.yeast-choice',node=>node.dataset.yeastState),'chosen');
    if(task.view==='sheet') {
      const sheet=await page.waitForFunction(()=>[...document.querySelectorAll('details')].find(node=>node.querySelector('summary')?.textContent.includes('Compléter ou corriger la fiche')));
      if(!await sheet.asElement().evaluate(node=>node.open)) await sheet.asElement().$eval('summary',node=>node.click());
      await capture(page,`diversite-${task.key}`,width,'details[aria-label^="Fiche de "]');
    } else {
      await openStation(page,'conduct');
      assert.equal(await page.$eval(':is(input,textarea)[aria-label^="Température du palier 1 ·"]',node=>node.value),String(task.temperature));
      await capture(page,`diversite-${task.key}`,width,'[aria-label="Scénario de levure"] figure');
    }
    await clickStep(page,'Paliers'); await page.waitForSelector('#wz-ferment-temp-0',{visible:true});
    assert.equal(await page.$eval('#wz-ferment-temp-0',node=>node.value),String(task.temperature));
    assert.equal(await page.$eval('#wz-ferment-days-0',node=>node.value),String(task.days));
    checks.push({name:`diversite-${task.key}`,width,candidate:task.id,expectedProgramme:[[task.temperature,task.days],[task.cold??4,task.coldDays??3]],programKept:true});
    await page.click('[aria-label="Abandonner le brouillon"]'); await clickButton(page,'Abandonner'); await page.waitForSelector('.recipe-wizard',{hidden:true});
  }
};

const checkSpecialCultures = async (page,width) => {
  const task=width===390 ? {id:'yeast-aeb-fermo-brew-acid-6438',query:'FERMO Brew Acid',process:'acidifying-yeast',temperature:22}
    : {id:'wyeast-3278',query:'3278',process:'mixed-culture',temperature:20};
  const name=`QA procédé ${task.process}`,id=`qa-procede-${width}`;
  await page.evaluate(task=>{
    const storage=window.__hopQa.storage,recipe=structuredClone(storage.getRecipes().find(item=>item.id==='qa-poc-yeast'));
    recipe.id=task.recipeId;recipe.name=task.name;recipe.style='Style libre';recipe.styleRef=undefined;recipe.yeast={name:''};recipe.yeastDesign=undefined;recipe.yeastGuide=undefined;
    recipe.fermentation=[{kind:'primaire',name:'Primaire',tempC:task.temperature,days:5},{kind:'garde',name:'Garde',tempC:4,days:3}];
    storage.addRecipe(recipe);
  },{...task,name,recipeId:id});
  await openEditRecipe(page,name);await clickStep(page,'Levure');await page.waitForSelector('.yeast-picker-search',{visible:true});await setSearch(page,task.query);
  const pick=`.yc-list [data-choose="${task.id}"]`;await page.waitForSelector(pick,{visible:true});await page.$eval(pick,node=>node.scrollIntoView({block:'center'}));await page.click(pick);
  await openStation(page,'conduct');
  const adjustments=await page.waitForSelector('.yc-adjustments');if(!await adjustments.evaluate(node=>node.open))await adjustments.$eval('summary',node=>node.click());
  await page.select('.yc-process-label select',task.process);await settle(page);
  const context=await page.$eval('[aria-label="Scénario de levure"]',node=>node.innerText);
  assert.match(context,/pH.*alcool.*ne sont pas déduits d’un nom|acid|culture/i);
  assert(await page.$('.yc-cultures'),'Des rôles de culture explicites sont proposés');
  await capture(page,`diversite-${task.process}`,width,'.yc-process-label');
  assert.equal(await page.$eval(':is(input,textarea)[aria-label^="Température du palier 1 ·"]',node=>node.value),String(task.temperature));
  checks.push({name:`diversite-${task.process}`,width,source:task.id,process:task.process,programKept:true,context});
};

const checkExplicitComparison = async(page,width)=>{
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');await page.waitForSelector('.yeast-picker-search',{visible:true});
  assert.equal(await page.$(comparisonSection),null,'La comparaison ne s’ouvre pas par défaut');
  await compareSearch(page,'M20');await compareSearch(page,'3638');await clickButton(page,'Comparer côte à côte',true);
  await page.waitForSelector(comparisonSection,{visible:true});
  assert.match(await page.$eval(`${comparisonSection} th[data-role="reference"]`,node=>node.innerText),/3068/);
  const trialSelector=`${comparisonSection} [data-try="yeast-mangrove-jacks-132040951"]`;
  await page.$eval(trialSelector,node=>node.scrollIntoView({block:'center'}));await page.click(trialSelector);
  await page.waitForSelector('[data-yeast-state="trial"]',{visible:true});
  assert.match(await page.$eval('.yc-identity-card',node=>node.innerText),/3068/,'Essayer ne change pas le brouillon');
  await capture(page,'comparaison-essai-explicite',width,'.yc-trial-status');
  const choose=`${comparisonSection} [data-choose="wyeast-3638"]`;
  if(!await page.$(choose)) {
    await compareSearch(page,'3638');await clickButton(page,'Comparer côte à côte',true);
  }
  await page.$eval(choose,node=>node.scrollIntoView({block:'center'}));await page.click(choose);
  await page.waitForSelector('[data-yeast-state="chosen"]',{visible:true});
  assert.match(await page.$eval('.yc-identity-card',node=>node.innerText),/3638/,'Choisir dans la comparaison agit directement');
  assert.equal(await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast').yeast.hopIndexId),'wyeast-3068');
  await capture(page,'comparaison-choix-direct',width,'.yc-identity-card');
  checks.push({name:'comparaison-explicite',width,trialKeepsDraft:true,chooseChangesDraft:true,storedUnchanged:true});
};
const checkEqualityStates = async(page,width)=>{
  for(const value of [null,[]]) {
    await seed(page);await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');
    const quantity='#wz-yeast-qty';await page.waitForSelector(quantity,{visible:true});await page.click(quantity,{clickCount:3});await page.keyboard.type('126');await page.keyboard.press('Tab');
    await page.waitForFunction(()=>Object.keys(localStorage).some(key=>key.startsWith('laffinee_recipe_draft_v1:')));
    const prepared=await page.evaluate(value=>{
      const key=Object.keys(localStorage).find(key=>key.startsWith('laffinee_recipe_draft_v1:')&&key.endsWith(':qa-poc-yeast'));
      const item=JSON.parse(localStorage.getItem(key));
      item.draft.recipe.yeast=structuredClone(window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast').yeast);
      item.draft.recipe.yeast.documentaryNotes=value;item.draft.step='levure';
      return{key,serialized:JSON.stringify(item)};
    },value);
    await page.click('[aria-label="Abandonner le brouillon"]');await clickButton(page,'Abandonner');await page.waitForSelector('.recipe-wizard',{hidden:true});
    await page.evaluate(prepared=>localStorage.setItem(prepared.key,prepared.serialized),prepared);
    await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
    if(!await page.$('.recipe-wizard'))await openEditRecipe(page,'Weissbier de contrôle');
    await clickStep(page,'Levure');
    const diffSummary=await page.evaluateHandle(()=>document.querySelector('[aria-label="État du choix de levure"] details summary'));
    if(diffSummary.asElement())await diffSummary.asElement().click();await diffSummary.dispose();
    const state=await page.$eval('[aria-label="État du choix de levure"]',node=>node.innerText);
    if(/identiques/.test(state))await writeFile(resolve(evidenceDir,`equality-fixture-${width}.json`),JSON.stringify(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(key=>key.startsWith('laffinee_recipe_draft_v1:')).map(key=>[key,JSON.parse(localStorage.getItem(key))]))),null,2));
    assert.doesNotMatch(state,/identiques à la recette enregistrée/);
    assert.match(state,value===null?/documentation inconnue/:/notes retirées/);
    await capture(page,value===null?'documentation-null':'documentation-vide',width,'[aria-label="État du choix de levure"]');
    await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');
    const saved=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast').yeast.documentaryNotes);
    assert.deepEqual(saved,value,'Les états documentaires distincts sont sauvegardés exactement');
    await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');
    await page.waitForSelector('.yc-identity-card',{visible:true});
    assert.deepEqual(await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast').yeast.documentaryNotes),value);
    await clickVisibleSelector(page,'.recipe-wizard [aria-label="Fermer"]');await page.waitForSelector('.recipe-wizard',{hidden:true});
    checks.push({name:value===null?'documentation-null':'documentation-vide',width,state,saved});
  }
};
const checkHomonymStock = async(page,width)=>{
  await page.evaluate(()=>window.__hopQa.storage.addStockItem('rawMaterials',{id:'qa-homonym-m20',ref:'QA-HOMONYM-M20',name:'M20 · Bavarian Wheat',
    category:'Levure',unit:'sachet',currentStock:3,minStock:0,reorder:false,yeastNotes:'LOT_NOTE_SENTINEL',technicalSource:'LOT_SOURCE_SENTINEL',
    yeastTempMinC:10,yeastTempMaxC:12,yeastAttenuationPct:50,
    yeastTechnicalFacts:[{key:'temperature',reported:'10–12°C',range:{min:10,max:12},unit:'°C',qualifier:'range',origin:'personal',source:'LOT_SOURCE_SENTINEL'}]}));
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');await page.waitForSelector('.yeast-picker-search',{visible:true});await setSearch(page,'M20');
  const pick='.yc-list [data-choose="yeast-mangrove-jacks-132040951"]';await page.waitForSelector(pick,{visible:true});await page.click(pick);
  await page.waitForSelector('[data-undo-change]',{visible:true});
  await clickStep(page,'Paliers');await page.waitForSelector('#wz-ferment-days-1',{visible:true});
  await page.click('#wz-ferment-days-1',{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.type('8');await page.keyboard.press('Tab');
  await clickStep(page,'Levure');await page.waitForSelector('[data-undo-change]',{visible:true});await page.click('[data-undo-change]');
  await page.waitForFunction(()=>document.querySelector('.yc-identity-card')?.textContent.includes('3068'));
  await page.click('[data-undo-change]');await page.waitForFunction(()=>document.querySelector('.yc-identity-card')?.textContent.includes('M20'));
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector('[aria-label="Ouvrir la recette Weissbier de contrôle"]',{visible:true});
  const saved=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast'));
  assert.equal(saved.yeast.stockItemRef,undefined);assert.equal(saved.yeast.notes,undefined);
  assert(!JSON.stringify(saved.yeast).includes('LOT_SOURCE_SENTINEL'),'Le choix etUndo ne prennent pas les faits du lot homonyme');
  assert.equal(saved.fermentation[1].days,8,'La correction indépendante reste conservée');
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');await page.waitForSelector('.yc-identity-card',{visible:true});
  await capture(page,'stock-homonyme-catalogue-independant',width,'.yc-identity-card');
  checks.push({name:'stock-homonyme-catalogue',width,savedYeast:saved.yeast,independentDays:8,noLotSentinels:true});
};
const checkDirectBook = async(page,width)=>{
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');
  const choose=async(query,id)=>{await setSearch(page,query);const pick=`.yc-list [data-choose="${id}"]`;await page.waitForSelector(pick,{visible:true});await page.$eval(pick,node=>node.scrollIntoView({block:'center'}));await page.click(pick);};
  await page.waitForSelector('.yeast-picker-search',{visible:true});await choose('M20','yeast-mangrove-jacks-132040951');
  const openSheet=async()=>{const summary=await page.waitForFunction(()=>[...document.querySelectorAll('details[aria-label^="Fiche de "] summary')].find(node=>node.getClientRects().length));if(!await summary.asElement().evaluate(node=>node.parentElement.open))await summary.asElement().click();};
  await openSheet();
  const addNote=await page.waitForSelector('.yc-note-add summary',{visible:true});await addNote.click();
  await page.click('[aria-label="Nouvelle note documentaire"]');await page.keyboard.type('NOTE_DIRECT_A_SENTINEL');await clickButton(page,'Ajouter la note');
  await page.click('[aria-label="Corriger Température de fermentation"]');
  const maximum='[aria-label="Température de fermentation · maximum"]';await page.waitForSelector(maximum,{visible:true});
  await page.click(maximum,{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.type('29');await page.keyboard.press('Tab');
  const source='[aria-label="Source · Température de fermentation"]';
  await page.click(source,{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.type('https://mangrovejacks.com/products/m20-bavarian-wheat-10g');await page.keyboard.press('Tab');
  await clickScopedButton(page,'[aria-label="Température de fermentation"]','Retenir');
  await choose('3638','wyeast-3638');await choose('M20','yeast-mangrove-jacks-132040951');await openSheet();
  assert.match(await page.$eval('[aria-label^="Fiche de "]',node=>node.innerText),/NOTE_DIRECT_A_SENTINEL/,'A→B→A retrouve la note acceptée depuis la fiche choisie');
  await clickStep(page,'Houblons');await clickStep(page,'Levure');await openSheet();
  assert.match(await page.$eval('[aria-label^="Fiche de "]',node=>node.innerText),/18–29 °C/,'La correction typée personnelle suit la fiche');
  await capture(page,'book-direct-a-b-a',width,'[aria-label^="Fiche de "]');
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');await openSheet();
  assert.match(await page.$eval('[aria-label^="Fiche de "]',node=>node.innerText),/NOTE_DIRECT_A_SENTINEL/,'Reprise du brouillon conserve la note');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector('[aria-label="Ouvrir la recette Weissbier de contrôle"]',{visible:true});
  const saved=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast'));
  assert(saved.yeast.documentaryNotes.some(note=>note.text==='NOTE_DIRECT_A_SENTINEL'&&note.origin==='personal'));
  assert.deepEqual(saved.yeast.technicalSelections.temperature.range,{min:18,max:29});assert.equal(saved.yeast.qty,undefined);assert.equal(saved.yeast.stockItemRef,undefined);
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');await page.waitForSelector('.yeast-picker-search',{visible:true});
  await choose('3638','wyeast-3638');await choose('M20','yeast-mangrove-jacks-132040951');await openSheet();
  const reopenedSheet=await page.$eval('[aria-label^="Fiche de "]',node=>node.innerText);
  assert.match(reopenedSheet,/NOTE_DIRECT_A_SENTINEL/,'Après sauvegarde et nouvelle ouverture sans brouillon, B→A conserve la note');
  assert.match(reopenedSheet,/18–29 °C/,'Après sauvegarde, B→A conserve la plage personnelle');
  await capture(page,'book-apres-save-b-a',width,'[aria-label^="Fiche de "]');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector('[aria-label="Ouvrir la recette Weissbier de contrôle"]',{visible:true});
  const resaved=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast').yeast);
  assert.deepEqual(resaved.documentaryNotes,saved.yeast.documentaryNotes);assert.deepEqual(resaved.technicalSelections.temperature,saved.yeast.technicalSelections.temperature);
  checks.push({name:'book-direct-a-b-a',width,savedYeast:resaved,notes:resaved.documentaryNotes,selection:resaved.technicalSelections.temperature,saved:true,reopenedDraft:true,reopenedSavedThenBA:true});
};

const checkReferenceTasks = async(page,width)=>{
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Levure');
  await page.waitForSelector('.yeast-picker-search',{visible:true});
  await compareSearch(page,'M20');await compareSearch(page,'3638');await clickButton(page,'Comparer côte à côte',true);
  await page.waitForSelector(comparisonSection,{visible:true});
  assert.match(await page.$eval(`${comparisonSection} th[data-role="reference"]`,node=>node.innerText),/3068/);
  await capture(page,'reference-a-comparaison',width,comparisonSection);
  await openStation(page,'conduct');
  assert.deepEqual((await programmeState(page)).map(phase=>[phase.start,phase.days,phase.temp]),[['0','10','18'],['10','7','4']]);
  await editPhase(page,1,'Durée','11');await editPhase(page,2,'Durée','8');
  assert.deepEqual((await programmeState(page)).map(phase=>[phase.start,phase.days,phase.temp]),[['0','11','18'],['11','8','4']]);
  assert.deepEqual(await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id==='qa-poc-yeast').fermentation.map(phase=>[phase.tempC,phase.days])),[[18,10],[4,7]],'L’essai reste distinct de la recette enregistrée');
  await capture(page,'reference-c-frise-memes-valeurs',width,'[aria-label="Scénario de levure"] figure');
  await capture(page,'reference-d-editeur-memes-valeurs',width,'[aria-label="Modifier le palier sélectionné"]');
  await capture(page,'reference-d-decision-memes-valeurs',width,'[aria-label="Décider des changements de l’essai"]');
  await clickScopedButton(page,'[aria-label="Décider des changements de l’essai"]','Appliquer au brouillon');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');
  await page.waitForSelector('[aria-label="Ouvrir la recette Weissbier de contrôle"]',{visible:true});
  await openEditRecipe(page,'Weissbier de contrôle');await clickStep(page,'Paliers');await page.waitForSelector('#wz-ferment-days-1',{visible:true});
  assert.equal(await page.$eval('#wz-ferment-days-0',node=>node.value),'11');assert.equal(await page.$eval('#wz-ferment-days-1',node=>node.value),'8');
  checks.push({name:'references-memes-fixtures',width,yeast:'3068',before:[[18,10],[4,7]],trial:[[18,11],[4,8]],endDays:[0,11,19],savedReopened:true});
};
const checkLegacyHypothesis = async(page,width,{free=false}={})=>{
  const name=free?'QA atténuation documentaire libre':'QA atténuation documentaire et hypothèse',id=free?'qa-free-legacy-attenuation':'qa-legacy-attenuation';
  const source=free?'SOURCE_HISTORIQUE_LIBRE_QA':'DOC78_SOURCE_SENTINEL';
  await page.evaluate(({id,name,free,source})=>{
    const storage=window.__hopQa.storage,recipe=structuredClone(storage.getRecipes().find(item=>item.id==='qa-poc-yeast'));
    recipe.id=id;recipe.name=name;recipe.yeast={name:free?'Culture libre QA':'M20 · Bavarian Wheat',
      ...(!free?{hopIndexId:'yeast-mangrove-jacks-132040951',form:'sèche'}:{}),
      attenuationPct:78,attenuationBasis:'declared',technicalSource:source};
    recipe.yeastDesign=undefined;storage.addRecipe(recipe);
  },{id,name,free,source});
  await openEditRecipe(page,name);await clickStep(page,'Levure');await page.waitForSelector('.yeast-picker-search',{visible:true});
  const openSheet=async()=>{const summary=await page.waitForFunction(()=>[...document.querySelectorAll('details[aria-label^="Fiche de "] summary')].find(node=>node.getClientRects().length));if(!await summary.asElement().evaluate(node=>node.parentElement.open))await summary.asElement().click();};
  await openSheet();
  const input=':is(input,textarea)[aria-label="Atténuation retenue pour cette recette, en pourcent"]';
  await page.waitForSelector(input,{visible:true});await page.$eval(input,node=>node.scrollIntoView({block:'center'}));
  await page.click(input,{clickCount:3});await page.keyboard.press('Backspace');await page.keyboard.type('73');await page.keyboard.press('Tab');
  await page.waitForFunction(id=>Object.keys(localStorage).some(key=>key.startsWith('laffinee_recipe_draft_v1:')&&key.endsWith(`:${id}`)),{},id);
  const readDraft=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(key=>key.startsWith('laffinee_recipe_draft_v1:')&&key.endsWith(`:${id}`)))).draft,id);
  const draft=await readDraft();
  assert.equal(draft.recipe.yeast.attenuationPct,73);assert.equal(draft.recipe.yeast.attenuationBasis,'recipe');
  if(!free) {
    assert.equal(draft.candidateSheets['yeast-mangrove-jacks-132040951'].documentary.declaredAttenuationPct,78,'Une hypothèse ne retire pas la valeur documentaire historique');
    assert.equal(draft.candidateSheets['yeast-mangrove-jacks-132040951'].documentary.technicalSource,source);
  } else assert.equal(draft.recipe.yeast.hopIndexId,undefined,'Aucun ID catalogue fabriqué pour la saisie libre');
  const durable=free?draft.recipe.yeast.localDocumentary:draft.recipe.yeast.adoptedDocumentary;
  assert.equal(durable.documentary.declaredAttenuationPct,78,'La documentation est durable dans la recette, pas seulement dans le livre éphémère');
  const documentaryReading=await page.$eval('[aria-label="Atténuation annoncée"]',node=>node.innerText);
  assert.match(documentaryReading,/78/);assert.match(documentaryReading,/historique/i);assert(documentaryReading.includes(source));
  await capture(page,'lecture-documentaire-78-source',width,'[aria-label="Atténuation annoncée"]');
  assert(!durable.technicalFacts?.some(fact=>fact.key==='attenuation'&&fact.range?.min===78),'Le scalaire historique ne devient pas une observation typée inventée');
  await capture(page,'legacy-documentaire-78-hypothese-73',width,'[aria-label="Hypothèse de cette recette"]');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector(`[aria-label="Ouvrir la recette ${name}"]`,{visible:true});
  await openEditRecipe(page,name);await clickStep(page,'Levure');await openSheet();
  assert.equal(await page.$eval(input,node=>node.value),'73','L’hypothèse reste dans la recette après sauvegarde et nouvelle ouverture');
  const saved=await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id).yeast,id);
  const savedDoc=free?saved.localDocumentary:saved.adoptedDocumentary;
  assert.equal(savedDoc.documentary.declaredAttenuationPct,78);assert.equal(savedDoc.documentary.technicalSource,source);
  assert.match(await page.$eval('[aria-label="Atténuation annoncée"]',node=>node.innerText),/78/);
  await capture(page,'legacy-documentaire-78-hypothese-73-reouvert',width,'[aria-label="Hypothèse de cette recette"]');
  if(free) {
    const renameSummary=await page.waitForFunction(()=>[...document.querySelectorAll('summary')].find(node=>node.textContent==='Corriger le nom dans cette recette'));
    await renameSummary.asElement().click();
    const nameInput='[aria-label="Nom de la levure dans cette recette"]';
    await page.click(nameInput);await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.press('Backspace');await page.keyboard.type('Culture libre QA corrigée');await clickButton(page,'Renommer');
    await page.waitForFunction(()=>document.querySelector('.yc-identity-card')?.textContent.includes('Culture libre QA corrigée'));
    await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector(`[aria-label="Ouvrir la recette ${name}"]`,{visible:true});
    const renamed=await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id).yeast,id);
    assert.equal(renamed.name,'Culture libre QA corrigée');assert.equal(renamed.attenuationPct,73);assert.deepEqual(renamed.localDocumentary,saved.localDocumentary);
    await openEditRecipe(page,name);await clickStep(page,'Levure');await page.waitForSelector('.yc-personal-fold');
    const personal=await page.$('.yc-personal-fold');if(!await personal.evaluate(node=>node.open))await personal.$eval('summary',node=>node.click());
    await clickButton(page,'Saisir une levure hors catalogue');
    await page.click('[aria-label="Nom de la levure personnelle"]');await page.keyboard.type('Culture libre QA corrigée');await clickButton(page,'Utiliser cette levure');
    await page.waitForSelector('[data-undo-change]',{visible:true});
    const replaced=await readDraft();
    assert.equal(replaced.recipe.yeast.attenuationPct,undefined,'Un nouveau choix homonyme ne reprend pas l’hypothèse');
    assert.equal(replaced.recipe.yeast.localDocumentary?.documentary?.declaredAttenuationPct,undefined,'Un nouveau choix homonyme ne reprend pas les docs');
    await page.click('[data-undo-change]');await page.waitForFunction(()=>document.querySelector('[aria-label="Atténuation annoncée"]')?.textContent.includes('78'));
    const undone=await readDraft();assert.deepEqual(undone.recipe.yeast,renamed,'Undo restaure exactement l’objet capturé, sans enrichissement');
    await capture(page,'locale-renommee-homonyme-annule',width,'.yc-identity-card');
    await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector(`[aria-label="Ouvrir la recette ${name}"]`,{visible:true});
  }
  checks.push({name:free?'legacy-attenuation-libre-hypothese':'legacy-attenuation-documentaire-hypothese',width,savedYeast:saved,documentary:78,hypothesis:73,source,savedReopened:true});
};
const checkLocalStock = async(page,width)=>{
  const name='QA lots homonymes documentaires',id='qa-local-stock';
  await page.evaluate(({name,id})=>{
    const storage=window.__hopQa.storage;
    for(const [ref,value]of [['QA-LOT-A',78],['QA-LOT-B',81]])storage.addStockItem('rawMaterials',{id:ref,ref,name:'Culture homonyme QA',category:'Levure',
      unit:'sachet',currentStock:4,minStock:0,reorder:false,yeastForm:'sèche',yeastAttenuationPct:value,technicalSource:`SOURCE_${ref}`,yeastNotes:`NOTE_${ref}`});
    const recipe=structuredClone(storage.getRecipes().find(item=>item.id==='qa-poc-yeast'));recipe.id=id;recipe.name=name;
    recipe.yeast={name:'Culture homonyme QA',hopIndexId:'yeast-mangrove-jacks-132040951',stockItemRef:'QA-LOT-A',form:'sèche',qty:2,unit:'sachet',
      attenuationPct:78,attenuationBasis:'declared',technicalSource:'SOURCE_QA-LOT-A',notes:'NOTE_QA-LOT-A'};
    recipe.yeastDesign=undefined;storage.addRecipe(recipe);
  },{name,id});
  await openEditRecipe(page,name);await clickStep(page,'Levure');await page.waitForSelector('.yc-identity-card',{visible:true});
  const openSheet=async()=>{const summary=await page.waitForFunction(()=>[...document.querySelectorAll('details[aria-label^="Fiche de "] summary')].find(node=>node.getClientRects().length));if(!await summary.asElement().evaluate(node=>node.parentElement.open))await summary.asElement().click();};
  await openSheet();const input=':is(input,textarea)[aria-label="Atténuation retenue pour cette recette, en pourcent"]';
  await page.$eval(input,node=>node.scrollIntoView({block:'center'}));await page.click(input,{clickCount:3});await page.keyboard.type('73');await page.keyboard.press('Tab');
  const readDraft=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(key=>key.startsWith('laffinee_recipe_draft_v1:')&&key.endsWith(`:${id}`)))).draft,id);
  await page.waitForFunction(id=>Object.keys(localStorage).some(key=>key.startsWith('laffinee_recipe_draft_v1:')&&key.endsWith(`:${id}`)),{},id);
  const before=await readDraft();assert.equal(before.recipe.yeast.attenuationPct,73);assert.equal(before.recipe.yeast.localDocumentary.documentary.declaredAttenuationPct,78);
  assert(!JSON.stringify(before.candidateSheets??{}).includes('SOURCE_QA-LOT-A'),'Le lot n’entre pas dans le livre catalogue même avec un hopIndexId');
  await capture(page,'lot-documentaire-78-source',width,'[aria-label="Atténuation annoncée"]');
  const personal=await page.$('.yc-personal-fold');if(!await personal.evaluate(node=>node.open))await personal.$eval('summary',node=>node.click());
  await page.click('[role="combobox"][aria-label="Souche de levure"]');await page.keyboard.type('QA-LOT-B');
  const option=await page.waitForFunction(()=>[...document.querySelectorAll('[role="option"]')].find(node=>node.getClientRects().length&&node.textContent.includes('QA-LOT-B')));await option.asElement().click();
  await page.waitForSelector('[data-undo-change]',{visible:true});const replaced=await readDraft();
  assert.equal(replaced.recipe.yeast.stockItemRef,'QA-LOT-B');assert.equal(replaced.recipe.yeast.attenuationPct,81);
  assert(!JSON.stringify(replaced.recipe.yeast).includes('QA-LOT-A'),'Un autre article homonyme ne reprend aucun fait ou note du lot A');
  await page.click('[data-undo-change]');await page.waitForFunction(()=>document.querySelector('.yc-identity-card')?.textContent.includes('QA-LOT-A'));
  const restored=await readDraft();assert.deepEqual(restored.recipe.yeast,before.recipe.yeast,'Undo de lot exact, hypothèse et données locales conservées');
  await capture(page,'lots-homonymes-locale-undo',width,'.yc-identity-card');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector(`[aria-label="Ouvrir la recette ${name}"]`,{visible:true});
  await openEditRecipe(page,name);await clickStep(page,'Levure');await openSheet();assert.equal(await page.$eval(input,node=>node.value),'73');
  const saved=await page.evaluate(id=>window.__hopQa.storage.getRecipes().find(recipe=>recipe.id===id).yeast,id);
  assert.deepEqual(saved.localDocumentary,before.recipe.yeast.localDocumentary);assert.equal(saved.stockItemRef,'QA-LOT-A');
  await capture(page,'lot-locale-reouvert',width,'[aria-label="Hypothèse de cette recette"]');
  checks.push({name:'lots-homonymes-locale',width,savedYeast:saved,bookUnchanged:true,undoExact:true,reopened:true});
};

try {
  for (const width of [390, 1280]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [], remote = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
    await page.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument(() => { if (!localStorage.getItem('laffinee_ui_state')) localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })); });
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());
    await seed(page);

    if(process.argv.includes('--captured-autocomplete-only')) {
      await checkCapturedAutocomplete(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--local-stock-only')) {
      await checkLocalStock(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--legacy-free-only')) {
      await checkLegacyHypothesis(page,width,{free:true});assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--legacy-hypothesis-only')) {
      await checkLegacyHypothesis(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--reference-tasks-only')) {
      await checkReferenceTasks(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--direct-book-only')) {
      await checkDirectBook(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--homonym-stock-only')) {
      await checkHomonymStock(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--equality-only')) {
      await checkEqualityStates(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--explicit-comparison-only')) {
      await checkExplicitComparison(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(process.argv.includes('--special-cultures-only')) {
      await checkSpecialCultures(page,width);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if (process.argv.includes('--diversity-only')) {
      await checkDiversity(page,width);
      assert.deepEqual(errors,[]); assert.deepEqual(remote,[]);
      await context.close(); continue;
    }

    if (process.argv.includes('--graph-axes-only')) {
      await checkGraphAxes(page, width);
      assert.deepEqual(errors, []); assert.deepEqual(remote, []);
      await context.close(); continue;
    }

    if (process.argv.includes('--personal-choice-only')) {
      await checkPersonalChoice(page, width);
      assert.deepEqual(errors, []); assert.deepEqual(remote, []);
      await context.close(); continue;
    }

    if (process.argv.includes('--direct-choice-only')) {
      await checkDirectChoice(page, width);
      assert.deepEqual(errors, []); assert.deepEqual(remote, []);
      await context.close(); continue;
    }

    if (process.argv.includes('--choice-empty-only')) {
      await navigate(page, 'production');
      await page.click('button[aria-label="Actions rapides"]');
      await clickButton(page, 'Créer une recette', true);
      await page.waitForSelector('#wz-title');
      await page.click('#wz-title'); await page.keyboard.type(`QA choix vide ${width}`);
      await clickStep(page, 'Levure');
      await page.waitForSelector('.yeast-choice');
      await capture(page, 'choix-sans-levure-avant', width, '.yeast-choice');
      assert.equal(await page.$eval('.yeast-choice',node=>node.dataset.yeastState),'empty');
      const stockCombo='[role="combobox"][aria-label="Souche de levure"]';
      assert.equal(await page.$(stockCombo),null,'Pas de deuxième recherche permanente dans le vide');
      await clickButton(page,'Chercher un autre lot ou une référence');
      await page.waitForSelector(stockCombo,{visible:true});
      assert.equal(await page.$eval(stockCombo,node=>node===document.activeElement),true,'La recherche secondaire prend le focus');
      await page.keyboard.type('qa-us05');await page.keyboard.press('Escape');
      assert.equal(await page.$eval(stockCombo,node=>node.value),'','Échap efface la recherche secondaire');
      await clickButton(page,'Saisir une levure hors catalogue');
      assert.equal(await page.$(stockCombo),null,'Saisie libre et recherche secondaire sont exclusives');
      const free='[aria-label="Nom de la levure personnelle"]';await page.waitForSelector(free,{visible:true});
      await page.click(free);await page.keyboard.type('Culture libre QA');await clickButton(page,'Utiliser cette levure');
      await page.waitForSelector('[data-undo-change]',{visible:true});await page.click('[data-undo-change]');
      await page.waitForSelector('[data-yeast-state="empty"]',{visible:true});
      assert.equal(await page.$(stockCombo),null,'Annuler replie le choix secondaire');
      const beforeEmpty=await page.$$eval('.yc-programme [data-phase-choice]',nodes=>nodes.map(node=>node.textContent));
      await setSearch(page,'M20');const pick='.yc-list [data-choose="yeast-mangrove-jacks-132040951"]';
      await page.waitForSelector(pick,{visible:true});await page.click(pick);await page.waitForSelector('[data-undo-change]',{visible:true});
      assert.equal(await page.$eval('.yeast-choice',node=>node.dataset.yeastState),'chosen');
      await page.click('[data-undo-change]');await page.waitForSelector('[data-yeast-state="empty"]',{visible:true});
      assert.equal(await page.$('.yc-identity-card'),null,'Annuler revient réellement sans levure');
      assert.equal(await page.$('[aria-label="Quantité prévue de levure"]'),null,'Pas de quantité sans levure');
      assert.deepEqual(await page.$$eval('.yc-programme [data-phase-choice]',nodes=>nodes.map(node=>node.textContent)),beforeEmpty);
      await capture(page,'choix-vide-annule',width,'.yeast-choice');
      await page.click('[data-undo-change]');await page.waitForSelector('[data-yeast-state="chosen"]',{visible:true});
      checks.push({name:'vide-choisi-annule-retabli',width,initial:'empty',undo:'empty',redo:'chosen',programmeConserved:true});
      assert.deepEqual(errors, []); assert.deepEqual(remote, []);
      await context.close();
      continue;
    }

    if (process.argv.includes('--guidance-only')) {
      await checkGuidanceDecision(page, width);
      assert.deepEqual(errors, [], `Erreurs JavaScript ${width}`);
      assert.deepEqual(remote, [], `Requêtes distantes ${width}`);
      await context.close();
      continue;
    }

    await navigate(page, 'stocks');
    await capture(page, 'stocks', width, '.stocks-screen');
    const stockSummary = await page.waitForFunction(() => [...document.querySelectorAll('.stocks-screen summary')]
      .find(summary => summary.textContent.includes('Comparer une recette')));
    await stockSummary.asElement().click();
    await page.waitForSelector('[aria-label="Recette à comparer"]', { visible: true });
    await page.click('[aria-label="Recette à comparer"]');
    const recipeOption = await page.waitForFunction(() => [...document.querySelectorAll('[role="option"]')]
      .find(option => option.getClientRects().length && option.textContent.includes('Lager de contrôle')));
    await recipeOption.asElement().click();
    await capture(page, 'stocks-recette', width, '.stocks-screen');
    assert.match(await page.$eval('.stocks-screen', node => node.innerText), /Lager de contrôle/);

    await navigate(page, 'finances');
    await clickButton(page, 'Coûts');
    await capture(page, 'finances', width, '.finance');
    await clickButton(page, 'Prévisions');
    const chartSummary = await page.waitForFunction(() => [...document.querySelectorAll('.finance summary')]
      .find(summary => summary.textContent.includes('Comparer les mois')));
    await chartSummary.asElement().click();
    await page.waitForSelector('[data-finance-chart]', { visible: true });
    assert.match(await page.$eval('[data-finance-chart]', element => element.parentElement?.innerText ?? ''), /Scénario mensuel à venir, pas un historique des dépenses/);
    await capture(page, 'finances-courbe', width, '.finance-disclosure[open]');
    const forecastPeriod = await page.waitForFunction(() => [...document.querySelectorAll('[data-finance-period]')]
      .find(button => button.getClientRects().length && /154,75|380,00/.test(button.closest('tr')?.textContent ?? '')));
    await forecastPeriod.asElement().click();
    await capture(page, 'finances-periode', width, '[data-finance-period-operations]');
    assert.match(await page.$eval('[data-finance-period-operations]', element => element.innerText), /Factures · reste à régler|Factures · reste à encaisser/);
    const invoiceRow = await page.waitForFunction(() => [...document.querySelectorAll('[data-finance-period-operations] button')]
      .find(button => button.textContent.includes('Facture de malt à régler')));
    await invoiceRow.asElement().click();
    await page.waitForSelector('[role="dialog"][data-state="open"]', { visible: true });
    assert.match(await page.$eval('[role="dialog"][data-state="open"]', element => element.innerText), /Facture de malt à régler/);
    await page.click('[role="dialog"][data-state="open"] button[aria-label="Fermer"]');
    await page.waitForSelector('[role="dialog"][data-state="open"]', { hidden: true });
    assert(await page.$('[data-finance-period-filter]'), 'Le filtre de période reste actif après retour de la pièce');
    await page.click('[data-clear-finance-period]');
    assert.equal(await page.$('[data-finance-period-operations]'), null, 'Retirer efface le filtre de période');

    await openEditRecipe(page, 'Lager de contrôle');
    await clickStep(page, 'Levure');
    // Voluntary comparison, independent of any trial: nothing is ticked or opened by default; nothing is tried or saved.
    const lagerYeast = () => page.evaluate(() => window.__hopQa.storage.getRecipes().find(recipe => recipe.name === 'Lager de contrôle').yeast);
    const lagerBefore = await lagerYeast();
    await page.waitForSelector('[aria-label="Quantité prévue de levure"] #wz-yeast-qty', { visible: true });
    const setQuantity = async text => {
      await page.click('#wz-yeast-qty', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      if (text) await page.keyboard.type(text);
      await page.keyboard.press('Tab');
    };
    await setQuantity('0');
    assert.equal(await page.$eval('[aria-label="Quantité prévue de levure"]', node => node.dataset.yeastQuantity), 'invalid');
    assert.match(await page.$eval('[aria-label="Quantité prévue de levure"]', node => node.innerText), /zéro à corriger/);
    if (width === 390) await capture(page, 'levure-quantite-zero', width, '[aria-label="Quantité prévue de levure"]');
    await setQuantity('');
    assert.equal(await page.$eval('[aria-label="Quantité prévue de levure"]', node => node.dataset.yeastQuantity), 'missing');
    assert.equal(await page.$eval('#wz-yeast-qty', node => node.value), '');
    if (width === 390) await capture(page, 'levure-quantite-absente', width, '[aria-label="Quantité prévue de levure"]');
    await setQuantity('12.5');
    assert.equal(await page.$eval('[aria-label="Quantité prévue de levure"]', node => node.dataset.yeastQuantity), 'set');
    assert.equal(await page.$eval('#wz-yeast-unit', node => node.value), lagerBefore.unit);
    await setQuantity(lagerBefore.qty == null ? '' : String(lagerBefore.qty));
    assert.deepEqual(await lagerYeast(), lagerBefore, 'La saisie de quantité ne sauvegarde pas la recette');
    await openYeastCatalogue(page);
    await page.waitForSelector('.yc-list input[type="checkbox"]', { visible: true });
    assert.equal(await page.$(comparisonSection), null, 'Aucune comparaison ne s’ouvre d’elle-même');
    assert.equal(await page.$$eval('.yc-list input[type="checkbox"]:checked', inputs => inputs.length), 0, 'Aucune alternative cochée d’office');
    const checkboxes = await page.$$('.yc-list input[type="checkbox"]:not(:disabled)');
    assert(checkboxes.length >= 2, 'Deux références sont nécessaires à la comparaison');
    await tickAlternative(page, checkboxes[0]);
    await compareSearch(page, 'M20');
    await compareSearch(page, '3638');
    assert.equal(await page.$$eval('.yc-compare-chips li', items => items.length), 3, 'Les alternatives cochées restent choisies d’une recherche à l’autre');
    assert.equal(await page.$(comparisonSection), null, 'Cocher ne suffit pas à ouvrir le côte à côte');
    await capture(page, 'levures-selection', width);
    await clickButton(page, 'Comparer côte à côte', true);
    await page.waitForSelector(comparisonSection, { visible: true });
    const compared = await page.$eval(comparisonSection, element => element.innerText);
    assert.match(compared, /M20/); assert.match(compared, /3638/);
    assert.match(compared, /Atténuation annoncée|Température publiée/);
    assert.match(compared, /Inconnu|inconnue|non publiée/);
    const opened = await comparedColumns(page);
    assert(opened.reference && /Référence · brouillon/.test(opened.reference.text), 'La première colonne est la référence du brouillon');
    assert(opened.reference.label === lagerBefore.name || (lagerBefore.hopIndexId && opened.reference.id === lagerBefore.hopIndexId),
      `Colonne de référence : ${JSON.stringify(opened.reference)} ; brouillon : ${lagerBefore.name}`);
    assert.equal(opened.alternatives.length, 3);
    const referenceCells = await page.$$eval(`${comparisonSection} td[data-role="reference"][data-comparison-row]`, cells => cells.map(cell => cell.innerText.trim()));
    assert(referenceCells.length >= 4 && referenceCells.every(Boolean), `Chaque critère a sa valeur de référence, même inconnue : ${JSON.stringify(referenceCells)}`);
    const temperatureDeltas = await page.$$eval(`${comparisonSection} td[data-comparison-row="temperature"]:not([data-role="reference"]) .yc-delta`,
      cells => cells.map(cell => ({ text: cell.textContent.trim(), full: cell.getAttribute('title') ?? cell.textContent.trim() })));
    assert(temperatureDeltas.length === 3 && temperatureDeltas.every(delta => /Même plage que la référence|hevauche|Écart inconnu/.test(delta.full) && /= référence|min|max|inconnue/.test(delta.text)),
      `Chaque température est lue contre la référence : ${JSON.stringify(temperatureDeltas)}`);
    await capture(page, 'levures', width, comparisonSection);
    if (opened.overflow) await clickCentered(page, `${comparisonSection} button[aria-label="Alternative suivante"]`);
    await settleColumns(page);
    const next = await comparedColumns(page);
    const gesture = opened.overflow ? await swipeColumns(page, width, true) : 'aucun défilement nécessaire';
    const end = await comparedColumns(page);
    if (opened.overflow) {
      assert(next.scrollLeft > opened.scrollLeft && next.alternatives[1].shown >= 0.8, `« Alternative suivante » amène la deuxième colonne : ${JSON.stringify(next)}`);
      assert(end.scrollLeft >= end.maxScroll - 2 && end.alternatives.at(-1).shown >= 0.8, `Le glissement (${gesture}) atteint la dernière alternative : ${JSON.stringify(end)}`);
      assert(end.reference.pinned && end.reference.label === opened.reference.label, `La colonne de référence reste fixe et lisible : ${JSON.stringify(end.reference)}`);
      await capture(page, 'levures-colonnes', width, comparisonSection);
      await swipeColumns(page, width, false);
      const back = await comparedColumns(page);
      assert(back.scrollLeft <= 2 && back.alternatives[0].shown >= 0.8, `Le glissement inverse ramène la première alternative : ${JSON.stringify(back)}`);
      assert.equal(back.position, 'Alternative 1/3', 'Le repère de position suit le glissement');
    } else {
      assert(opened.alternatives.every(column => column.shown >= 0.99), `Sans défilement, toutes les colonnes sont entières : ${JSON.stringify(opened)}`);
      assert.equal(await page.$(`${comparisonSection} button[aria-label="Alternative suivante"]`), null, 'Sans débordement, aucune navigation inutile');
    }
    const removed = opened.alternatives[0].id;
    await clickCentered(page, `${comparisonSection} th[data-role="alternative"] button.yc-compare-remove`);
    await page.waitForFunction(selector => document.querySelectorAll(`${selector} th[data-role="alternative"]`).length === 2, {}, comparisonSection);
    assert(!(await comparedColumns(page)).alternatives.some(column => column.id === removed), 'L’alternative retirée quitte le côte à côte');
    assert.equal((await comparedColumns(page)).alternatives.length, 2, 'Retirer met à jour les colonnes choisies');
    assert.equal(await page.$$eval('.yc-compare-chips li', items => items.length), 0, 'Les en-têtes portent les choix pendant le côte à côte');
    assert.match(await page.$eval(comparisonSection, element => element.innerText), /Côte à côte · 2 alternatives/);
    assert.equal(await page.$('.yc-trial-status'), null, 'Comparer ne lance aucun essai');
    assert.deepEqual(await lagerYeast(), lagerBefore, 'Comparer ne modifie pas la recette enregistrée');
    checks.push({ name: 'levures-comparaison-volontaire', width, reference: opened.reference.label, overflow: opened.overflow, gesture,
      scroll: [opened.scrollLeft, next.scrollLeft, end.scrollLeft, end.maxScroll], position: [opened.position, next.position, end.position], removed });
    await clickButton(page, 'Masquer le côte à côte');
    await openStation(page, 'conduct');
    await page.click('[aria-label="Scénario de levure"] button[aria-label^="Sélectionner le palier 2"]');
    await capture(page, 'fermentation-frise', width, '[aria-label="Scénario de levure"] figure');
    await capture(page, 'fermentation', width, '[aria-label="Modifier le palier sélectionné"]');
    const beforeShift = await page.$eval('[data-following-shift]', element => element.textContent);
    const phaseDuration = ':is(input,textarea)[aria-label^="Durée du palier 2 ·"]';
    await page.click(phaseDuration, { clickCount: 3 });
    await page.keyboard.press('Backspace'); await page.keyboard.type('3'); await page.keyboard.press('Tab');
    const afterShift = await page.$eval('[data-following-shift]', element => element.textContent);
    assert.notEqual(afterShift, beforeShift, 'Le palier suivant se décale après ajout d’un jour');
    await capture(page, 'fermentation-decale', width, '[aria-label="Modifier le palier sélectionné"]');
    await page.click(phaseDuration, { clickCount: 3 }); await page.keyboard.press('Backspace'); await page.keyboard.press('Tab');
    assert.equal(await page.$eval('[aria-label="Scénario de levure"] figure', element => element.dataset.totalDays),'inconnu');
    await page.click(phaseDuration); await page.keyboard.type('2'); await page.keyboard.press('Tab');
    await clickButton(page, 'Annuler l’essai');
    await clickStep(page, 'Paliers');
    await capture(page, 'paliers', width, '.recipe-wizard');
    await clickStep(page, 'Eau et sels');
    if (width < 600) await clickButton(page, '2. Sels', true);
    await capture(page,'eau-main',width,'[data-water-controls]');
    await page.setOfflineMode(true);
    const doseSelector=':is(input,textarea)[aria-label="Dose de Gypse en grammes"]';
    const doseBefore=Number((await page.$eval(doseSelector,node=>node.value)).replace(',','.'));
    const add=await page.waitForSelector('[aria-label="Ajouter 0,5 g de Gypse"]',{visible:true});await add.click();
    assert.equal(Number((await page.$eval(doseSelector,node=>node.value)).replace(',','.')),doseBefore+0.5,'Le dosage de main reste utilisable hors ligne');
    await page.setOfflineMode(false);
    checks.push({name:'eau-main-minimal',width,doseBefore,doseAfter:doseBefore+0.5,offline:true});
    await page.close();

    if(process.argv.includes('--five-paths-only')) {
      assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
      await context.close();continue;
    }

    if(!process.argv.includes('--historical-journey')) {
      for(const exercise of [checkDirectChoice,checkPersonalChoice,checkExplicitComparison,checkGraphAxes,checkDiversity,checkSpecialCultures,checkGuidanceDecision]) {
        const exerciseContext=await browser.createBrowserContext();
        const fresh=await exerciseContext.newPage();
        fresh.on('pageerror',error=>errors.push(error.message));
        fresh.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
        fresh.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(`${origin}/`))remote.push(request.url());});
        await fresh.setViewport({width,height:width===390?844:900,isMobile:width<600,hasTouch:width<600});
        await fresh.goto(origin,{waitUntil:'networkidle0'});await fresh.waitForFunction(()=>window.__hopQa?.ready());await seed(fresh);
        await exercise(fresh,width);await exerciseContext.close();
      }
    }

    // The historical explicit-trial choreography stays archived and opt-in.
    // Its business contracts now live in the current exercises above and the
    // integration suites; direct choice no longer follows these old doors.
    if(process.argv.includes('--historical-journey')) {
    // Two identical decisions start from separate copies of 3068. A launched
    // batch predates each edit; neither a trial nor saving may rewrite it.
    for (const decision of [
      { id: 'qa-poc-yeast', name: 'Weissbier de contrôle', query: 'M20', yeastId: 'yeast-mangrove-jacks-132040951', form: 'sèche', batch: 'QA-POC-3068-LAUNCHED', capture: 'levure-m20' },
      { id: 'qa-poc-yeast-liquid', name: 'Weissbier liquide de contrôle', query: '3638', yeastId: 'wyeast-3638', form: 'liquide', batch: 'QA-POC-3068-LIQUID-LAUNCHED', capture: 'levure-3638' },
    ]) {
      const yeastPage = await context.newPage();
      yeastPage.on('pageerror', error => errors.push(error.message));
      yeastPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      yeastPage.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
      await yeastPage.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
      await yeastPage.goto(origin, { waitUntil: 'networkidle0' });
      await yeastPage.waitForFunction(() => window.__hopQa?.ready());
      await openEditRecipe(yeastPage, decision.name);
      await clickStep(yeastPage, 'Levure');
      await capture(yeastPage, `${decision.capture}-entree`, width, '.yc-journey-state');
      // Entry: strain and quantity in view, objectives and conduct folded with a short state.
      const entryFolds = await foldState(yeastPage);
      assert(entryFolds.objectives?.expanded === 'false' && !entryFolds.objectives.bodyVisible, `Objectifs repliés à l’entrée : ${JSON.stringify(entryFolds)}`);
      assert(entryFolds.conduct?.expanded === 'false' && !entryFolds.conduct.bodyVisible && /2 paliers · fin J17/.test(entryFolds.conduct.text), `Conduite repliée avec son état : ${JSON.stringify(entryFolds)}`);
      assert(await yeastPage.$eval('[aria-label="Quantité prévue de levure"]', element => element.getClientRects().length > 0), 'Quantité visible à l’entrée');
      const entryHeader = await yeastPage.$eval('[aria-label="État du choix de levure"]', element => ({ state: element.querySelector('[data-draft-state]')?.dataset.draftState, text: element.innerText }));
      assert.equal(entryHeader.state, 'saved', `Recette ouverte sans modification, une seule ligne d’état : ${entryHeader.text}`);
      checks.push({ name: `${decision.capture}-entree-replie`, width, folds: entryFolds, header: entryHeader });
      const before = await yeastPage.evaluate(({ id, batch }) => ({ recipe: window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id),
        batch: window.__hopQa.storage.getBatches().find(item => item.id === batch) }), decision);
      assert.equal(before.recipe.yeast.hopIndexId, 'wyeast-3068');
      assert.equal(before.batch.status, 'fermentation');
      // Direct choice: search then try, without ticking or opening any comparison.
      await openYeastCatalogue(yeastPage);
      await setSearch(yeastPage, decision.query);
      await yeastPage.waitForFunction(query => [...document.querySelectorAll('.yc-list button[aria-label^="Essayer "]')]
        .some(button => button.getClientRects().length && button.getAttribute('aria-label').includes(query)), {}, decision.query);
      assert.equal(await yeastPage.$(comparisonSection), null, 'Le choix direct n’ouvre aucune comparaison');
      await capture(yeastPage, `${decision.capture}-reponse`, width, '.yc-list');
      await tryYeast(yeastPage, decision.query);
      const sheetSelector = '.yc-sheet-fold[data-sheet-scope="candidate"]';
      await yeastPage.waitForSelector(sheetSelector, { visible: true });
      if (!await yeastPage.$eval(sheetSelector, element => element.open)) await yeastPage.click(`${sheetSelector} > summary`);
      const aiTarget = await yeastPage.$eval(sheetSelector, element => ({ label: element.getAttribute('aria-label'), text: element.innerText }));
      assert.match(aiTarget.label, new RegExp(decision.query));
      assert.match(aiTarget.text, /Essai local.*recette, stock et autres candidats inchangés/s);
      assert.match(aiTarget.text, /Rechercher la fiche avec l’IA/);
      await capture(yeastPage, `${decision.capture}-ia-candidat`, width, sheetSelector);
      if (decision.query === 'M20') {
        await yeastPage.evaluate(() => window.__hopQa.yeast.mockM20Review());
        await clickScopedButton(yeastPage, sheetSelector, 'Rechercher la fiche avec l’IA');
        await yeastPage.waitForSelector('[aria-label="Écart · Forme"]', { visible: true });
        assert.match(await yeastPage.$eval(sheetSelector, element => element.innerText), /Fixture QA synthétique/);
        await capture(yeastPage, 'levure-m20-ia-conflits', width, '[aria-label="Écart · Forme"]');
        await clickScopedButton(yeastPage, sheetSelector, 'Ignorer la proposition');
      }
      // Same 3068 reference and same two alternatives in both decisions.
      await clickButton(yeastPage, 'Comparer avec Wyeast 3068');
      await yeastPage.waitForSelector(comparisonSection, { visible: true });
      await compareSearch(yeastPage, decision.query === 'M20' ? '3638' : 'M20');
      await yeastPage.waitForFunction(selector => document.querySelectorAll(`${selector} th[data-role="alternative"]`).length === 2, {}, comparisonSection);
      assert.match(await yeastPage.$eval(`${comparisonSection} th[data-role="reference"]`, element => element.innerText), /Wyeast 3068/);
      const sameTaskComparison = await yeastPage.$eval(comparisonSection, element => element.innerText);
      assert.match(sameTaskComparison, /M20/); assert.match(sameTaskComparison, /3638/);
      assert.equal(await yeastPage.evaluate(id => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id).yeast.hopIndexId, decision.id), 'wyeast-3068', 'Comparer ne modifie pas la recette');
      await capture(yeastPage, `${decision.capture}-comparaison`, width, comparisonSection);
      await clickButton(yeastPage, 'Masquer le côte à côte');
      assert.equal(await yeastPage.evaluate(id => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id).yeast.hopIndexId, decision.id), 'wyeast-3068', 'Essayer ne sauvegarde pas la recette');
      assert.match(await yeastPage.$eval('.yc-trial-status', element => element.innerText), /Essai local/);
      const pitchBefore = await yeastPage.$eval('[data-pitch-revalidation]', element => ({
        quantity: element.querySelector('[data-pitch-check="quantity"]')?.textContent,
        temperature: element.querySelector('[data-pitch-check="temperature"]')?.textContent,
        field: element.querySelector('[aria-label="Température d’ensemencement du scénario"]')?.value,
        dryMass: element.querySelector('[aria-label="Masse de levure du scénario en grammes"]')?.value,
        beforeApply: !!(element.compareDocumentPosition(element.closest('.yc-decision')?.querySelector('button.yc-apply')) & Node.DOCUMENT_POSITION_FOLLOWING),
      }));
      assert.match(pitchBefore.quantity, /125 mL.*non repris/);
      assert.match(pitchBefore.temperature, /18 °C.*non reprise.*à renseigner/);
      assert.equal(pitchBefore.field, ''); assert.equal(pitchBefore.beforeApply, true);
      if (decision.form === 'sèche') {
        assert.equal(pitchBefore.dryMass, '', 'La masse sèche du nouvel essai commence vide');
        const mass = '[data-pitch-revalidation] [aria-label="Masse de levure du scénario en grammes"]';
        await yeastPage.click(mass); await yeastPage.keyboard.type('14'); await yeastPage.keyboard.press('Tab');
        assert.equal(await yeastPage.$eval(mass, element => element.value), '14', 'La masse du produit essayé est modifiable près de la décision');
        await yeastPage.click(mass, { clickCount: 3 }); await yeastPage.keyboard.press('Backspace'); await yeastPage.keyboard.press('Tab');
        assert.equal(await yeastPage.$eval(mass, element => element.value), '', 'Effacer l’essai ne reconvertit pas les 125 mL');
      } else assert.equal(pitchBefore.dryMass, undefined, 'Pas de masse sèche pour une souche liquide');
      assert.equal(await yeastPage.$('[aria-label="Scénario de levure"] [data-pitch-temp]'), null);
      await openStation(yeastPage, 'objectives');
      const goal = await yeastPage.waitForFunction(() => [...document.querySelectorAll('label')]
        .find(label => label.textContent.trim() === 'Profil recherché' && label.control?.getClientRects().length)?.control);
      await goal.asElement().select('banana');
      await clickButton(yeastPage, 'Proposer une conduite');
      const proposal = await yeastPage.waitForSelector('[aria-label="Proposition de conduite"]', { visible: true });
      const proposalReading = await proposal.evaluate(element => ({ outcome: element.dataset.outcome, text: element.innerText,
        values: element.querySelectorAll('[data-proposal-row="value"]').length }));
      assert.equal(proposalReading.outcome, 'unchanged', `Ces fixtures M20/3638 n’ont pas de consigne banane plus précise : ${proposalReading.text}`);
      assert.equal(proposalReading.values, 0, 'Une note de suivi ne constitue pas un nouveau réglage pour ces deux fixtures');
      assert.match(proposalReading.text, /Aucune valeur modifiée/);
      checks.push({ name: `${decision.capture}-proposition`, width, ...proposalReading });
      if (decision.query === 'M20') await capture(yeastPage, 'levure-m20-proposition', width, '[aria-label="Proposition de conduite"]');
      await clickButton(yeastPage, 'Rétablir l’essai avant proposition');
      await editPhase(yeastPage, 1, 'Durée', '11');
      await editPhase(yeastPage, 2, 'Durée', '0');
      assert.match(await yeastPage.$eval('[aria-label="Scénario de levure"]', element => element.innerText), /0 j/);
      assert(await yeastPage.$('[data-zero-step="1"]'), 'Le palier 0 j a un repère sur la frise');
      if (decision.query === 'M20') await capture(yeastPage, 'levure-palier-zero', width, '[aria-label="Scénario de levure"] figure');
      await editPhase(yeastPage, 2, 'Durée', '');
      assert.equal(await yeastPage.$eval('[aria-label="Scénario de levure"] figure', element => element.getAttribute('data-total-days')), 'inconnu');
      assert.equal(await yeastPage.$eval('[aria-label="Décider des changements de l’essai"] button.yc-apply', button => button.disabled), true, 'Durée inconnue distincte de 0 j, application bloquée');
      if (decision.query === 'M20') await capture(yeastPage, 'levure-palier-inconnu', width, '[aria-label="Scénario de levure"] figure');
      await editPhase(yeastPage, 2, 'Durée', '8');
      assert.equal(await yeastPage.$eval('[aria-label="Scénario de levure"] figure', element => element.getAttribute('data-total-days')), '19');
      await yeastPage.click('[data-phase-restore="1"]');
      assert.equal(await yeastPage.$eval('[aria-label^="Durée du palier 2 ·"]', element => element.value), '7', 'Rétablir ne change que le palier actif');
      assert.match(await yeastPage.$eval('.yc-programme [data-phase-choice="0"]', element => element.textContent), /11 j/, 'La primaire corrigée reste à 11 j');
      if (decision.query === 'M20') await capture(yeastPage, 'levure-palier-retabli', width, '[aria-label="Modifier le palier sélectionné"]');
      await editPhase(yeastPage, 2, 'Durée', '8');
      if (decision.query === 'M20') {
        await openYeastCatalogue(yeastPage);
        await tryYeast(yeastPage, '3638');
        assert.match(await yeastPage.$eval('.yc-programme', element => element.innerText), /10 → 11 j.*7 → 8 j/s,
          'Changer de candidat conserve les deux paliers réglés dans l’essai');
        assert.equal(await yeastPage.$eval('[aria-label="Température d’ensemencement du scénario"]', element => element.value), '',
          'Le pitch de la nouvelle souche repart vide');
        await openYeastCatalogue(yeastPage);
        await tryYeast(yeastPage, 'M20');
        assert.match(await yeastPage.$eval('.yc-programme', element => element.innerText), /10 → 11 j.*7 → 8 j/s,
          'Revenir au premier candidat ne perd pas la conduite locale');
        await capture(yeastPage, 'levure-candidat-corrige', width, '[aria-label="Scénario de levure"]');
      }
      await yeastPage.click('[aria-label="Température d’ensemencement du scénario"]', { clickCount: 3 });
      await yeastPage.keyboard.press('Backspace'); await yeastPage.keyboard.type('19'); await yeastPage.keyboard.press('Tab');
      assert(await yeastPage.$('[aria-label="Scénario de levure"] [data-pitch-temp="19"]'), 'La température saisie est tracée seulement dans l’essai');
      await capture(yeastPage, `${decision.capture}-frise`, width, '[aria-label="Scénario de levure"] figure');
      const decisionPosition = await yeastPage.$eval('[aria-label="Décider des changements de l’essai"]', element => ({
        position: getComputedStyle(element).position, decision: element.getBoundingClientRect().toJSON(),
        editor: document.querySelector('[aria-label="Modifier le palier sélectionné"]')?.getBoundingClientRect().toJSON() }));
      assert.notEqual(decisionPosition.position, 'fixed', 'La décision ne couvre pas les champs');
      assert(width < 900 ? decisionPosition.decision.top >= decisionPosition.editor.bottom : decisionPosition.decision.left >= decisionPosition.editor.right,
        'Relecture après les champs sur mobile, à côté de la conduite sur ordinateur');
      await capture(yeastPage, `${decision.capture}-essai`, width, '[aria-label="Décider des changements de l’essai"]');
      await clickButton(yeastPage, 'Annuler l’essai');
      assert.match(await yeastPage.$eval('.yc-choice-doors button[aria-pressed="true"]', element => element.innerText), /3068/);
      assert.equal(await yeastPage.$eval('[data-draft-state]', element => element.dataset.draftState), 'saved', 'Annuler rétablit la lecture identique à la recette');
      if (decision.query === 'M20') await capture(yeastPage, 'levure-m20-annule', width, '.yc-journey-state');
      assert.equal(await yeastPage.evaluate(id => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id).yeast.hopIndexId, decision.id), 'wyeast-3068');
      await tryYeast(yeastPage, decision.query);
      await openStation(yeastPage, 'objectives');
      const correctedGoal = await yeastPage.waitForFunction(() => [...document.querySelectorAll('label')]
        .find(label => label.textContent.trim() === 'Profil recherché' && label.control?.getClientRects().length)?.control);
      await correctedGoal.asElement().select('banana');
      await editPhase(yeastPage, 1, 'Durée', '11');
      await editPhase(yeastPage, 2, 'Durée', '8');
      await clickButton(yeastPage, 'Appliquer au brouillon');
      assert.equal(await yeastPage.evaluate(id => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id).yeast.hopIndexId, decision.id), 'wyeast-3068', 'Appliquer ne sauvegarde pas encore');
      assert.match(await yeastPage.$eval('[aria-label="État du choix de levure"]', element => element.innerText), /Brouillon.*quantité à renseigner/s);
      assert.equal(await yeastPage.$eval('[aria-label="Quantité prévue de levure"]', element => element.dataset.yeastQuantity), 'missing', 'La nouvelle souche attend une quantité distincte de zéro');
      await capture(yeastPage, `${decision.capture}-applique`, width, '.yc-journey-state');
      await clickStep(yeastPage, 'Paliers');
      assert.match(await yeastPage.$eval('.recipe-wizard', element => element.innerText), /Primaire|Garde/);
      await clickStep(yeastPage, 'Récapitulatif');
      await clickButton(yeastPage, 'Enregistrer la recette');
      await yeastPage.waitForSelector(`[aria-label="Ouvrir la recette ${decision.name}"]`, { visible: true });
      await openEditRecipe(yeastPage, decision.name);
      const saved = await yeastPage.evaluate(({ id, batch }) => ({ recipe: window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id),
        batch: window.__hopQa.storage.getBatches().find(item => item.id === batch) }), decision);
      assert.equal(saved.recipe.yeast.hopIndexId, decision.yeastId);
      assert.equal(saved.recipe.yeast.form, decision.form);
      assert.equal(saved.recipe.yeast.qty, undefined, 'La quantité de 3068 est effacée même si la forme est liquide');
      assert.equal(saved.recipe.yeast.unit, undefined);
      assert.equal(saved.recipe.yeast.pitchTempC, undefined, 'La température de 3068 reste à renseigner pour la nouvelle souche');
      assert.equal(saved.recipe.yeast.stockItemRef, undefined, 'La référence de stock 3068 ne suit pas la nouvelle souche');
      assert.equal(saved.recipe.fermentation[0].days, 11);
      assert.equal(saved.recipe.fermentation[1].days, 8);
      assert.equal(saved.recipe.yeastDesign.goal, 'banana');
      assert.equal(saved.recipe.yeastDesign.goalExplicit, true);
      assert.deepEqual(saved.batch.recipeSnapshot, before.batch.recipeSnapshot, 'Le brassin lancé conserve son snapshot complet');
      await clickStep(yeastPage, 'Levure');
      await yeastPage.waitForSelector('[aria-label="Quantité prévue de levure"] .yc-quantity', { visible: true });
      assert(await yeastPage.$eval('[aria-label="Quantité prévue de levure"]', element => element.getClientRects().length > 0), 'La quantité du nouveau brouillon reste directement accessible après réouverture');
      await capture(yeastPage, `${decision.capture}-reouverte`, width, '[aria-label="Choisir la levure de la recette"]');
      await yeastPage.close();
    }

    const goalPage = await context.newPage();
    goalPage.on('pageerror', error => errors.push(error.message));
    goalPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    goalPage.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
    await goalPage.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
    await goalPage.goto(origin, { waitUntil: 'networkidle0' });
    await goalPage.waitForFunction(() => window.__hopQa?.ready());
    await openEditRecipe(goalPage, 'Weissbier objectif de contrôle');
    const frozenProgramme = await goalPage.evaluate(() => {
      const storage = window.__hopQa.storage;
      const recipe = storage.getRecipes().find(item => item.id === 'qa-poc-yeast-goal');
      return storage.planRecipeBatch(recipe, 'QA-POC-FROZEN-GOAL').recipeSnapshot.fermentation;
    });
    await clickStep(goalPage, 'Levure');
    await openStation(goalPage, 'objectives');
    const goalControl = await goalPage.waitForFunction(() => [...document.querySelectorAll('label')]
      .find(label => label.textContent.trim() === 'Profil recherché' && label.control?.getClientRects().length)?.control);
    await goalControl.asElement().select('banana');
    await clickButton(goalPage, 'Proposer une conduite');
    await goalPage.waitForSelector('[aria-label="Proposition de conduite"]', { visible: true });
    assert.equal(await goalPage.$eval('[aria-label="Proposition de conduite"]', element => element.dataset.outcome), 'proposed');
    assert.match(await goalPage.$eval('[aria-label="Changements proposés"] [data-proposal-row="value"]', element => element.innerText), /18 °C.*22 °C/s,
      'Le guide 3068 doit proposer une consigne réelle ; une note seule ne valide pas le parcours');
    await goalPage.waitForSelector('[aria-label="Scénario de levure"]', { visible: true });
    await goalPage.click('[aria-label="Scénario de levure"] button[aria-label^="Sélectionner le palier 2"]');
    const goalDuration = '[aria-label^="Durée du palier 2 ·"]';
    const beforeDays = Number((await goalPage.$eval(goalDuration, element => element.value)).replace(',', '.'));
    assert(Number.isFinite(beforeDays));
    const expectedDays = beforeDays + 1;
    await goalPage.click(goalDuration, { clickCount: 3 }); await goalPage.keyboard.press('Backspace');
    await goalPage.keyboard.type(String(expectedDays)); await goalPage.keyboard.press('Tab');
    await capture(goalPage, 'levure-objectif-essai', width, '[aria-label="Modifier le palier sélectionné"]');
    await clickButton(goalPage, 'Appliquer au brouillon');
    assert.equal(await goalPage.evaluate(() => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === 'qa-poc-yeast-goal').yeastDesign.goal),
      'clove', 'La conduite appliquée au brouillon attend encore Enregistrer');
    await clickStep(goalPage, 'Paliers');
    assert.match(await goalPage.$eval('.recipe-wizard', element => element.innerText), /Primaire|Garde/);
    await clickStep(goalPage, 'Récapitulatif');
    await clickButton(goalPage, 'Enregistrer la recette');
    await goalPage.waitForSelector('[aria-label="Ouvrir la recette Weissbier objectif de contrôle"]', { visible: true });
    await openEditRecipe(goalPage, 'Weissbier objectif de contrôle');
    const savedGoal = await goalPage.evaluate(() => {
      const storage = window.__hopQa.storage;
      return { recipe: storage.getRecipes().find(recipe => recipe.id === 'qa-poc-yeast-goal'),
        frozen: storage.getBatches().find(batch => batch.id === 'QA-POC-FROZEN-GOAL').recipeSnapshot };
    });
    assert.equal(savedGoal.recipe.yeastDesign.goal, 'banana');
    assert.equal(savedGoal.recipe.fermentation[0].tempC, 22, 'La consigne documentée proposée est appliquée puis sauvegardée, indépendamment de la correction manuelle de durée');
    assert.equal(savedGoal.recipe.fermentation[1].days, expectedDays);
    assert.deepEqual(savedGoal.frozen.fermentation, frozenProgramme, 'Le brassin planifié garde son snapshot');
    await clickStep(goalPage, 'Levure');
    await openStation(goalPage, 'objectives');
    await goalPage.waitForSelector('[aria-label="Objectifs"] select', { visible: true });
    assert.equal(await goalPage.$eval('[aria-label="Objectifs"] select', element => element.value), 'banana');
    assert.match(await goalPage.$eval('[aria-label="Objectifs"]', element => element.innerText), /Profil de fermentation[\s\S]*Cible de la bière/,
      'Profil de fermentation et cible de la bière restent deux portées nommées');
    await capture(goalPage, 'levure-objectif-reouvert', width, '[aria-label="Objectifs"]');
    await goalPage.close();

    }
    const latePage = await context.newPage();
    latePage.on('pageerror', error => errors.push(error.message));
    latePage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    latePage.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
    await latePage.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
    await latePage.goto(origin, { waitUntil: 'networkidle0' });
    await latePage.waitForFunction(() => window.__hopQa?.ready());
    await openEditRecipe(latePage, 'Weissbier contact tardif');
    await clickStep(latePage, 'Levure');
    await openStation(latePage, 'conduct');
    const lateChart = '[aria-label="Scénario de levure"] figure';
    await latePage.waitForSelector(lateChart);
    assert.equal(await latePage.$eval(lateChart, element => element.getAttribute('data-total-days')), '19');
    assert.equal(await latePage.$eval(lateChart, element => element.getAttribute('data-axis-end-day')), '21');
    assert(await latePage.$(`${lateChart} [data-programme-end-day="19"]`), 'La fin du programme J19 reste marquée avant le contact J21');
    assert.match(await latePage.$eval(lateChart, element => element.innerText), /Contact à cru J18 → J21/);
    await capture(latePage, 'fermentation-contact-tardif', width, lateChart);
    await latePage.close();

    const zeroPage = await context.newPage();
    zeroPage.on('pageerror', error => errors.push(error.message));
    zeroPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    zeroPage.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
    await zeroPage.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
    await zeroPage.goto(origin, { waitUntil: 'networkidle0' });
    await zeroPage.waitForFunction(() => window.__hopQa?.ready());
    await openEditRecipe(zeroPage, 'Weissbier zéro et contact');
    await clickStep(zeroPage, 'Levure');
    await openStation(zeroPage, 'conduct');
    const zeroChart = '[aria-label="Scénario de levure"] figure';
    await zeroPage.waitForSelector(zeroChart);
    assert.equal(await zeroPage.$eval(zeroChart, element => element.getAttribute('data-total-days')), '0');
    assert(await zeroPage.$(`${zeroChart} [data-zero-step="0"]`), 'Le 0 j explicite reste un palier ponctuel');
    assert(await zeroPage.$(`${zeroChart} [data-contact-start-day="0"]`), 'Le contact J0 à durée inconnue reste positionné');
    await capture(zeroPage, 'fermentation-zero-contact', width, zeroChart);
    await zeroPage.close();

    // New recipe: the form edits durations; the graph shows cumulative days
    // of transitions, including a boundary between equal temperatures.
    const creationPage = await context.newPage();
    creationPage.on('pageerror', error => errors.push(error.message));
    creationPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    creationPage.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
    await creationPage.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
    await creationPage.goto(origin, { waitUntil: 'networkidle0' });
    await creationPage.waitForFunction(() => window.__hopQa?.ready());
    await navigate(creationPage, 'production');
    await creationPage.click('button[aria-label="Actions rapides"]');
    await clickButton(creationPage, 'Créer une recette', true);
    await creationPage.waitForSelector('#wz-title');
    const creationName = `QA palier J10 J20 ${width}`;
    await creationPage.click('#wz-title'); await creationPage.keyboard.type(creationName);
    await clickStep(creationPage, 'Paliers');
    await creationPage.waitForSelector('#wz-ferment-days-1');
    assert.equal(await creationPage.$eval('#wz-ferment-days-0', element => element.value), '10');
    await creationPage.click('#wz-ferment-days-1', { clickCount: 3 }); await creationPage.keyboard.press('Backspace');
    await creationPage.keyboard.type('10,5'); await creationPage.keyboard.press('Tab');
    assert.equal(await creationPage.$eval('#wz-ferment-days-1', element => Number(element.value.replace(',', '.'))), 10.5,
      'La durée décimale reste une durée, sans arrondi silencieux dans la création');
    await creationPage.click('#wz-ferment-days-1', { clickCount: 3 }); await creationPage.keyboard.press('Backspace');
    await creationPage.keyboard.type('10'); await creationPage.keyboard.press('Tab');
    assert.equal(await creationPage.$eval('#wz-ferment-days-1', element => element.value), '10', 'La création saisit la durée du palier, non J20');
    await capture(creationPage, 'creation-durees-saisies', width, '#wz-ferment-days-0');
    await clickStep(creationPage, 'Levure');
    await creationPage.waitForSelector('[aria-label="Rechercher une levure"]', { visible: true });
    await setSearch(creationPage,'M20');
    const creationPick='.yc-list [data-choose="yeast-mangrove-jacks-132040951"]';
    await creationPage.waitForSelector(creationPick,{visible:true});await creationPage.click(creationPick);
    await openStation(creationPage,'conduct');
    const creationChart = '[aria-label="Scénario de levure"] figure';
    assert.equal(await creationPage.$eval(`${creationChart} [data-transition-day]`, element => element.getAttribute('data-transition-day')), '10');
    assert.equal(await creationPage.$eval(`${creationChart} [data-programme-end-day]`, element => element.getAttribute('data-programme-end-day')), '20');
    await capture(creationPage, 'creation-jour-changement', width, creationChart);
    await editPhase(creationPage, 2, 'Température', '19');
    assert.equal(await creationPage.$eval(`${creationChart} [data-transition-day="10"]`, element => element.getAttribute('data-transition-kind')), 'same-temperature');
    await capture(creationPage, 'creation-jour-meme-temperature', width, creationChart);
    await clickButton(creationPage, 'Appliquer au brouillon');
    await clickStep(creationPage, 'Récapitulatif');
    await clickButton(creationPage, 'Enregistrer la recette');
    await creationPage.waitForSelector(`[aria-label="Ouvrir la recette ${creationName}"]`, { visible: true });
    await openEditRecipe(creationPage, creationName);
    const savedCreation = await creationPage.evaluate(name => window.__hopQa.storage.getRecipes().find(recipe => recipe.name === name), creationName);
    assert.deepEqual(savedCreation.fermentation.map(phase => [phase.tempC, phase.days]), [[19, 10], [19, 10]]);
    await clickStep(creationPage, 'Levure');
    await openStation(creationPage, 'conduct');
    await creationPage.waitForSelector(`${creationChart} [data-transition-day="10"]`);
    assert.equal(await creationPage.$eval(`${creationChart} [data-programme-end-day]`, element => element.getAttribute('data-programme-end-day')), '20');
    await capture(creationPage, 'creation-jour-reouvert', width, creationChart);
    await creationPage.close();

    // Generic culture outside the historical strains: the finger (or mouse) sets the end
    // of a phase and its temperature; keyboard, add/remove, apply, Paliers, save, reopen.
    if(process.argv.includes('--historical-journey')) {
    const graphPage = await context.newPage();
    graphPage.on('pageerror', error => errors.push(error.message));
    graphPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    graphPage.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(`${origin}/`)) remote.push(request.url()); });
    await graphPage.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width < 600, hasTouch: width < 600 });
    await graphPage.goto(origin, { waitUntil: 'networkidle0' });
    await graphPage.waitForFunction(() => window.__hopQa?.ready());
    const genericName = 'Programme générique de contrôle', genericId = 'qa-poc-generic-programme';
    const storedGeneric = () => graphPage.evaluate(id => window.__hopQa.storage.getRecipes().find(recipe => recipe.id === id).fermentation, genericId);
    await openEditRecipe(graphPage, genericName);
    await clickStep(graphPage, 'Levure');
    await graphPage.waitForSelector('.yc-journey-state', { visible: true });
    const genericEntry = await foldState(graphPage);
    assert(genericEntry.objectives?.expanded === 'false' && genericEntry.conduct?.expanded === 'false' && !genericEntry.conduct.bodyVisible,
      `Objectifs et conduite repliés à l’entrée : ${JSON.stringify(genericEntry)}`);
    assert.match(genericEntry.conduct.text, /3 paliers · fin J13/);
    assert(await graphPage.$eval('[aria-label="Quantité prévue de levure"]', element => element.getClientRects().length > 0), 'Quantité visible à l’entrée');
    if (width === 390) await capture(graphPage, 'graphe-entree-replie', width, '.yc-journey-state');
    await openStation(graphPage, 'conduct');
    await clickButton(graphPage, 'Régler sur le graphe', true);
    await graphPage.click('[aria-label="Scénario de levure"] button[aria-label^="Sélectionner le palier 1 :"]');
    const firstHandle = '[aria-label="Scénario de levure"] [data-phase-handle="0"]';
    const phaseDays = async () => (await programmeState(graphPage)).map(phase => phase.days);
    const duringGesture = await dragHandle(graphPage, width, firstHandle, { days: 2 });
    assert.match(duringGesture, /4 j → 6 j.*suivants décalés \+2 j.*fin prévue J15/, `Lecture pendant le geste : ${duringGesture}`);
    assert.deepEqual((await programmeState(graphPage)).map(phase => [phase.start, phase.days]), [['0', '6'], ['6', '2'], ['8', '7']],
      'Fin du palier 1 à J6 : 6/2/7 j, frontières J0/J6/J8');
    assert.equal(await graphPage.$eval('[aria-label="Scénario de levure"] figure', element => element.getAttribute('data-total-days')), '15');
    await capture(graphPage, 'graphe-geste-duree', width, '[aria-label="Scénario de levure"] figure');
    await clickButton(graphPage, 'Annuler ce réglage', true);
    assert.deepEqual(await phaseDays(), ['4', '2', '7'], 'Annuler ce réglage rétablit les durées exactes');
    await dragHandle(graphPage, width, firstHandle, { days: 2 });
    await dragHandle(graphPage, width, firstHandle, { temp: 2 });
    assert.deepEqual((await programmeState(graphPage)).map(phase => [phase.temp, phase.days]), [['21', '6'], ['21', '2'], ['3', '7']],
      'Le geste vertical règle seulement la température du palier choisi');
    await graphPage.focus(firstHandle);
    await graphPage.keyboard.press('ArrowLeft'); assert.deepEqual(await phaseDays(), ['5', '2', '7']);
    await graphPage.keyboard.press('ArrowRight'); assert.deepEqual(await phaseDays(), ['6', '2', '7']);
    await graphPage.select('[aria-label="Type du palier à ajouter"]', 'garde');
    await clickCentered(graphPage, 'button[aria-label="Ajouter un palier après le palier 1"]');
    assert.deepEqual((await programmeState(graphPage)).map(phase => [phase.start, phase.days]), [['0', '6'], ['6', ''], ['', '2'], ['', '7']],
      'Palier ajouté à compléter, sans durée ni température fictives');
    const applySelector = '[aria-label="Décider des changements de l’essai"] button.yc-apply';
    assert.equal(await graphPage.$eval(applySelector, button => button.disabled), true, 'Programme incomplet : application bloquée');
    if (width === 390) await capture(graphPage, 'graphe-palier-a-completer', width, '[data-programme-incomplete]');
    await clickCentered(graphPage, '[data-issue-field="1-tempC"]');
    await graphPage.waitForFunction(() => document.activeElement?.getAttribute('aria-label')?.startsWith('Température du palier 2 ·'));
    await graphPage.keyboard.type('12'); await graphPage.keyboard.press('Tab');
    await clickCentered(graphPage, '[data-issue-field="1-days"]');
    await graphPage.waitForFunction(() => document.activeElement?.getAttribute('aria-label')?.startsWith('Durée du palier 2 ·'));
    await graphPage.keyboard.type('0'); await graphPage.keyboard.press('Tab');
    assert.deepEqual((await programmeState(graphPage)).map(phase => [phase.start, phase.days]), [['0', '6'], ['6', '0'], ['6', '2'], ['8', '7']],
      '0 j explicite : étape ponctuelle, suivants non décalés');
    assert.equal(await graphPage.$eval(applySelector, button => button.disabled), false);
    await clickCentered(graphPage, 'button[aria-label="Supprimer le palier 2 · Garde"]');
    assert.deepEqual((await programmeState(graphPage)).map(phase => [phase.temp, phase.days]), [['21', '6'], ['21', '2'], ['3', '7']]);
    assert.deepEqual((await storedGeneric()).map(phase => phase.days), [4, 2, 7], 'Rien n’est enregistré avant Appliquer puis Enregistrer');
    await clickButton(graphPage, 'Appliquer au brouillon');
    await clickStep(graphPage, 'Paliers');
    await graphPage.waitForSelector('[id^="wz-ferment-days-"]', { visible: true });
    assert.deepEqual(await graphPage.$$eval('[id^="wz-ferment-days-"]', inputs => inputs.map(input => input.value)), ['6', '2', '7'],
      'Paliers affiche les durées appliquées');
    await capture(graphPage, 'graphe-paliers', width, '.recipe-wizard');
    await clickStep(graphPage, 'Récapitulatif');
    await clickButton(graphPage, 'Enregistrer la recette');
    await graphPage.waitForSelector(`[aria-label="Ouvrir la recette ${genericName}"]`, { visible: true });
    assert.deepEqual((await storedGeneric()).map(phase => [phase.tempC, phase.days]), [[21, 6], [21, 2], [3, 7]]);
    await openEditRecipe(graphPage, genericName);
    await clickStep(graphPage, 'Levure');
    await openStation(graphPage, 'conduct');
    assert.deepEqual((await programmeState(graphPage)).map(phase => [phase.start, phase.days]), [['0', '6'], ['6', '2'], ['8', '7']],
      'Réouverture : mêmes durées et mêmes jours de bascule');
    assert.equal(await graphPage.$eval('[aria-label="Scénario de levure"] figure', element => element.getAttribute('data-total-days')), '15');
    checks.push({ name: 'graphe-edition-generique', width, gesture: width < 600 ? 'touch' : 'mouse', readout: duringGesture });
    await capture(graphPage, 'graphe-reouvert', width, '[aria-label="Scénario de levure"]');
    await graphPage.close();
    }

    assert.deepEqual(errors, [], `Erreurs JavaScript ${width}`);
    assert.deepEqual(remote, [], `Requêtes distantes ${width}`);
    await context.close();
  }
  const reportFile = resolve(evidenceDir, 'report.json');
  await writeFile(reportFile, JSON.stringify({ origin, browser: 'Puppeteer sur build QA local', checks, evidence }, null, 2));
  console.log(`POC UX mobile : ${evidence.length} captures à 390/1280 px, aucune erreur ni requête distante. ${reportFile}`);
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
