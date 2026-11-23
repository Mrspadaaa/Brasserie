// Vérification fonctionnelle indépendante du parcours recette.
// Local uniquement : build QA minifié, adaptateur sans Firebase/IA, requêtes externes bloquées.
// N'exécute ni build ni profil de performance.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const buildDir = resolve(process.env.HOP_QA_BUILD_DIR || resolve(tmpdir(), 'laffinee-hop-qa-recipe-open-after'));
const outputDir = resolve(process.env.RECIPE_FUNCTIONAL_OUTPUT || 'work/recipe-open-performance/luna-functional-qa');
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const complexId = 'qa-luna-recipe-open-complex';
const simpleId = 'qa-luna-recipe-open-simple';
const incompleteId = 'qa-luna-recipe-open-incomplete';
const batchId = 'qa-luna-frozen-batch';
const complexName = 'LUNA_RECIPE_SENTINEL_complexe';
const savedName = complexName + ' modifiee 7f2a';
const ingredientSentinel = 'LUNA_INGREDIENT_SENTINEL';
const widths = process.env.RECIPE_FUNCTIONAL_WIDTHS ? process.env.RECIPE_FUNCTIONAL_WIDTHS.split(',').map(Number) : [390, 1280];
const result = { environment: {}, viewports: [], limits: [] };
const externalAttempts = [];
const consoleErrors = [];
await mkdir(outputDir, { recursive: true });

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(buildDir, pathname === '/' ? 'tests/qa/hop-recipe/index.html' : '.' + pathname);
    if (!file.startsWith(buildDir + sep)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const baseUrl = 'http://127.0.0.1:' + server.address().port;
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ['--mute-audio'] });

const twoFrames = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const clickUnique = async (page, selector, description) => {
  const found = await page.$$(selector), visible = [];
  for (const node of found) if (await node.evaluate(e => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')) visible.push(node);
  assert.equal(visible.length, 1, description + ': attendu un seul contrôle visible, obtenu ' + visible.length);
  await visible[0].evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await visible[0].click();
};
const clickUniqueText = async (page, selector, expectedText, description) => {
  const found = await page.$$(selector), visible = [];
  for (const node of found) {
    const candidate = await node.evaluate(e => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' &&
      e.innerText.trim().replace(/\s+/g, ' '));
    if (candidate === expectedText) visible.push(node);
  }
  assert.equal(visible.length, 1, description + ': attendu un seul contrôle visible, obtenu ' + visible.length);
  await visible[0].evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await visible[0].click();
};
const beginClick = async (page, selector, action, description) => {
  const count = await page.evaluate(() => window.__lunaQA.clicks.length);
  await clickUnique(page, selector, description);
  await page.waitForFunction((expected, from) => window.__lunaQA.clicks.slice(from).some(e => e.action === expected && e.trusted), {}, action, count);
  return page.evaluate((expected, from) => window.__lunaQA.clicks.slice(from).find(e => e.action === expected && e.trusted), action, count);
};
const finishTiming = async (page, start) => {
  await twoFrames(page);
  return { action: start.action, durationMs: Number((await page.evaluate(() => performance.now()) - start.at).toFixed(1)), framesAfterContent: 2 };
};
const waitRecipe = page => page.waitForFunction(() => {
  const node = document.querySelector('.recipe-reference');
  return !!node?.getClientRects().length &&
    !!node.querySelector('button[aria-label="Modifier la recette"]') &&
    !!node.querySelector('[aria-label="Repères de la recette"] dd') && !!node.querySelector('main .panel');
});
const waitEditor = page => page.waitForFunction(() => {
  const node = document.querySelector('.recipe-wizard'), title = node?.querySelector('#wz-title');
  const steps = [...(node?.querySelectorAll('nav[aria-label="Étapes"] button') || [])].filter(e => e.getClientRects().length);
  return !!title?.getClientRects().length && !title.disabled && !title.readOnly && steps.length === 7;
});
const waitRecipeList = page => page.waitForFunction(() =>
  !document.querySelector('.recipe-reference, .recipe-wizard, .brew-page') && !!document.querySelector('button[aria-label^="Ouvrir la recette "]')
);
const waitBatchList = page => page.waitForFunction(() =>
  !document.querySelector('.recipe-reference, .recipe-wizard, .brew-page') &&
  !!document.querySelector('[role="group"][aria-label="Vue de production"] button[aria-pressed="true"], [role="group"][aria-label="Atelier de brassage"] button[aria-pressed="true"]') &&
  !![...document.querySelectorAll('article[aria-label^="Brassin "]')].some(card => card.getClientRects().length)
);
const historyBackTo = async (page, waitFor) => {
  const count = await page.evaluate(() => window.__lunaQA.history.length);
  await page.goBack();
  await page.waitForFunction(n => window.__lunaQA.history.length > n, {}, count);
  await waitFor(page);
  await twoFrames(page);
  return true;
};
const metric = (page, label) => page.evaluate(expected => {
  const group = document.querySelector('.recipe-reference [aria-label="Repères de la recette"]');
  const heading = [...(group?.querySelectorAll('dt') || [])].find(e => e.textContent.trim() === expected);
  return heading?.nextElementSibling?.textContent.trim() || null;
}, label);

const runViewport = async width => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const checks = [], timings = [], editEntryWrites = [], limits = [], snapshots = {};
  await page.setViewport({ width, height: width < 500 ? 844 : 900, isMobile: width < 500, hasTouch: width < 500 });
  page.setDefaultTimeout(12000);
  page.on('pageerror', e => consoleErrors.push({ width, message: e.message }));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ width, message: m.text() }); });
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (/^https?:/i.test(req.url()) && !req.url().startsWith(baseUrl + '/')) {
      try { externalAttempts.push(new URL(req.url()).origin); } catch { externalAttempts.push('external'); }
      req.abort();
    } else req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' })); } catch {}
    window.__lunaQA = { clicks: [], inputs: [], localWrites: [], history: [] };
    document.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const e = event.target.closest('button,summary');
      if (!e) return;
      const label = e.getAttribute('aria-label') || '';
      const action = label.startsWith('Ouvrir la recette ') ? 'open-recipe' :
        label.startsWith('Modifier la recette') ? 'edit-recipe' :
        (label.startsWith('Préparer le brassage') || label.startsWith('Reprendre le brassage')) ? 'open-brewday' :
        label.startsWith('Brassins') ? 'tab-batches' :
        label === 'Fermer' ? 'close' :
        e.matches('summary') && e.closest('.catalog-card') ? 'catalog-details' :
        e.matches('summary') && e.closest('.recipe-reference') ? 'recipe-details' :
        label === 'Coller une recette' ? 'import-open' :
        e.textContent.trim() === 'Enregistrer la recette' ? 'save' : undefined;
      if (action) {
        const active = document.activeElement;
        window.__lunaQA.clicks.push({ action, at: performance.now(), trusted: event.isTrusted,
          focus: { tag: active?.tagName, ariaLabel: active?.getAttribute('aria-label'),
            inCatalogCard: !!active?.closest('.catalog-card'), inPageShell: !!active?.closest('[data-page-shell]') } });
      }
    }, true);
    document.addEventListener('input', event => {
      if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) ||
          !['wz-title','wz-volume'].includes(event.target.id)) return;
      window.__lunaQA.inputs.push({ field: event.target.id, at: performance.now(), trusted: event.isTrusted });
    }, true);
    window.addEventListener('popstate', () => window.__lunaQA.history.push({ at: performance.now() }));
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      window.__lunaQA.localWrites.push({ key: String(key), at: performance.now() });
      return setItem.call(this, key, value);
    };
  });
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());

    const seeded = await page.evaluate(({ complexId, simpleId, incompleteId, batchId, complexName, ingredientSentinel }) => {
      const qa = window.__hopQa, store = qa.storage;
      const complex = qa.recipe(12);
      complex.id = complexId; complex.name = complexName; complex.volumeL = 24;
      complex.fermentables = Array.from({ length: 5 }, (_, i) => ({
        ...complex.fermentables[0], name: i === 0 ? ingredientSentinel : 'Malt QA ' + (i + 1),
        kind: 'grain', use: 'empatage', weightKg: 1 + i / 10, colorEbc: 5 + i, potentialPpg: 37
      }));
      complex.totalGristKg = complex.fermentables.filter(item => item.kind === 'grain').reduce((sum, item) => sum + item.weightKg, 0);
      const sourceHops = complex.hops;
      complex.hops = Array.from({ length: 12 }, (_, i) => ({
        ...sourceHops[i % sourceHops.length], name: 'Houblon QA ' + (i + 1), alpha: 12,
        weightG: 18 + i, stage: i < 6 ? 'boil' : 'dryHop',
        ...(i < 6 ? { timeMin: 20 + i } : { aromaTiming: 'postFermentation', aromaTemperatureC: 14, aromaContactHours: 24 })
      }));
      complex.fermentation = [
        { kind: 'primaire', name: 'Primaire QA', tempC: 19, days: 7 },
        { kind: 'reposDiacetyle', name: 'Repos QA', tempC: 21, days: 2 },
        { kind: 'garde', name: 'Garde QA', tempC: 3, days: 5 }
      ];
      const simple = qa.recipe(2); simple.id = simpleId; simple.name = 'LUNA_RECETTE_SIMPLE';
      const incomplete = qa.recipe(1); incomplete.id = incompleteId; incomplete.name = 'LUNA_RECETTE_INCOMPLETE';
      incomplete.fermentables = []; incomplete.hops = []; incomplete.style = '';
      store.addRecipe(simple); store.addRecipe(complex); store.addRecipe(incomplete);
      const batch = store.planRecipeBatch(complex, batchId, "2026-09-27");
      return { snapshot: structuredClone(batch.recipeSnapshot) };
    }, { complexId, simpleId, incompleteId, batchId, complexName, ingredientSentinel });
    await page.waitForSelector('button[aria-label="Ouvrir la recette ' + complexName + '"]', { visible: true });
    await page.waitForFunction(() => document.querySelectorAll('.catalog-card').length >= 3);
    await page.evaluate(async () => { await document.fonts.ready; });
    await twoFrames(page);
    await page.evaluate(() => {
      const qa = window.__hopQa;
      qa.metrics.writes = 0; qa.metrics.confirmations = 0; qa.metrics.reads = 0; qa.calls.length = 0;
    });
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-catalogue.png'), fullPage: false });
    checks.push({ check: 'catalogue et fixtures synthétiques', pass: true, cards: await page.$$eval('.catalog-card', n => n.length) });

    const card = 'article[aria-label^="Recette ' + complexName + ',"]';
    const cardSummary = card + ' details > summary';
    if (await page.$$eval(cardSummary, nodes => nodes.some(e => e.getClientRects().length))) {
      const start = await beginClick(page, cardSummary, 'catalog-details', 'Détails et actions');
      await page.waitForFunction(selector => document.querySelector(selector)?.closest('details')?.open, {}, cardSummary);
      timings.push(await finishTiming(page, start));
      await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-details.png'), fullPage: false });
      await page.keyboard.press('Tab');
      const afterTab = await page.evaluate(sel => !!document.activeElement?.closest(sel), card);
      await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
      const afterShiftTab = await page.evaluate(sel => !!document.activeElement?.closest(sel), card);
      assert(afterTab && afterShiftTab);
      checks.push({ check: 'Détails et actions + Tab/Shift+Tab réels', pass: true });
    } else limits.push('Pas de disclosure compact dans la variante desktop; Modifier reste directement visible.');

    const diagnosticSource = await readFile(resolve(process.cwd(), 'scripts/recipe-open-diagnostic.js'), 'utf8');
    await page.addScriptTag({ content: diagnosticSource });
    await page.evaluate(() => document.querySelector('[aria-label="Diagnostic de performance"]').shadowRoot.querySelector('[data-action="toggle"]').click());

    const open = await beginClick(page, 'button[aria-label="Ouvrir la recette ' + complexName + '"]', 'open-recipe', 'Ouvrir la fiche'); snapshots.focusBeforeOpen = open.focus || null;
    await waitRecipe(page);
    await page.waitForFunction(name => document.querySelector('.recipe-reference')?.innerText.includes(name), {}, complexName); snapshots.focusAfterOpen = await page.evaluate(() => { const active = document.activeElement; const shell = active?.closest('[data-page-shell]'); return { tag: active?.tagName, ariaLabel: active?.getAttribute('aria-label'), inPageShell: !!shell, pageShellLabel: shell?.getAttribute('aria-label') || null }; });
    timings.push(await finishTiming(page, open));
    const ibuBefore = await metric(page, 'IBU à chaud');
    assert(ibuBefore && !['-','incalculable'].includes(ibuBefore), 'Le cas complet doit calculer les IBU à chaud.');
    snapshots.initial = await page.evaluate(() => {
      const node = document.querySelector('.recipe-reference');
      return { visible: !!node?.getClientRects().length, titleVisible: !!node?.querySelector('h1')?.textContent.trim(), brewActionVisible: [...(node?.querySelectorAll('button') || [])].some(button => button.getClientRects().length && button.innerText.includes('Préparer un brassin')),

        metricCount: node?.querySelectorAll('[aria-label="Repères de la recette"] dd').length };
    });
    assert(snapshots.initial.visible && snapshots.initial.titleVisible && snapshots.initial.brewActionVisible && snapshots.initial.metricCount >= 3);
 await page.evaluate(() => { document.querySelector('[aria-label="Diagnostic de performance"]').style.display = 'none'; }); await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-fiche.png'), fullPage: false });

    checks.push({ check: 'fiche initiale : titre, repères calculés et action de brassage accessibles', pass: true, ibu: ibuBefore });

    const disclosure = 'details[data-recipe-section="Grain"]';
    if (await page.$(disclosure)) {
      const start = await beginClick(page, disclosure + ' > summary', 'recipe-details', 'Détail Grain');
      await page.waitForFunction(sel => document.querySelector(sel)?.open, {}, disclosure); var grainText = await page.$eval(disclosure, node => node.innerText); var grainVisible = grainText.includes('LUNA_INGREDIENT_SENTINEL') && /1(?:[,.]0)?\s*kg/.test(grainText); assert(grainVisible, 'Après ouverture, Grain montre le nom et le poids exacts.'); snapshots.initial.ingredientVisible = grainText.includes('LUNA_INGREDIENT_SENTINEL'); snapshots.initial.exactWeightVisible = /1(?:[,.]0)?\s*kg/.test(grainText);
      timings.push(await finishTiming(page, start));
      await clickUnique(page, disclosure + ' > summary', 'Refermer Grain');
      await page.waitForFunction(sel => document.querySelector(sel)?.open === false, {}, disclosure);
      await clickUnique(page, disclosure + ' > summary', 'Rouvrir Grain pour le clavier');
      await page.waitForFunction(sel => document.querySelector(sel)?.open, {}, disclosure); var grainText = await page.$eval(disclosure, node => node.innerText); var grainVisible = grainText.includes('LUNA_INGREDIENT_SENTINEL') && /1(?:[,.]0)?\s*kg/.test(grainText); assert(grainVisible, 'Après ouverture, Grain montre le nom et le poids exacts.'); snapshots.initial.ingredientVisible = grainText.includes('LUNA_INGREDIENT_SENTINEL'); snapshots.initial.exactWeightVisible = /1(?:[,.]0)?\s*kg/.test(grainText);
      await page.keyboard.press('Tab');
      const tabInPage = await page.evaluate(() => !!document.activeElement?.closest('.recipe-reference'));
      await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
      const shiftInPage = await page.evaluate(() => !!document.activeElement?.closest('.recipe-reference'));
      assert(tabInPage && shiftInPage);
      await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-fiche-grain-ouvert.png'), fullPage: false }); checks.push({ check: 'détail Grain ouvert/fermé, noms et poids exacts, clavier', pass: true });
    }

    const pageFocus = await page.evaluate(() => !!document.querySelector('.recipe-reference')?.contains(document.activeElement));
    assert(pageFocus, 'Le focus initial de la PageShell recette doit entrer dans la page.');
    await page.mouse.move(20, 450); await page.mouse.wheel({ deltaY: 500 }); await twoFrames(page);
    const recipeScroll = await page.$eval('.recipe-reference main', e => ({ top: e.scrollTop, overflow: e.scrollHeight > e.clientHeight }));
    snapshots.recipeScroll = recipeScroll; checks.push({ check: 'défilement réel de la fiche', pass: !recipeScroll.overflow || recipeScroll.top > 0, scroll: recipeScroll });
    await page.keyboard.press('Escape');
    await waitRecipeList(page);
    await twoFrames(page);
    const focusState = await page.evaluate(name => {
      const active = document.activeElement;
      const card = [...document.querySelectorAll('article[aria-label]')].find(node => node.getAttribute('aria-label').startsWith('Recette ' + name + ','));
      return { tag: active?.tagName, ariaLabel: active?.getAttribute('aria-label'), visible: !!active?.getClientRects().length, inPageShell: !!active?.closest('[data-page-shell]'),
        insideOriginalCard: !!card?.contains(active), activeIsBody: active === document.body };
    }, complexName);
    snapshots.focusAfterEscape = focusState;
    const openerFocus = snapshots.focusBeforeOpen; const focusReturnedToCatalog = focusState.visible && focusState.insideOriginalCard && openerFocus?.inCatalogCard && focusState.tag === openerFocus.tag && focusState.ariaLabel === openerFocus.ariaLabel;
    checks.push({ check: 'focus initial/retour, défilement et Escape de la PageShell recette', pass: focusReturnedToCatalog, focusState, scroll: recipeScroll });


    const reopen = await beginClick(page, 'button[aria-label="Ouvrir la recette ' + complexName + '"]', 'open-recipe', 'Réouverture après Escape');
    await waitRecipe(page); timings.push(await finishTiming(page, reopen));
    await page.keyboard.press('Escape'); await waitRecipeList(page);
    const backOpen = await beginClick(page, 'button[aria-label="Ouvrir la recette ' + complexName + '"]', 'open-recipe', 'Réouverture pour retour navigateur');
    await waitRecipe(page); timings.push(await finishTiming(page, backOpen));
    await historyBackTo(page, waitRecipeList);
    checks.push({ check: 'retour par historique navigateur et réouverture', pass: true }); const reopenedForEdit = await beginClick(page, 'button[aria-label="Ouvrir la recette ' + complexName + '"]', 'open-recipe', 'Rouvrir avant Modifier'); await waitRecipe(page); timings.push(await finishTiming(page, reopenedForEdit));

    const beforePageEdit = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes,
      confirmations: window.__hopQa.metrics.confirmations, calls: window.__hopQa.calls.length, local: window.__lunaQA.localWrites.length }));
    const edit = await beginClick(page, '.recipe-reference button[aria-label="Modifier la recette"]', 'edit-recipe', 'Modifier depuis la fiche');
    await waitEditor(page); timings.push(await finishTiming(page, edit));
    await clickUnique(page, '.recipe-wizard #wz-title', 'Focus réel sur le nom');
    await page.waitForFunction(() => document.activeElement?.id === 'wz-title');
    const afterPageEdit = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes,
      confirmations: window.__hopQa.metrics.confirmations, calls: window.__hopQa.calls.length,
      localKeys: window.__lunaQA.localWrites.slice(-20).map(e => e.key) }));
    assert.equal(afterPageEdit.writes, beforePageEdit.writes);
    assert.equal(afterPageEdit.confirmations, beforePageEdit.confirmations);
    assert.equal(afterPageEdit.calls, beforePageEdit.calls);
    editEntryWrites.push({ route: 'fiche-vers-editeur', localKeys: afterPageEdit.localKeys });
    checks.push({ check: 'entrée en édition depuis la fiche sans écriture adaptateur ni IA', pass: true, localKeys: afterPageEdit.localKeys });
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-editeur-entree.png'), fullPage: false });
    await historyBackTo(page, waitRecipeList);

    if (width < 500) {
      const isOpen = await page.$eval(card + ' details', e => e.open);
      if (!isOpen) {
        await clickUnique(page, cardSummary, 'Ouvrir Détails et actions avant Modifier');
        await page.waitForFunction(sel => document.querySelector(sel)?.closest('details')?.open, {}, cardSummary);
      }
    }
    const beforeDirectEdit = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes,
      confirmations: window.__hopQa.metrics.confirmations, calls: window.__hopQa.calls.length, local: window.__lunaQA.localWrites.length }));
    const direct = await beginClick(page, card + ' button[aria-label="Modifier la recette ' + complexName + '"]', 'edit-recipe', 'Modifier depuis le catalogue');
    await waitEditor(page); timings.push(await finishTiming(page, direct));
    const afterDirectEdit = await page.evaluate(from => ({ writes: window.__hopQa.metrics.writes,
      confirmations: window.__hopQa.metrics.confirmations, calls: window.__hopQa.calls.length,
      localKeys: window.__lunaQA.localWrites.slice(from).map(e => e.key) }), beforeDirectEdit.local);
    assert.equal(afterDirectEdit.writes, beforeDirectEdit.writes);
    assert.equal(afterDirectEdit.confirmations, beforeDirectEdit.confirmations);
    assert.equal(afterDirectEdit.calls, beforeDirectEdit.calls);
    editEntryWrites.push({ route: 'catalogue-direct', localKeys: afterDirectEdit.localKeys });
    checks.push({ check: 'entrée directe Modifier sans écriture adaptateur ni IA', pass: true, localKeys: afterDirectEdit.localKeys });

    const importFocusTarget = width < 500
      ? { selector: '.recipe-wizard button[aria-label="Coller une recette"]', ariaLabel: 'Coller une recette', text: '' }
      : { selector: '.recipe-wizard button', ariaLabel: null, text: 'Coller une recette trouvée' };
    if (width < 500) await clickUnique(page, importFocusTarget.selector, 'Ouvrir import');
    else await clickUniqueText(page, importFocusTarget.selector, importFocusTarget.text, 'Ouvrir import');
    await page.waitForSelector('[role="dialog"][data-state="open"]', { visible: true });
    const portal = await page.$eval('[role="dialog"][data-state="open"]', d => ({
      outsideWizard: !d.closest('.recipe-wizard'), heading: d.innerText.includes('Coller une recette')
    }));
    assert(portal.outsideWizard && portal.heading);
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-import-portaled.png'), fullPage: false });
    await page.keyboard.press('Tab');
    const tabInsideDialog = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][data-state="open"]'));
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    const shiftInsideDialog = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][data-state="open"]'));
    assert(tabInsideDialog && shiftInsideDialog);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"][data-state="open"]'));
    const restoredImportFocus = await page.evaluate(expected => expected.ariaLabel ? document.activeElement?.getAttribute('aria-label') === expected.ariaLabel : document.activeElement?.textContent.trim().replace(/\s+/g, ' ') === expected.text, importFocusTarget);
    assert(restoredImportFocus);
    const afterImport = await page.evaluate(() => ({ writes: window.__hopQa.metrics.writes,
      confirmations: window.__hopQa.metrics.confirmations, calls: window.__hopQa.calls.length }));
    assert.deepEqual(afterImport, { writes: beforeDirectEdit.writes, confirmations: beforeDirectEdit.confirmations, calls: beforeDirectEdit.calls });
    checks.push({ check: 'import portaled, Tab/Shift+Tab, Escape, retour du focus sans IA/écriture', pass: true,
      portal, tabInsideDialog, shiftInsideDialog, restoredImportFocus });

    await page.evaluate(() => {
      window.__lunaQA.inputs.length = 0; window.__lunaQA.focusClicks = [];
      document.addEventListener('pointerdown', event => {
        if (event.target instanceof Element && event.target.closest('#wz-title')) window.__lunaQA.focusClicks.push(performance.now());
      }, { capture: true, once: true });
    });
    await page.locator('.recipe-wizard #wz-title').click();
    await page.keyboard.press('End');
    await page.keyboard.type(' modifiee 7f2a');
    await page.waitForFunction(() => window.__lunaQA.inputs.length > 0 &&
      document.querySelector('.recipe-wizard #wz-title')?.value.endsWith(' modifiee 7f2a'));
    await twoFrames(page);
    const firstInput = await page.evaluate(() => ({
      trusted: window.__lunaQA.inputs[0].trusted, field: window.__lunaQA.inputs[0].field,
      gestureToPaintMs: Number((performance.now() - window.__lunaQA.focusClicks[0]).toFixed(1)),
      focused: document.activeElement?.id === 'wz-title',
      visible: document.querySelector('.recipe-wizard #wz-title')?.value.endsWith(' modifiee 7f2a')
    }));
    assert(firstInput.trusted && firstInput.field === 'wz-title' && firstInput.focused && firstInput.visible);
    checks.push({ check: 'geste focus  première saisie réelle visible', pass: true, ...firstInput });

    await page.locator('.recipe-wizard #wz-volume').click();
    await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.type('36');
    await page.locator('.recipe-wizard #wz-title').click();
    assert.equal(await page.$eval('.recipe-wizard #wz-volume', e => e.value), '36');
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-editeur-modifie.png'), fullPage: false });
    await clickUnique(page, '.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]', 'Aller au récapitulatif');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === 'Récapitulatif');
    const beforeFailure = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(r => r.id === id), complexId);
    assert.equal(beforeFailure.name, complexName); assert.equal(beforeFailure.volumeL, 24);
    await page.evaluate(() => window.__hopQa.rejectNextRecipe());
    await clickUnique(page, '.recipe-wizard button.recipe-primary-action', 'Enregistrement QA refusé');
    await page.waitForSelector('.recipe-wizard [role="alert"]', { visible: true });
    const failedSave = await page.evaluate(id => {
      const alert = document.querySelector('.recipe-wizard [role="alert"]');
      const stored = window.__hopQa.storage.getRecipes().find(r => r.id === id);
      return { alert: !!alert?.getClientRects().length, message: alert?.innerText.trim() || '',
        storedName: stored?.name, storedVolumeL: stored?.volumeL,
        adapterWrites: window.__hopQa.metrics.writes, confirmations: window.__hopQa.metrics.confirmations };
    }, complexId);
    snapshots.failedSave = failedSave;
    assert(failedSave.alert && failedSave.message.includes('QA : enregistrement refusé'));
    assert.equal(failedSave.storedName, complexName); assert.equal(failedSave.storedVolumeL, 24);
    await clickUnique(page, '.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Identité"]', 'Relire les champs après le refus');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === 'Identité' &&
      document.querySelector('.recipe-wizard #wz-title') && document.querySelector('.recipe-wizard #wz-volume'));
    const retainedDraft = await page.evaluate(() => ({
      title: document.querySelector('.recipe-wizard #wz-title')?.value,
      volume: document.querySelector('.recipe-wizard #wz-volume')?.value
    }));
    snapshots.failedSave.retainedDraft = retainedDraft;
    checks.push({ check: 'refus QA annoncé et recette stockée inchangée', pass: true, ...failedSave });
    checks.push({ check: 'nom et volume conservés dans le brouillon après retour à Identité', pass: retainedDraft.title === savedName && retainedDraft.volume === '36', retainedDraft });
    assert.equal(retainedDraft.title, savedName); assert.equal(retainedDraft.volume, '36');
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-saisie-conservee-apres-refus.png'), fullPage: false });
    await clickUnique(page, '.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]', 'Retourner au récapitulatif pour réessayer');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === 'Récapitulatif');
    await clickUnique(page, '.recipe-wizard button.recipe-primary-action', 'Réessayer la sauvegarde');    await page.waitForFunction(() => !document.querySelector('.recipe-wizard'));
    await waitRecipeList(page);

    const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(r => r.id === id), complexId);
    const frozen = await page.evaluate(id => window.__hopQa.storage.getBatches().find(b => b.id === id), batchId);
    assert.equal(saved.name, savedName); assert.equal(saved.volumeL, 36);
    assert.deepEqual(frozen.recipeSnapshot, seeded.snapshot);
    snapshots.saved = { name: saved.name, volumeL: saved.volumeL };
    checks.push({ check: "valeurs recette enregistrées dans l’adaptateur QA", pass: true, name: saved.name, volumeL: saved.volumeL });
    checks.push({ check: 'snapshot du brassin figé inchangé', pass: true });
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-catalogue-apres-sauvegarde.png'), fullPage: false });

    const diagnostic = await page.evaluate(() => window.__laffineeRecipeTimings?.exportData());
    assert(diagnostic?.schema === 1);
    const diagnosticJson = JSON.stringify(diagnostic);
    const blockedValues = [complexId, simpleId, incompleteId, batchId, complexName, savedName, ingredientSentinel, 'http://', 'https://', '?'];
    const leaks = blockedValues.filter(value => diagnosticJson.includes(value));
    assert.deepEqual(leaks, [], 'Export diagnostic contient une donnée métier/URL.');
    assert.equal(externalAttempts.length, 0);
    const diagnosticActions = diagnostic.records.map(record => record.action);
    const returnObserved = diagnosticActions.includes('return') || diagnosticActions.includes('browser-return-from-popstate'); snapshots.diagnosticActions = diagnosticActions; checks.push({ check: 'diagnostic observe ouverture, édition et retour', pass: diagnosticActions.includes('open') && diagnosticActions.includes('edit') && returnObserved, actions: diagnosticActions });
    await writeFile(resolve(outputDir, 'luna-' + width + '-diagnostic-export.json'), JSON.stringify(diagnostic, null, 2));
    checks.push({ check: 'export diagnostic sans nom, valeur, ID, requête ou URL métier', pass: true, actions: diagnosticActions });

    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());
    await page.waitForSelector('button[aria-label="Ouvrir la recette ' + savedName + '"]', { visible: true });
    const row = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(r => r.id === id), complexId);
    assert.equal(row.name, savedName); assert.equal(row.volumeL, 36);
    await clickUnique(page, 'button[aria-label="Ouvrir la recette ' + savedName + '"]', 'Rouvrir après rechargement');
    await waitRecipe(page);
    await page.waitForFunction(name => document.querySelector('.recipe-reference')?.innerText.includes(name), {}, savedName);
    const ibuAfter = await metric(page, 'IBU à chaud');
    assert(ibuAfter && ibuAfter !== ibuBefore, 'Le volume modifié doit actualiser les IBU calculés.');
    const frozenAfterReload = await page.evaluate(id => window.__hopQa.storage.getBatches().find(b => b.id === id).recipeSnapshot, batchId);
    assert.deepEqual(frozenAfterReload, seeded.snapshot);
    snapshots.saved.ibuBefore = ibuBefore; snapshots.saved.ibuAfter = ibuAfter;
    checks.push({ check: 'réouverture après rechargement, stockage durable et calcul actualisé', pass: true, ...snapshots.saved });
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-fiche-reouverte.png'), fullPage: false });

    await historyBackTo(page, waitRecipeList);
    await clickUnique(page, 'button[aria-label^="Brassins ("]', 'Afficher Brassins');
    await page.waitForSelector('button[aria-label="Préparer le brassage · ' + batchId + '"]', { visible: true });
    const adapterWritesBeforeBrewday = await page.evaluate(() => window.__hopQa.metrics.writes);
    const brewdayOpen = await beginClick(page, 'button[aria-label="Préparer le brassage · ' + batchId + '"]', 'open-brewday', 'Ouvrir le déroulé');
    await page.waitForSelector('.brew-page nav[aria-label="Vues du brassin"]', { visible: true });
    await page.waitForFunction(id => document.querySelector('.brew-page')?.innerText.includes(id), {}, batchId);
    timings.push(await finishTiming(page, brewdayOpen));
    const writesAfterOpen = await page.evaluate(() => window.__hopQa.metrics.writes);
    assert.equal(writesAfterOpen, adapterWritesBeforeBrewday, 'Ouvrir BrewDayPage ne doit pas écrire sur le brassin.');
    const launchButton = await page.$eval('.brew-page button.brew-primary', button => ({ label: button.innerText.trim(), disabled: button.disabled }));
    assert.equal(launchButton.label, 'Commencer aujourd’hui');
    assert.equal(launchButton.disabled, false);
    await clickUnique(page, '.brew-page button.brew-primary', 'Commencer le brassage QA local');
    await page.waitForFunction(() => document.querySelector('.brew-page')?.innerText.includes('Jour de brassage'));
    const launchedBatch = await page.evaluate(id => window.__hopQa.storage.getBatches().find(batch => batch.id === id), batchId);
    assert(launchedBatch?.brewDay?.startedAt, 'Le geste de lancement doit être conservé dans le brassin QA.');
    assert.deepEqual(launchedBatch.recipeSnapshot, seeded.snapshot, 'Le lancement conserve le snapshot figé.');
    checks.push({ check: 'démarrage local du brassin et snapshot figé inchangé', pass: true,
      adapterWritesOnStart: await page.evaluate(() => window.__hopQa.metrics.writes) - writesAfterOpen });
    await clickUnique(page, '.brew-page nav[aria-label="Vues du brassin"] button[aria-label="Recette"]', 'Ouvrir le résumé figé');
    await page.waitForSelector('.brew-page .brew-recipe-summary', { visible: true });
    const frozenUi = await page.$eval('.brew-page', node => {
      const targets = [...(node.querySelectorAll('.brew-recipe-targets > div') || [])].map(item => ({
        label: item.children[0]?.textContent.trim(), value: item.querySelector('strong')?.textContent.trim()
      }));
      return {
        name: node.querySelector('h1')?.textContent.trim() || null,
        volume: targets.find(item => item.label === 'Volume visé')?.value || null,
        grain: targets.find(item => item.label === 'Grain')?.value || null
      };
    });
    const numberFromDisplay = text => Number(String(text || '').match(/[\d,.]+/)?.[0]?.replace(',', '.'));
    const snapshotDisplay = {
      nameMatches: frozenUi.name === seeded.snapshot.name,
      volumeMatches: numberFromDisplay(frozenUi.volume) === seeded.snapshot.volumeL,
      grainMatches: numberFromDisplay(frozenUi.grain) === seeded.snapshot.totalGristKg,
      expected: { name: seeded.snapshot.name, volumeL: seeded.snapshot.volumeL, totalGristKg: seeded.snapshot.totalGristKg }
    };
    snapshots.brewday = { ...frozenUi, ...snapshotDisplay };
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-brewday-state.png'), fullPage: false });
    assert(snapshotDisplay.nameMatches && snapshotDisplay.volumeMatches && snapshotDisplay.grainMatches,
      'Le brassin doit continuer d’afficher les valeurs exactes de son snapshot initial: ' + JSON.stringify(snapshots.brewday));

    checks.push({ check: 'BrewDayPage affiche les valeurs exactes de son snapshot figé', pass: snapshotDisplay.nameMatches && snapshotDisplay.volumeMatches && snapshotDisplay.grainMatches, ...snapshotDisplay });
    const brewFocus = await page.evaluate(() => !!document.querySelector('.brew-page')?.contains(document.activeElement));
    assert(brewFocus);
    await page.mouse.move(20, 450); await page.mouse.wheel({ deltaY: 400 }); await twoFrames(page);
    snapshots.brewdayScroll = await page.$eval('.brew-page main', e => ({ top: e.scrollTop, overflow: e.scrollHeight > e.clientHeight }));
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-brewday-recette-figee.png'), fullPage: false });
    await page.keyboard.press('Tab');
    const brewTab = await page.evaluate(() => !!document.activeElement?.closest('.brew-page'));
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    const brewShift = await page.evaluate(() => !!document.activeElement?.closest('.brew-page'));
    assert(brewTab && brewShift);
    snapshots.beforeBrewEscape = await page.evaluate(() => {
      window.__lunaQA.escape = [];
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') window.__lunaQA.escape.push({ prevented: e.defaultPrevented, target: e.target.outerHTML.slice(0, 600) });
      });
      return { focus: document.activeElement?.outerHTML, dialogs: [...document.querySelectorAll('dialog[open],[role="dialog"],[role="alertdialog"]')].map(e => ({html:e.outerHTML.slice(0, 1000),display:getComputedStyle(e).display,inert:!!e.closest('[inert]')})) };
    });
    await page.keyboard.press('Escape');
    await waitBatchList(page); const focusAfterBrewEscape = await page.evaluate(() => { const active = document.activeElement; return { tag: active?.tagName, ariaLabel: active?.getAttribute('aria-label'), inBatchCard: !!active?.closest('article[aria-label^="Brassin "]') }; }); const focusReturnedFromBrew = focusAfterBrewEscape.inBatchCard && focusAfterBrewEscape.ariaLabel?.endsWith(' · ' + batchId); checks.push({ check: 'Escape ferme BrewDay et rend le focus à l’action de brassin', pass: focusReturnedFromBrew, focusAfterBrewEscape }); assert(focusReturnedFromBrew, 'Le focus BrewDay doit revenir à son contrôle d’ouverture.');
    checks.push({ check: 'focus initial, scroll, clavier et Escape dans la PageShell BrewDay', pass: !snapshots.brewdayScroll.overflow || snapshots.brewdayScroll.top > 0, scroll: snapshots.brewdayScroll });
    const batchActionForReopen = 'article[aria-label*="' + batchId + '"] button[aria-label$="· ' + batchId + '"]';
    const secondBrewOpen = await beginClick(page, batchActionForReopen, 'open-brewday', 'Rouvrir le déroulé');
    await page.waitForSelector('.brew-page nav[aria-label="Vues du brassin"]', { visible: true });
    timings.push(await finishTiming(page, secondBrewOpen));
    await historyBackTo(page, waitBatchList);
    const batchListState = await page.evaluate(id => {
      const selected = [...document.querySelectorAll('[role="group"][aria-label="Vue de production"] button[aria-pressed="true"], [role="group"][aria-label="Atelier de brassage"] button[aria-pressed="true"]')][0];
      const card = [...document.querySelectorAll('article[aria-label^="Brassin "]')].find(node => node.getAttribute('aria-label').includes(id));
      return { pageShellGone: !document.querySelector('.brew-page'), selectedSubtab: selected?.getAttribute('aria-label') || null,
        batchCard: card ? { visible: !!card.getClientRects().length, ariaLabel: card.getAttribute('aria-label'),
          actionLabels: [...card.querySelectorAll('button[aria-label]')].map(button => button.getAttribute('aria-label')) } : null };
    }, batchId);
    snapshots.batchListAfterHistoryBack = batchListState;
    checks.push({ check: 'retour navigateur depuis BrewDay réaffiche Brassins et la carte', pass: batchListState.pageShellGone &&
      batchListState.selectedSubtab?.startsWith('Brassins') && batchListState.batchCard?.visible, batchListState });
    assert(batchListState.pageShellGone && batchListState.selectedSubtab?.startsWith('Brassins') && batchListState.batchCard?.visible,
      'Le retour navigateur doit réafficher Brassins et le brassin enregistré.');    assert.equal(externalAttempts.length, 0);
    const errors = consoleErrors.filter(e => e.width === width);
    assert.equal(errors.length, 0, "Console sans erreurs d'application.");
    const viewportResult = {
      width, environment: width < 500 ? 'viewport mobile émulé dans Chromium desktop; pas Android physique' : 'Chrome desktop local',
      checks, timings, editEntryWrites, snapshots, diagnostic: {
        actions: diagnosticActions, leaks, network: externalAttempts.length, platform: diagnostic.environment.platform,
        viewport: diagnostic.environment.viewport, serviceWorkerControlled: diagnostic.environment.serviceWorkerControlled
      }, externalRequestAttempts: externalAttempts.length, consoleErrors: errors, limits
    };
    const failedChecks = checks.filter(check => !check.pass); assert.equal(failedChecks.length, 0, 'Contrôles fonctionnels en échec: ' + JSON.stringify(failedChecks));
    result.viewports.push(viewportResult);
    await writeFile(resolve(outputDir, 'luna-' + width + '-results.json'), JSON.stringify(viewportResult, null, 2));
    await context.close();
  } catch (error) {
    const failureState = await page.evaluate(() => ({
      text: document.body.innerText, focus: document.activeElement?.outerHTML,
      pages: [...document.querySelectorAll('[data-page-shell]')].map(e => e.className),
      escape: window.__lunaQA.escape, history: window.__lunaQA.history,
      overlays: [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],[role="alert"],[data-page-overlay]')]
        .map(e => ({ html: e.outerHTML.slice(0, 2000), displayed: !!e.getClientRects().length, style: getComputedStyle(e).display }))
    }));
    await page.screenshot({ path: resolve(outputDir, 'luna-' + width + '-failure.png') });
    await writeFile(resolve(outputDir, 'luna-' + width + '-failure.json'), JSON.stringify({
      width, checks, timings, editEntryWrites, snapshots, failureState, failure: error.stack || String(error),
      consoleErrors: consoleErrors.filter(e => e.width === width)
    }, null, 2));
    await context.close();
    throw error;
  }
};

try {
  result.environment = {
    url: baseUrl, buildDir, browser: await browser.version(), widths,
    execution: "Chromium headless PC; 390 px n'est qu'une émulation de viewport.",
    data: 'Fixtures synthétiques; QA local remplace Firestore et Functions. Aucune requête externe autorisée.',
    scope: 'Contrats fonctionnels et quelques timings de gestes utiles; aucun profil ni série de performance.'
  };
  for (const width of widths) await runViewport(width);
  await writeFile(resolve(outputDir, 'luna-functional-results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ outputDir, environment: result.environment,
    viewports: result.viewports.map(v => ({ width: v.width, checks: v.checks.length, timings: v.timings,
      editEntryWrites: v.editEntryWrites, snapshots: v.snapshots, diagnostic: v.diagnostic })) }, null, 2));
} catch (error) {
  result.failure = error.stack || String(error);
  await writeFile(resolve(outputDir, 'luna-functional-failure.json'), JSON.stringify(result, null, 2));
  throw error;
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
