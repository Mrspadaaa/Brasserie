// End-to-end navigation on the real App + HopV55Host + Page. Only identity,
// Firestore, Functions and migration are isolated by the existing QA shims.
// All browser requests outside this localhost fixture are aborted.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildHopV55AppQa } from './build-hop-v55-app-qa.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mission = resolve(root, 'work/houblons-v55-integration-app-2026-10-02');
const evidenceRoot = resolve(mission, 'luna-explorer/app-qa');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const selectedFlow = process.env.HOP_V55_APP_QA_FLOW || 'full';
const expectedManifestSha256 = process.env.HOP_V55_APP_QA_EXPECTED_MANIFEST_SHA256;
const explicitBuildDirectory = process.env.HOP_V55_APP_QA_BUILD_DIR;
assert(['full', 'host-copy-alert'].includes(selectedFlow), 'Parcours QA inconnu.');
if (selectedFlow !== 'full') assert.equal(process.env.HOP_V55_APP_QA_SKIP_BUILD, '1', 'Un parcours ciblé doit utiliser un build QA gelé.');
if (selectedFlow === 'host-copy-alert') assert(explicitBuildDirectory, 'Le parcours ciblé exige le chemin explicite de son gel QA.');
await mkdir(evidenceRoot, { recursive: true });
const runDirectory = await mkdtemp(resolve(evidenceRoot, 'run-'));
let buildPointer;
if (process.env.HOP_V55_APP_QA_SKIP_BUILD === '1') {
  if (explicitBuildDirectory) buildPointer = { path: resolve(explicitBuildDirectory) };
  else buildPointer = JSON.parse(await readFile(resolve(mission, 'last-hop-v55-app-qa-build.json'), 'utf8'));
} else {
  buildPointer = { path: await buildHopV55AppQa() };
}
const buildDirectory = resolve(buildPointer.path);
if (!buildDirectory.startsWith(mission + sep) || !buildDirectory.includes('qa-app-build-')) {
  throw Error('Le navigateur ne peut servir qu’un build QA isolé de cette mission.');
}
const manifestBytes = await readFile(resolve(buildDirectory, 'manifest.json'));
if (buildPointer.manifestSha256) assert.equal(sha256(manifestBytes), buildPointer.manifestSha256, 'Manifest du build QA modifié après compilation.');
if (expectedManifestSha256) assert.equal(sha256(manifestBytes), expectedManifestSha256, 'Le build servi ne correspond pas au SHA explicitement demandé.');
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.format, 'hop-v55-real-app-local-qa-v1');
assert.equal(manifest.entry, '/tests/qa/hop-v55-app/index.html');
assert(!manifest.sources.some(row => /src\/data\/seedData\.ts$/i.test(row.path)), 'Le seed privé ne doit jamais entrer dans le build QA.');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405); response.end(); return;
    }
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const path = decodeURIComponent(url.pathname);
    const file = resolve(buildDirectory, path === '/' ? 'tests/qa/hop-v55-app/index.html' : '.' + path);
    if (!file.startsWith(buildDirectory + sep)) { response.writeHead(403); response.end(); return; }
    const bytes = await readFile(file);
    response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404); response.end('Fichier du build QA absent.');
  }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const base = 'http://127.0.0.1:' + server.address().port;
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
await access(executablePath);
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--mute-audio', '--no-sandbox', '--disable-dev-shm-usage'],
});

const reports = [];
const allExternalAttempts = [];
const allRemoteResponses = [];
const pageErrors = [];
const consoleErrors = [];

async function clickButton(page, label, options = {}) {
  const handle = await page.waitForFunction((label, options) => {
    const scope = options.scope ? document.querySelector(options.scope) : document;
    if (!scope) return null;
    return [...scope.querySelectorAll('button')].find(button => {
      const shown = button.getClientRects().length > 0 && getComputedStyle(button).visibility !== 'hidden';
      if (!shown || button.disabled) return false;
      const text = (button.textContent ?? '').trim().replace(/\s+/g, ' ');
      const aria = button.getAttribute('aria-label') ?? '';
      if (options.ariaOnly) return options.exact ? aria === label : aria.includes(label);
      if (options.ariaPrefix) return aria.startsWith(label);
      return options.exact ? text === label || aria === label : text.includes(label) || aria.includes(label);
    }) ?? null;
  }, { timeout: options.timeout ?? 18000 }, label, options);
  const element = handle.asElement();
  assert(element, 'Bouton absent ou non visible : ' + label);
  if (label === 'Comparer ce réglage') await page.evaluate(() => {
    window.__hopV55QaClickTrace = { clicks: [], submits: [] };
    document.addEventListener('click', event => {
      const button = event.target?.closest?.('button');
      if (button) window.__hopV55QaClickTrace.clicks.push({ text: button.textContent?.trim(), type: button.type, disabled: button.disabled });
    }, true);
    document.addEventListener('submit', event => {
      window.__hopV55QaClickTrace.submits.push({ phase: 'bubble', id: event.target?.id ?? '', className: event.target?.className ?? '',
        submitter: event.submitter?.textContent?.trim() ?? '', prevented: event.defaultPrevented });
    }, false);
  });
  await element.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await element.click();
  await handle.dispose();
}

async function clickSelector(page, selector) {
  const handle = await page.waitForSelector(selector, { visible: true, timeout: 18000 });
  await handle.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await handle.click();
}

async function fill(page, selector, value) {
  const field = page.locator(selector);
  await field.fill(value);
}

async function selectValue(page, selector, value) {
  const field = await page.waitForSelector(selector, { visible: true, timeout: 18000 });
  await field.select(value);
}

async function selectOptionByText(page, selector, text) {
  const field = await page.waitForSelector(selector, { visible: true, timeout: 18000 });
  const value = await field.evaluate((select, text) =>
    [...select.options].find(option => (option.textContent ?? '').includes(text))?.value ?? '', text);
  assert(value, 'Option de fixture absente dans ' + selector + ' : ' + text);
  await field.select(value);
}

async function prepareWhirlpoolBranch(page, label) {
  await clickButton(page, 'Régler ou comparer le programme', { exact: true });
  await page.waitForSelector('#hv-program-editor select[aria-label="Geste"]', { visible: true, timeout: 18000 });
  await selectValue(page, '#hv-program-editor select[aria-label="Geste"]', 'append');
  await fill(page, '#hv-program-editor [aria-label="Nom du scénario"]', label);
  await selectOptionByText(page, '#hv-program-editor select[aria-label="Matière du réglage"]', 'Houblon QA Vallon 7');
  await fill(page, '#hv-program-editor [aria-label="Masse du réglage"]', '3');
  await selectValue(page, '#hv-program-editor select[aria-label="Emploi du réglage"]', 'postFermentation');
  await fill(page, '#hv-program-editor [aria-label="Contact du réglage"]', '48');
  await fill(page, '#hv-program-editor [aria-label="Température du réglage"]', '12');
  await clickButton(page, 'Comparer ce réglage', { exact: true, scope: '#hv-program-editor' });
  await page.waitForFunction(() => {
    const comparison = document.querySelector('.hv55-comparison');
    const error = document.querySelector('#hv-program-editor [role="alert"]');
    return (comparison && comparison.getClientRects().length > 0)
      || (error && error.getClientRects().length > 0);
  }, { timeout: 8000 }).catch(async () => {
    const controls = await page.$eval('#hv-program-editor', form => [...form.querySelectorAll('input, select, textarea')].map(control => ({
      label: control.getAttribute('aria-label') ?? control.labels?.[0]?.textContent?.trim() ?? '',
      value: control.value,
      valid: control.checkValidity(),
      type: control.getAttribute('type') ?? control.tagName.toLowerCase(),
    })));
    const errors = await page.$$eval('#hv-program-editor [role="alert"]', nodes => nodes
      .filter(node => node.getClientRects().length > 0)
      .map(node => node.textContent?.trim() ?? ''));
    const trace = await page.evaluate(() => window.__hopV55QaClickTrace ?? null);
    const liveErrors = await page.$$eval('.hv-live [role="alert"]', nodes => nodes
      .filter(node => node.getClientRects().length > 0)
      .map(node => node.textContent?.trim() ?? ''));
    throw Error('Le formulaire n’a produit ni comparaison ni message de validation : ' + JSON.stringify({ controls, errors, liveErrors, trace }));
  });
  const message = await page.$eval('#hv-program-editor [role="alert"]', node => node.textContent?.trim() ?? '').catch(() => '');
  if (message) throw Error('Le programme fixture est refusé : ' + message);
}

async function chooseSummary(page, label, open = true) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('summary')].find(node =>
    node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden'
      && node.textContent.replace(/\s+/g, ' ').includes(label)), { timeout: 18000 }, label);
  const current = await handle.evaluate(node => node.parentElement?.open ?? false);
  if (current !== open) {
    await handle.asElement().evaluate(node => node.scrollIntoView({ block: 'center' }));
    await handle.asElement().click();
  }
  await handle.dispose();
}

async function waitForText(page, selector, text, timeout = 18000) {
  await page.waitForFunction((selector, text) => [...document.querySelectorAll(selector)]
    .some(node => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden'
      && node.textContent.includes(text)), { timeout }, selector, text);
}

async function waitForNotVisible(page, selector, timeout = 18000) {
  await page.waitForFunction(selector => {
    const node = document.querySelector(selector);
    return !node || !node.getClientRects().length || getComputedStyle(node).visibility === 'hidden';
  }, { timeout }, selector);
}

async function snapshotQa(page) {
  return page.evaluate(async () => {
    const qa = window.__hopV55Qa;
    const [scenarios, workspaces] = await Promise.all([qa.localScenarios(), qa.localWorkspaces()]);
    return {
      recipes: qa.recipeSummaries(),
      batches: qa.batchSummaries(),
      scenarios: scenarios.map(row => {
        if (row.result.status !== 'available') return { scenarioId: row.scenarioId, status: row.result.status };
        const record = row.result.record;
        return {
          scenarioId: row.scenarioId,
          status: 'available',
          revisions: record.snapshots.map(snapshot => ({
            reference: snapshot.reference,
            revision: snapshot.result.revision,
            branchIds: snapshot.result.branches.map(branch => branch.id),
            baseline: {
              input: snapshot.result.baseline.input,
              facts: snapshot.result.baseline.beerContext?.facts ?? [],
              performedAdditionIds: snapshot.result.baseline.performedAdditionIds,
            },
          })),
        };
      }),
      workspaces: workspaces.map(workspace => ({
        id: workspace.id,
        title: workspace.title,
        sourceRecipeId: workspace.sourceRecipeId,
        sourceBatchId: workspace.sourceBatchId,
        scenarioIds: workspace.scenarioIds,
        decisionReadings: (workspace.decisionReadings ?? []).map(reading => ({
          id: reading.id, contentReference: reading.contentReference, recordedAt: reading.recordedAt,
          source: reading.source, question: reading.reading.intent.question,
          criteria: reading.reading.intent.criteria,
          responseKind: reading.reading.response?.actionKind ?? null,
        })),
        snapshotIntents: (workspace.snapshotIntents ?? []).map(row => ({
          scenarioId: row.scenarioId, snapshotReference: row.snapshotReference,
          question: row.intent.question, decisionReadingReference: row.decisionReadingReference ?? null,
        })),
        copies: workspace.copies.map(copy => ({ id: copy.id, recipeId: copy.recipe.id, recipeName: copy.recipe.name })),
        fullCopyReceipts: (workspace.fullCopyReceipts ?? []).map(receipt => ({
          format: receipt.format, copyId: receipt.copyId ?? null, createdAt: receipt.createdAt ?? null,
          scenarioId: receipt.scenarioId, snapshotReference: receipt.snapshotReference,
          branchId: receipt.branchId, branchReference: receipt.branchReference,
          candidateSnapshotReference: receipt.candidateSnapshotReference,
          finalRecipeId: receipt.finalRecipe?.id ?? null, finalRecipeReference: receipt.finalRecipeReference ?? null,
          sealReference: receipt.integritySeal?.reference ?? null,
        })),
        futureDrafts: (workspace.futureDrafts ?? []).map(draft => ({
          draftId: draft.draftId, revision: draft.revision, contentReference: draft.contentReference,
          originScenarioId: draft.origin.scenarioId, originSnapshotReference: draft.origin.snapshotReference,
          additions: draft.additions.map(row => ({ materialId: row.materialId, grams: row.addition.grams,
            use: row.addition.use, status: row.addition.status, sourceStatus: row.sourceStatus })),
        })),
        futureRecipeMaterializations: (workspace.futureRecipeMaterializations ?? []).map(row => ({
          recipeId: row.recipe.id, receiptReference: row.receipt.contentReference, sourceDraftReference: row.receipt.draftReference,
        })),
        futureRecipeSaveReceipts: workspace.futureRecipeSaveReceipts ?? [],
        recipeSaveReceipts: workspace.recipeSaveReceipts ?? [],
        serverScenarioReceipts: workspace.serverScenarioReceipts ?? [],
      })),
      firestore: { writes: qa.firestoreMetrics.writes, confirmations: qa.firestoreMetrics.confirmations,
        rejectNextRecipe: qa.firestoreMetrics.rejectNextRecipe },
      functionCalls: [...qa.functionCalls],
    };
  });
}

function assertNoRemoteServiceCalls(state, width) {
  const prohibited = state.functionCalls.filter(name =>
    ['readBrewingScenario', 'writeBrewingScenario', 'aiTask'].includes(name));
  assert.deepEqual(prohibited, [], 'Aucun callable serveur ou modèle payant ne doit être appelé à ' + width + ' px.');
  assert(state.workspaces.every(workspace => workspace.serverScenarioReceipts.length === 0),
    'La QA ne fabrique aucun reçu serveur de scénario.');
}

async function capture(page, name, width, directory) {
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    title: document.title,
  }));
  assert(metrics.documentWidth <= metrics.viewport + 1 && metrics.bodyWidth <= metrics.viewport + 1,
    'Débordement horizontal à ' + width + ' px : document ' + metrics.documentWidth + ', body ' + metrics.bodyWidth);
  const path = resolve(directory, name + '.png');
  await page.screenshot({ path, captureBeyondViewport: false });
  return { kind: 'capture', width, file: name + '.png', ...metrics };
}

async function captureHostAlert(page, name, width, directory) {
  await page.$eval('.hv-host-write-error', node => node.scrollIntoView({ block: 'start', inline: 'nearest' }));
  return capture(page, name, width, directory);
}

async function closeCurrentBrewDay(page) {
  const handle = await page.waitForFunction(() => {
    const shell = [...document.querySelectorAll('[data-page-shell]')]
      .filter(node => node.querySelector('.brew-layout') && node.getClientRects().length > 0)
      .at(-1);
    const button = shell?.querySelector('button[aria-label="Fermer"]');
    return button && button.getClientRects().length > 0 && !button.disabled ? button : null;
  }, { timeout: 10000 });
  const button = handle.asElement();
  assert(button, 'Bouton de fermeture du BrewDay actif absent.');
  const before = await button.evaluate(node => ({
    shellText: node.closest('[data-page-shell]')?.innerText?.slice(0, 260) ?? '',
    aria: node.getAttribute('aria-label'), disabled: node.disabled, rect: node.getBoundingClientRect().toJSON(),
  }));
  const historyBefore = await page.evaluate(() => ({ length: history.length, url: location.href, state: history.state }));
  await page.evaluate(() => {
    const debug = { backCalls: 0, popstates: 0 };
    const back = history.back.bind(history);
    history.back = () => { debug.backCalls += 1; return back(); };
    window.addEventListener('popstate', () => { debug.popstates += 1; });
    window.__hopV55CloseDebug = debug;
  });
  await handle.dispose();
  const clicks = [];
  let after;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const activeClose = await page.waitForFunction(() => {
      const shell = [...document.querySelectorAll('[data-page-shell]')]
        .filter(node => node.querySelector('.brew-layout') && node.getClientRects().length > 0)
        .at(-1);
      const candidate = shell?.querySelector('button[aria-label="Fermer"]');
      return candidate && candidate.getClientRects().length > 0 && !candidate.disabled ? candidate : null;
    }, { timeout: 10000 });
    const activeButton = activeClose.asElement();
    assert(activeButton, 'Bouton de fermeture du BrewDay actif absent.');
    await activeButton.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await activeButton.click();
    await activeClose.dispose();
    await new Promise(resolveDelay => setTimeout(resolveDelay, 500));
    after = await page.evaluate(() => ({
      length: history.length, url: location.href, state: history.state,
      debug: window.__hopV55CloseDebug,
      brewLayoutCount: document.querySelectorAll('.brew-layout').length,
      pageShells: [...document.querySelectorAll('[data-page-shell]')].map(node => (node.innerText ?? '').slice(0, 140)),
    }));
    clicks.push({ attempt: attempt + 1, historyBackCalls: after.debug?.backCalls ?? 0,
      brewLayoutCount: after.brewLayoutCount });
    if ((after.debug?.backCalls ?? 0) > 0 || after.brewLayoutCount === 0) break;
  }
  return { ...before, historyBefore, closeClicks: clicks, historyAfter: after };
}

async function runHostCopyAlertJourney(page, record, width) {
  const seeded = await page.evaluate(() => window.__hopV55Qa.seedFixtures());
  const originalRecipe = await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId);
  const originalBatch = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
  assert(originalRecipe && originalBatch, 'Les deux objets de la fixture synthétique doivent être présents.');
  assert.equal(originalBatch.status, 'planifie', 'Le brassin commence comme planifié.');
  record.initialBatch = { id: originalBatch.id, status: originalBatch.status, brewDay: originalBatch.brewDay ?? null };

  await clickButton(page, 'Brassins', { ariaPrefix: true });
  await page.waitForFunction(id => [...document.querySelectorAll('button')].some(button => {
    const label = button.getAttribute('aria-label') ?? '';
    return button.getClientRects().length && label.endsWith(' · ' + id) && /^(Préparer|Reprendre) le brassage/.test(label);
  }), { timeout: 20000 }, seeded.batchId);
  const batchAction = await page.$eval('button[aria-label$=" · QA-V55-BATCH"]', button => button.getAttribute('aria-label') ?? '');
  record.batchCardBeforeJournal = await page.$eval(`[aria-label=${JSON.stringify(batchAction)}]`, button => ({
    action: button.getAttribute('aria-label') ?? '', text: button.closest('article')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }));
  await clickButton(page, batchAction, { ariaOnly: true, exact: true });
  await page.waitForFunction(() => [...document.querySelectorAll('button')]
    .some(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Ajouter une note'), { timeout: 20000 });
  const journalNote = 'QA Host · note synthétique à retrouver après le retour';
  await clickButton(page, 'Ajouter une note', { ariaOnly: true, exact: true });
  await fill(page, 'textarea[aria-label="Carnet de cuve"]', journalNote);
  await clickButton(page, 'Noter', { scope: 'section[aria-label="Notes et conseil"]', exact: true });
  await page.waitForFunction(async note => (await window.__hopV55Qa.batch('QA-V55-BATCH'))?.brewDay?.notes?.some(item => item.text === note),
    { timeout: 12000 }, journalNote);
  await clickButton(page, 'Relever une mesure', { ariaOnly: true, exact: true });
  await clickButton(page, 'Densité', { ariaOnly: true, exact: true });
  await fill(page, '#brew-reading', '1,047');
  await clickButton(page, 'Noter', { scope: 'section[aria-label="Mesures de cette étape"]', exact: true });
  await page.waitForFunction(async () => (await window.__hopV55Qa.batch('QA-V55-BATCH'))?.brewDay?.readings?.some(
    reading => Math.abs(reading.value - 1.047) < 0.000001), { timeout: 12000 });
  const captureClose = await page.$('button[aria-label="Fermer la saisie"]');
  if (captureClose && await captureClose.evaluate(button => button.getClientRects().length > 0)) await captureClose.click();
  const batchBeforeCopy = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
  assert(batchBeforeCopy?.brewDay?.notes?.some(item => item.text === journalNote));
  assert(batchBeforeCopy?.brewDay?.readings?.some(reading => Math.abs(reading.value - 1.047) < 0.000001));
  record.batchBeforeCopy = { id: batchBeforeCopy.id, status: batchBeforeCopy.status, brewStartedAt: batchBeforeCopy.brewStartedAt ?? null,
    brewDay: batchBeforeCopy.brewDay };
  record.brewDayCloseTarget = await closeCurrentBrewDay(page);
  await page.waitForFunction(() => !document.querySelector('.brew-layout')?.getClientRects().length, { timeout: 12000 });
  await page.waitForFunction(() => [...document.querySelectorAll('button')]
    .some(button => button.getClientRects().length && (button.getAttribute('aria-label') ?? '').startsWith('Recettes')));
  record.batchCardAfterJournal = await page.$eval('button[aria-label$=" · QA-V55-BATCH"]', button => ({
    action: button.getAttribute('aria-label') ?? '', text: button.closest('article')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }));

  await clickButton(page, 'Recettes', { ariaPrefix: true });
  await page.waitForFunction(name => [...document.querySelectorAll('button')].some(button =>
    button.getClientRects().length && button.getAttribute('aria-label') === 'Ouvrir la recette ' + name), { timeout: 20000 }, seeded.recipeName);
  await clickButton(page, 'Ouvrir la recette ' + seeded.recipeName, { ariaOnly: true, exact: true });
  await waitForText(page, 'h1', seeded.recipeName);
  await chooseSummary(page, 'Potentiel aromatique', true);
  await clickButton(page, 'Ouvrir l’atelier Houblons V5.5', { exact: true });
  await waitForText(page, '.hv-context strong', seeded.recipeName);
  await clickButton(page, 'Décider', { exact: true, scope: '.hv-nav' });
  const question = 'Plus de poire, préserver le floral, ne pas augmenter l’amertume.';
  await fill(page, '[aria-label="Question au brasseur"]', question);
  await clickButton(page, 'Lire ma question', { exact: true });
  await waitForText(page, '.hv-decision__question', question);
  await clickButton(page, 'Ma bière', { exact: true, scope: '.hv-nav' });
  await prepareWhirlpoolBranch(page, 'QA · branche pour vérifier l’alerte Host');
  await page.waitForSelector('.hv55-comparison', { visible: true, timeout: 25000 });
  const branchHandle = await page.waitForFunction(label => {
    const card = [...document.querySelectorAll('.hv55-cmp-branch')]
      .find(node => (node.textContent ?? '').includes(label) && node.querySelector('.hv55-cmp-choose'));
    return card?.querySelector('.hv55-cmp-choose') ?? null;
  }, { timeout: 20000 }, 'QA · branche pour vérifier l’alerte Host');
  await branchHandle.asElement().evaluate(button => button.scrollIntoView({ block: 'center' }));
  await branchHandle.asElement().click();
  await branchHandle.dispose();
  await page.waitForSelector('.hv-choice', { visible: true, timeout: 18000 });
  await page.waitForSelector('section.hv-full-copy form', { visible: true, timeout: 20000 });
  await fill(page, '[aria-label="Nom de la nouvelle recette"]', 'Recette QA · retry et alerte Host');
  await clickButton(page, 'Prévisualiser la copie complète', { exact: true });
  await page.waitForFunction(() => document.querySelector('.hv-copy-preview')
    || document.querySelectorAll('[aria-label^="Alpha de travail"]').length > 0
    || [...document.querySelectorAll('[role="alert"]')].some(node => node.getClientRects().length), { timeout: 20000 });
  const alphaFields = await page.$$eval('.hv-full-copy .hv-copy-alpha', blocks => blocks.map(block => ({
    alpha: block.querySelector('[aria-label^="Alpha de travail"]')?.getAttribute('aria-label') ?? '',
    value: block.querySelector('[aria-label^="Alpha de travail"]')?.value ?? '',
    reason: block.querySelector('[aria-label^="Motif alpha pour"]')?.getAttribute('aria-label') ?? '',
  })).filter(row => row.alpha));
  record.copyAlphaFieldsBeforeChoice = alphaFields;
  for (const field of alphaFields.filter(row => !row.value)) {
    assert(field.reason, 'Chaque alpha inconnu demandé par la fixture possède son champ de motif.');
    await fill(page, `[aria-label=${JSON.stringify(field.alpha)}]`, '5,125');
    await fill(page, `[aria-label=${JSON.stringify(field.reason)}]`, 'Hypothèse synthétique de QA, aucune analyse de la matière');
    record.copyAlphaAssumptions ??= [];
    record.copyAlphaAssumptions.push({ label: field.alpha, value: '5,125', reason: 'Hypothèse synthétique de QA, aucune analyse de la matière' });
  }
  if (alphaFields.some(row => !row.value)) await clickButton(page, 'Prévisualiser la copie complète', { exact: true });
  await page.waitForSelector('.hv-copy-preview', { visible: true, timeout: 20000 });
  const previewText = await page.$eval('.hv-copy-preview', node => node.textContent ?? '');
  assert(previewText.includes('Recette QA · retry et alerte Host'), 'L’aperçu garde le nom explicite de la copie.');
  record.copyPreview = previewText.slice(0, 2400);
  await clickButton(page, 'Créer la copie complète locale', { exact: true });
  await page.waitForFunction(async id => (await window.__hopV55Qa.localWorkspaces()).some(workspace =>
    workspace.sourceRecipeId === id && workspace.copies.length > 0), { timeout: 25000 }, seeded.recipeId);
  const beforeRefusal = await snapshotQa(page);
  const copyWorkspaceBefore = beforeRefusal.workspaces.find(workspace => workspace.sourceRecipeId === seeded.recipeId && workspace.copies.length > 0);
  const localCopy = copyWorkspaceBefore?.copies.at(-1);
  const copyId = localCopy?.id;
  assert(copyId && localCopy.recipeId !== seeded.recipeId, 'La copie locale porte un ID propre avant la tentative d’enregistrement.');
  const fullCopyReceipt = copyWorkspaceBefore.fullCopyReceipts.find(receipt => receipt.copyId === copyId);
  assert(fullCopyReceipt?.sealReference, 'La copie V2 garde son reçu avant la sauvegarde au carnet.');
  const sourceBeforeSave = await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId);

  await page.evaluate(() => window.__hopV55Qa.rejectNextRecipeSave());
  await clickButton(page, 'Enregistrer comme nouvelle recette', { exact: true });
  await page.waitForFunction(() => {
    const alert = document.querySelector('.hv-host-write-error');
    return alert?.getClientRects().length && /QA : enregistrement refusé/i.test(alert.textContent ?? '');
  }, { timeout: 18000 });
  const refusalText = await page.$eval('.hv-host-write-error p', node => node.textContent?.trim() ?? '');
  assert(refusalText.includes('Le brouillon est conservé.'), 'L’alerte Host explique que le brouillon reste conservé.');
  const refusalAlertCount = await page.$$eval('[role="alert"]', nodes => nodes.filter(node =>
    node.getClientRects().length && (node.textContent ?? '').includes('QA : enregistrement refusé')).length);
  assert.equal(refusalAlertCount, 1, 'Le même refus doit apparaître une seule fois dans le flux Host/Page.');
  const closeAtelierAfterRefusal = await page.$('.hv-titleline button[aria-label="Fermer l’atelier"]');
  assert(closeAtelierAfterRefusal && await closeAtelierAfterRefusal.evaluate(button => button.getClientRects().length > 0 && !button.disabled),
    'La fermeture de l’atelier reste accessible après le refus.');
  const refused = await snapshotQa(page);
  const refusedWorkspace = refused.workspaces.find(workspace => workspace.sourceRecipeId === seeded.recipeId && workspace.copies.some(copy => copy.id === copyId));
  assert(refusedWorkspace?.copies.some(copy => copy.id === copyId));
  assert.deepEqual(refusedWorkspace.fullCopyReceipts.find(receipt => receipt.copyId === copyId), fullCopyReceipt);
  assert(!refusedWorkspace.recipeSaveReceipts.some(receipt => receipt.copyId === copyId));
  assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), sourceBeforeSave);
  record.refusal = { alert: refusalText, matchingAlertCount: refusalAlertCount, closeAtelierAccessible: true,
    copyId, recipeSaveReceiptCount: refusedWorkspace.recipeSaveReceipts.length };
  record.steps.push('Refus fixture : texte partagé rendu une fois dans le Host, fermeture accessible, copie/reçu conservés et source intacte.');
  record.captures.push(await captureHostAlert(page, 'app-' + width + '-host-refus-alerte-visible', width, runDirectory));

  await clickButton(page, 'Enregistrer comme nouvelle recette', { exact: true });
  await page.waitForFunction(async (copyId, recipeId) => {
    const workspaces = await window.__hopV55Qa.localWorkspaces();
    return workspaces.some(workspace => workspace.sourceRecipeId === 'QA-V55-RECIPE'
      && workspace.recipeSaveReceipts?.some(receipt => receipt.copyId === copyId && receipt.recipeId === recipeId));
  }, { timeout: 30000 }, copyId, localCopy.recipeId);
  await page.waitForFunction(() => [...document.querySelectorAll('.hv-live [role="status"]')]
    .some(node => /Sauvegarde de recette confirmée\./i.test(node.textContent ?? ''))
    || [...document.querySelectorAll('.hv-copy')].some(node => /Recette confirmée/.test(node.textContent ?? '')), { timeout: 12000 });
  const afterRetry = await snapshotQa(page);
  const confirmedWorkspace = afterRetry.workspaces.find(workspace => workspace.sourceRecipeId === seeded.recipeId && workspace.copies.some(copy => copy.id === copyId));
  const recipeReceipt = confirmedWorkspace?.recipeSaveReceipts.find(receipt => receipt.copyId === copyId);
  assert(recipeReceipt && recipeReceipt.recipeId === localCopy.recipeId, 'Le retry confirme la même copie locale.');
  assert.deepEqual(confirmedWorkspace.fullCopyReceipts.find(receipt => receipt.copyId === copyId), fullCopyReceipt,
    'Le retry ne remplace pas le reçu de copie.');
  assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), sourceBeforeSave,
    'Le retry n’altère pas la recette source.');
  assert(await page.evaluate(id => window.__hopV55Qa.fireStoreFixture.find('recipes', id), localCopy.recipeId),
    'Le callback relit la copie via l’adaptateur Firestore fixture; aucun transport serveur n’est impliqué.');
  const successUi = await page.$eval('.hv-live', node => node.textContent?.replace(/\s+/g, ' ').trim() ?? '').catch(() => '');
  const copyCardUi = await page.$eval('.hv-copy', node => node.textContent?.replace(/\s+/g, ' ').trim() ?? '').catch(() => '');
  const neutralSuccess = `${successUi} ${copyCardUi}`.trim();
  assert(/Sauvegarde de recette confirmée\.|Recette confirmée/.test(neutralSuccess), 'Le callback doit afficher le succès neutre convenu.');
  assert(!/confirmée? par le serveur|reçu serveur/i.test(neutralSuccess), 'Le succès UI ne doit pas revendiquer de reçu serveur.');
  const retryAlert = await page.$eval('.hv-host-write-error p', node => node.textContent?.trim() ?? '').catch(() => '');
  assert.equal(retryAlert, refusalText, 'Le message de refus reste visible après le retry confirmé, jusqu’au geste de fermeture.');
  const retryAlertCount = await page.$$eval('[role="alert"]', nodes => nodes.filter(node =>
    node.getClientRects().length && (node.textContent ?? '').includes('QA : enregistrement refusé')).length);
  assert.equal(retryAlertCount, 1, 'Après retry, le message partagé reste une seule alerte Host/Page.');
  const closeAtelierAfterRetry = await page.$('.hv-titleline button[aria-label="Fermer l’atelier"]');
  assert(closeAtelierAfterRetry && await closeAtelierAfterRetry.evaluate(button => button.getClientRects().length > 0 && !button.disabled),
    'La fermeture de l’atelier reste accessible après le retry confirmé.');
  record.retry = { sameCopyId: copyId, recipeId: recipeReceipt.recipeId, sameCopyReceipt: true,
    fixtureReadback: true, neutralSuccess, hostAlertStillVisible: !!retryAlert,
    matchingAlertCount: retryAlertCount, closeAtelierAccessible: true };
  record.steps.push('Retry et readback fixture terminés : même ID/reçu, succès neutre, alerte unique toujours à acquitter.');
  record.captures.push(await captureHostAlert(page, 'app-' + width + '-host-retry-confirme-alerte-visible', width, runDirectory));

  await clickButton(page, 'Fermer ce message', { exact: true, scope: '.hv-host-write-error' });
  await waitForNotVisible(page, '.hv-host-write-error');
  assert(await page.$('[data-testid="hop-v55"]'), 'Le dismiss de l’alerte garde l’atelier ouvert.');
  record.steps.push('Fermeture explicite du message : l’alerte disparaît et l’atelier reste ouvert.');
  await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
  await waitForText(page, 'h1', seeded.recipeName);
  assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), sourceBeforeSave,
    'Fermer l’atelier revient à la recette source exacte inchangée.');
  await clickButton(page, 'Fermer', { ariaOnly: true, exact: true });
  await page.waitForFunction(() => [...document.querySelectorAll('button')]
    .some(button => button.getClientRects().length && (button.getAttribute('aria-label') ?? '').startsWith('Brassins')));
  await clickButton(page, 'Brassins', { ariaPrefix: true });
  await page.waitForFunction(id => [...document.querySelectorAll('button')].some(button => {
    const label = button.getAttribute('aria-label') ?? '';
    return button.getClientRects().length && label.endsWith(' · ' + id) && /^(Préparer|Reprendre) le brassage/.test(label);
  }), { timeout: 20000 }, seeded.batchId);
  const batchCard = await page.$eval('button[aria-label$=" · QA-V55-BATCH"]', button => ({
    action: button.getAttribute('aria-label') ?? '', text: button.closest('article')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }));
  record.batchCardAfterRetry = batchCard;
  const batchAfterRetry = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
  record.batchAfterRetry = { id: batchAfterRetry.id, status: batchAfterRetry.status, brewStartedAt: batchAfterRetry.brewStartedAt ?? null,
    brewDay: batchAfterRetry.brewDay ?? null };
  assert.deepEqual(batchAfterRetry, batchBeforeCopy, 'La copie et son retry ne changent ni le brassin ni son journal.');
  await clickButton(page, batchCard.action, { ariaOnly: true, exact: true });
  await page.waitForFunction(() => [...document.querySelectorAll('button')]
    .some(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Journal'), { timeout: 20000 });
  await clickButton(page, 'Journal', { ariaOnly: true, exact: true });
  await waitForText(page, '[aria-label="Journal modifiable"]', journalNote);
  await waitForText(page, '[aria-label="Journal modifiable"]', '1.047');
  assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId), batchBeforeCopy,
    'Le retour BrewDay restaure le même brassin et le snapshot de journal.');
  record.steps.push('Retour à BrewDay : même brassin planifié, note et densité 1,047 conservées à l’identique.');
  record.captures.push(await capture(page, 'app-' + width + '-retour-brewday-journal-inchange', width, runDirectory));

  const finalState = await snapshotQa(page);
  assertNoRemoteServiceCalls(finalState, width);
  assert.deepEqual(record.errors, [], 'Console error/pageerror pendant la tranche Host à ' + width + ' px.');
  assert.deepEqual(allRemoteResponses, [], 'Aucune réponse distante pendant la tranche Host.');
  assert.deepEqual(record.blockedExternalRequests, [], 'Aucun appel hors fixture loopback pendant la tranche Host.');
  record.firestoreFixture = finalState.firestore;
  record.functionCalls = finalState.functionCalls;
  record.localScenarioCount = finalState.scenarios.length;
  record.localWorkspaceCount = finalState.workspaces.length;
  record.remoteResponses = [...allRemoteResponses];
  return record;
}

async function testWidth(width) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const record = { width, steps: [], blockedExternalRequests: [], errors: [], warnings: [], captures: [] };
  page.on('pageerror', error => { const text = String(error?.message ?? error); pageErrors.push(text); record.errors.push(text); });
  page.on('console', message => {
    if (message.type() === 'error') { consoleErrors.push(message.text()); record.errors.push(message.text()); }
    else if (message.type() === 'warn') record.warnings.push(message.text());
  });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:') || url === 'about:blank') {
      void request.continue();
    } else {
      allExternalAttempts.push(url);
      record.blockedExternalRequests.push(url);
      void request.abort();
    }
  });
  page.on('response', response => {
    if (/^https?:/.test(response.url()) && !response.url().startsWith(base + '/')) allRemoteResponses.push(response.url());
  });
  await page.setBypassServiceWorker(true);
  await page.setViewport({ width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    localStorage.setItem('laffinee_ui_state', JSON.stringify({
      app_active_tab: 'production',
      production_subtab: 'recipes',
      app_global_time_filter: 'this-month',
    }));
  });

  try {
    await page.goto(base + manifest.entry, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopV55Qa?.ready?.(), { timeout: 30000 });
    assert(!(await page.$('vite-error-overlay')), 'Vite error overlay visible.');
    assert.equal(await page.title(), 'L’Affinée · QA local de l’atelier V5.5');
    if (selectedFlow === 'host-copy-alert') {
      await runHostCopyAlertJourney(page, record, width);
      return { record, context, page };
    }

    // Production → Atelier without a recipe selected.
    await clickButton(page, 'Atelier Houblons V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', 'Explorer sans recette');
    record.steps.push('production → atelier sans recette');
    record.captures.push(await capture(page, 'app-' + width + '-atelier-sans-recette', width, runDirectory));
    const rootQuestion = 'Je veux examiner les descriptions de poire et préserver le floral, sans augmenter l’amertume.';
    await clickButton(page, 'Décider', { exact: true, scope: '.hv-nav' });
    await fill(page, '[aria-label="Question au brasseur"]', rootQuestion);
    await clickButton(page, 'Lire ma question', { exact: true });
    await waitForText(page, '.hv-decision__question', rootQuestion);
    const rootReadState = await snapshotQa(page);
    const rootWorkspace = rootReadState.workspaces.find(workspace => !workspace.sourceRecipeId && !workspace.sourceBatchId
      && workspace.decisionReadings.some(reading => reading.question === rootQuestion));
    const rootReading = rootWorkspace?.decisionReadings.find(reading => reading.question === rootQuestion);
    assert.equal(rootReading?.source.kind, 'exploration', 'L’entrée Root conserve une portée sans source.');
    const bitternessCriterion = rootReading?.criteria.find(criterion => /amertume/i.test(criterion.label));
    assert(bitternessCriterion && bitternessCriterion.direction === 'keep', 'La garde négative « ne pas augmenter » reste un critère de préservation archivé.');
    assert.equal(rootReadState.scenarios.length, 0, 'La lecture documentaire hors recette ne déclenche pas J5.');
    assert.equal(await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count'))), 0);
    record.steps.push('Root sans source : lecture exacte et garde négative archivée avant J5');
    record.captures.push(await capture(page, 'app-' + width + '-lecture-root-sans-source', width, runDirectory));
    await page.evaluate(() => document.querySelector('.hv-decision__groups')?.scrollIntoView({ block: 'start', inline: 'nearest' }));
    record.captures.push(await capture(page, 'app-' + width + '-premieres-voies-classees', width, runDirectory));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await waitForNotVisible(page, '[data-testid="hop-v55"]');

    // Reopening the same no-source workspace restores its reading without J5.
    await clickButton(page, 'Atelier Houblons V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', 'Explorer sans recette');
    await clickButton(page, 'Décider', { exact: true, scope: '.hv-nav' });
    await page.waitForSelector('.hv-decision-response--historical', { visible: true, timeout: 20000 });
    await waitForText(page, '.hv-decision__question', rootQuestion);
    assert.equal(await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count'))), 0,
      'La relecture du dossier sans source ne relance aucun calcul.');
    record.steps.push('Relecture Root sans source : archive exacte, compteur J5 0');
    record.captures.push(await capture(page, 'app-' + width + '-archive-root-sans-source', width, runDirectory));
    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await waitForNotVisible(page, '[data-testid="hop-v55"]');

    // The only data added to the real application is an explicit synthetic fixture.
    const seeded = await page.evaluate(() => window.__hopV55Qa.seedFixtures());
    await page.waitForFunction(name => [...document.querySelectorAll('button')].some(button =>
      button.getClientRects().length && button.getAttribute('aria-label') === 'Ouvrir la recette ' + name),
    { timeout: 20000 }, seeded.recipeName);
    const originalRecipe = await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId);
    const originalRecipeB = await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeBId);
    assert(originalRecipe && originalRecipe.name === seeded.recipeName, 'Recette fixture locale enregistrée.');
    assert(originalRecipeB && originalRecipeB.name === seeded.recipeBName, 'La recette fixture B est distincte et locale.');

    // Recipe → Host → back to the identical source recipe.
    await clickButton(page, 'Ouvrir la recette ' + seeded.recipeName, { ariaOnly: true, exact: true });
    await waitForText(page, 'h1', seeded.recipeName);
    await chooseSummary(page, 'Potentiel aromatique', true);
    await clickButton(page, 'Ouvrir l’atelier Houblons V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', seeded.recipeName);
    const recipeQuestion = 'Plus de poire, préserver le floral, ne pas augmenter l’amertume.';
    await clickButton(page, 'Décider', { exact: true, scope: '.hv-nav' });
    await fill(page, '[aria-label="Question au brasseur"]', recipeQuestion);
    await clickButton(page, 'Lire ma question', { exact: true });
    await waitForText(page, '.hv-decision__question', recipeQuestion);
    const recipeReadState = await snapshotQa(page);
    const recipeWorkspace = recipeReadState.workspaces.find(workspace => workspace.sourceRecipeId === seeded.recipeId
      && workspace.decisionReadings.some(reading => reading.question === recipeQuestion));
    const recipeReading = recipeWorkspace?.decisionReadings.find(reading => reading.question === recipeQuestion);
    assert.equal(recipeReading?.source.kind, 'recipe', 'La lecture est liée à la recette source exacte A.');
    assert.equal(recipeReading?.source.id, seeded.recipeId);
    assert.equal(recipeReadState.scenarios.length, 0, 'La lecture d’intention sans geste ne déclenche pas J5.');
    record.steps.push('recette → atelier → même recette');
    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await waitForText(page, 'h1', seeded.recipeName);
    assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), originalRecipe,
      'Ouvrir puis fermer l’Atelier ne réécrit pas la recette.');
    await clickButton(page, 'Fermer', { ariaOnly: true, exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button =>
      button.getClientRects().length && (button.getAttribute('aria-label') ?? '').startsWith('Brassins')));

    // Opening workspace A from recipe B must resolve A by its exact stored source.
    await clickButton(page, 'Recettes', { ariaPrefix: true });
    await clickButton(page, 'Ouvrir la recette ' + seeded.recipeBName, { ariaOnly: true, exact: true });
    await waitForText(page, 'h1', seeded.recipeBName);
    await chooseSummary(page, 'Potentiel aromatique', true);
    await clickButton(page, 'Ouvrir l’atelier Houblons V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', seeded.recipeBName);
    const recipeBContext = await page.$eval('.hv-context', node => node.textContent ?? '');
    assert(recipeBContext.includes('12 L') && !recipeBContext.includes('20 L'), 'L’entrée B charge son volume synthétique exact.');
    record.steps.push('recette B → Host B : source et volume exacts');
    record.captures.push(await capture(page, 'app-' + width + '-atelier-recette-b', width, runDirectory));
    await clickButton(page, 'Historique', { exact: true, scope: '.hv-nav' });
    await page.waitForSelector('.hv-workspaces', { visible: true, timeout: 20000 });
    await clickButton(page, seeded.recipeName, { exact: false, scope: '.hv-workspaces' });
    await waitForText(page, '.hv-context strong', seeded.recipeName);
    const reopenedRecipeAContext = await page.$eval('.hv-context', node => node.textContent ?? '');
    assert(reopenedRecipeAContext.includes('20 L') && !reopenedRecipeAContext.includes('12 L'),
      'Ouvrir le workspace A depuis le Host B résout la source exacte A, sans repli sur B.');
    record.steps.push('Host B → workspace A : contexte source A exact, B conservée séparément');
    record.captures.push(await capture(page, 'app-' + width + '-workspace-a-ouvert-depuis-b', width, runDirectory));
    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await waitForText(page, 'h1', seeded.recipeBName);
    assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeBId), originalRecipeB, 'Le retour rouvre la recette B sans la modifier.');
    await clickButton(page, 'Fermer', { ariaOnly: true, exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button =>
      button.getClientRects().length && (button.getAttribute('aria-label') ?? '').startsWith('Brassins')));

    // The planned batch is opened through the production catalog's real action.
    await clickButton(page, 'Brassins', { ariaPrefix: true });
    await page.waitForSelector('button[aria-label="Préparer le brassage · QA-V55-BATCH"]', { visible: true, timeout: 20000 });
    const plannedBatchCard = await page.$eval('button[aria-label="Préparer le brassage · QA-V55-BATCH"]', button =>
      button.closest('article')?.textContent ?? button.parentElement?.parentElement?.textContent ?? '');
    const plannedBatch = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
    assert.equal(plannedBatch?.status, 'planifie', 'La fixture est un brassin planifié, distinct d’une opération commencée.');
    record.productionBatchCardText = plannedBatchCard.replace(/\s+/g, ' ').trim();
    assert(record.productionBatchCardText.includes('Planifié'), 'La carte Production expose explicitement le statut planifié.');
    if (/Brassage en cours/i.test(plannedBatchCard)) record.warnings.push('La carte Production étiquette « Brassage en cours » alors que le statut stocké de la fixture est planifie; test journal limité au statut planifié.');
    record.captures.push(await capture(page, 'app-' + width + '-brassin-planifie-dans-production', width, runDirectory));
    await clickButton(page, 'Préparer le brassage · ' + seeded.batchId, { ariaOnly: true, exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('button')]
      .some(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Ajouter une note'),
    { timeout: 20000 });
    const journalNote = 'QA V5.5 · note de journal locale synthétique';
    await clickButton(page, 'Ajouter une note', { ariaOnly: true, exact: true });
    await fill(page, 'textarea[aria-label="Carnet de cuve"]', journalNote);
    await clickButton(page, 'Noter', { scope: 'section[aria-label="Notes et conseil"]', exact: true });
    await page.waitForFunction(async note => {
      const batch = await window.__hopV55Qa.batch('QA-V55-BATCH');
      return batch?.brewDay?.notes?.some(item => item.text === note);
    }, { timeout: 12000 }, journalNote);

    await clickButton(page, 'Relever une mesure', { ariaOnly: true, exact: true });
    await clickButton(page, 'Densité', { ariaOnly: true, exact: true });
    await fill(page, '#brew-reading', '1,047');
    await clickButton(page, 'Noter', { scope: 'section[aria-label="Mesures de cette étape"]', exact: true });
    await page.waitForFunction(async () => {
      const batch = await window.__hopV55Qa.batch('QA-V55-BATCH');
      return batch?.brewDay?.readings?.some(reading => Math.abs(reading.value - 1.047) < 0.000001);
    }, { timeout: 12000 });
    const closeCapture = await page.$('button[aria-label="Fermer la saisie"]');
    if (closeCapture && await closeCapture.evaluate(button => button.getClientRects().length > 0)) await closeCapture.click();
    const batchBeforeHost = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
    assert(batchBeforeHost?.brewDay?.readings?.some(reading => Math.abs(reading.value - 1.047) < 0.000001),
      'La densité saisie est dans le journal local du brassin.');
    assert(batchBeforeHost?.brewDay?.notes?.some(item => item.text === journalNote), 'La note saisie est dans le journal local du brassin.');
    await clickButton(page, 'Journal', { ariaOnly: true, exact: true });
    await waitForText(page, '[aria-label="Journal modifiable"]', journalNote);
    await waitForText(page, '[aria-label="Journal modifiable"]', '1.047');
    record.steps.push('BrewDay : note et mesure synthétiques inscrites dans le journal');
    record.captures.push(await capture(page, 'app-' + width + '-journal-brassin', width, runDirectory));

    await clickButton(page, 'Conduite', { exact: true });
    await chooseSummary(page, 'Houblons', true);
    await clickButton(page, 'Explorer les ajouts futurs dans V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', seeded.recipeName);
    const batchContext = await page.$eval('.hv-context', node => node.textContent ?? '');
    assert(batchContext.includes('Brassin · Avant brassage'), 'Le Host expose le stade de préparation du brassin transmis.');
    const batchQuestion = 'Examiner les descriptions de poire, préserver le floral et garder le reste du programme du brassin.';
    await clickButton(page, 'Décider', { exact: true, scope: '.hv-nav' });
    await fill(page, '[aria-label="Question au brasseur"]', batchQuestion);
    await clickButton(page, 'Lire ma question', { exact: true });
    await waitForText(page, '.hv-decision__question', batchQuestion);
    const batchReadState = await snapshotQa(page);
    const batchReadingWorkspace = batchReadState.workspaces.find(workspace => workspace.sourceBatchId === seeded.batchId
      && workspace.decisionReadings.some(reading => reading.question === batchQuestion));
    const batchReading = batchReadingWorkspace?.decisionReadings.find(reading => reading.question === batchQuestion);
    assert.equal(batchReading?.source.kind, 'batch', 'La lecture garde la portée du brassin, pas celle de sa recette seule.');
    assert.equal(batchReading?.source.id, seeded.batchId);
    assert.equal(batchReadState.scenarios.length, 0, 'La question du brassin n’exécute pas J5 avant le geste.');
    assert.equal(await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count'))), 0);
    record.steps.push('BrewDay → lecture du brassin exacte, sans J5 avant le geste');
    record.captures.push(await capture(page, 'app-' + width + '-lecture-brassin-sans-j5', width, runDirectory));
    await clickButton(page, 'Ma bière', { exact: true, scope: '.hv-nav' });
    record.batchWorkspacesBeforeForecast = await page.evaluate(async () => (await window.__hopV55Qa.localWorkspaces()).map(workspace => ({
      id: workspace.id,
      revision: workspace.revision,
      sourceRecipeId: workspace.sourceRecipeId ?? null,
      sourceBatchId: workspace.sourceBatchId ?? null,
      scenarioCount: workspace.scenarioIds.length,
      hasReferenceJournal: !!workspace.referenceJournal,
    })));
    const referenceJournalError = await page.$eval('.hv55-ref-error', node => node.textContent?.trim() ?? '').catch(() => '');
    if (referenceJournalError) {
      record.referenceJournalRecovery = { initialError: referenceJournalError };
      await clickButton(page, 'Relire le journal', { exact: true, scope: '.hv-reference-area' });
      await page.waitForFunction(() => {
        const error = document.querySelector('.hv-reference-area .hv55-ref-error');
        return !error || !error.getClientRects().length;
      }, { timeout: 15000 });
      record.referenceJournalRecovery.retried = true;
      record.steps.push('Journal de référence : relecture explicite après l’erreur initiale');
    }
    await prepareWhirlpoolBranch(page, 'Prévision QA · brassin V5.5');
    await page.waitForSelector('.hv55-comparison', { visible: true, timeout: 25000 });
    await page.waitForFunction(async () => (await window.__hopV55Qa.localScenarios()).length > 0,
      { timeout: 25000 });
    let qaState = await snapshotQa(page);
    const batchWorkspace = qaState.workspaces.find(workspace => workspace.sourceBatchId === seeded.batchId);
    assert(batchWorkspace, 'Le workspace V5.5 conserve la référence au brassin source.');
    const batchScenarioIds = new Set(batchWorkspace.scenarioIds);
    const batchScenarios = qaState.scenarios.filter(scenario => batchScenarioIds.has(scenario.scenarioId));
    const batchSnapshotIntent = batchWorkspace.snapshotIntents.find(row => batchScenarioIds.has(row.scenarioId)
      && row.question === batchQuestion);
    assert(batchSnapshotIntent, 'Le snapshot de J5 conserve la question exacte relue depuis BrewDay.');
    assert.equal(batchSnapshotIntent.decisionReadingReference, batchReading.contentReference,
      'Le snapshot scelle la référence de la lecture source exacte du brassin.');
    const journalFact = batchScenarios.flatMap(scenario => scenario.revisions.flatMap(revision => revision.baseline.facts))
      .find(fact => fact.field === 'journal.densite' && Math.abs(fact.value - 1.047) < 0.000001);
    assert(journalFact, 'La prévision locale reprend la densité exacte saisie dans le journal transmis par BrewDay.');
    assert(batchScenarios.some(scenario => scenario.revisions.some(revision => revision.branchIds.length > 0)),
      'Une prévision issue du brassin est conservée localement.');
    assertNoRemoteServiceCalls(qaState, width);
    record.steps.push('BrewDay → Host : le snapshot local garde la densité du journal');
    record.captures.push(await capture(page, 'app-' + width + '-atelier-depuis-brassin', width, runDirectory));

    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await page.waitForFunction(() => [...document.querySelectorAll('button')]
      .some(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Journal'));
    await clickButton(page, 'Journal', { ariaOnly: true, exact: true });
    await waitForText(page, '[aria-label="Journal modifiable"]', journalNote);
    await waitForText(page, '[aria-label="Journal modifiable"]', '1.047');
    const batchAfterHost = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
    assert.equal(batchAfterHost.id, batchBeforeHost.id, 'La fermeture du Host revient au même brassin.');
    assert.equal(batchAfterHost.status, batchBeforeHost.status);
    assert.deepEqual(batchAfterHost.brewDay, batchBeforeHost.brewDay, 'Le snapshot V5.5 ne réécrit pas le journal source.');
    record.steps.push('Retour depuis le Host : même brassin, journal intact');
    record.captures.push(await capture(page, 'app-' + width + '-retour-brassin', width, runDirectory));

    // Reopen the same brassin and read its saved J5 archive in a fresh Host.
    // The archive action must not trigger a new local simulation.
    await clickButton(page, 'Fermer', { ariaOnly: true, exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('button')]
      .some(button => button.getClientRects().length && (button.getAttribute('aria-label') ?? '').startsWith('Brassins')));
    await clickButton(page, 'Brassins', { ariaPrefix: true });
    await page.waitForFunction(id => [...document.querySelectorAll('button')].some(button => {
      const label = button.getAttribute('aria-label') ?? '';
      return button.getClientRects().length && label.endsWith(' · ' + id)
        && /^(Préparer|Reprendre) le brassage/.test(label);
    }), { timeout: 20000 }, seeded.batchId);
    const postJournalBatch = await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId);
    const postJournalCard = await page.$eval('button[aria-label$=" · QA-V55-BATCH"]', button => ({
      action: button.getAttribute('aria-label') ?? '',
      text: button.closest('article')?.textContent ?? button.parentElement?.parentElement?.textContent ?? '',
    }));
    assert.equal(postJournalBatch?.status, 'planifie', 'Le journal n’a pas converti le statut métier du brassin.');
    record.postJournalBatchCardText = postJournalCard.text.replace(/\s+/g, ' ').trim();
    record.postJournalBatchAction = postJournalCard.action;
    if (/Brassage en cours/i.test(postJournalCard.text) && postJournalBatch?.status === 'planifie') {
      record.warnings.push('Après ouverture du BrewDay, la carte affiche « Brassage en cours » et « Reprendre le brassage » alors que le statut stocké reste planifie. Réserve Production hors périmètre de cette QA.');
    }
    record.captures.push(await capture(page, 'app-' + width + '-carte-brassin-apres-ouverture', width, runDirectory));
    await clickButton(page, postJournalCard.action, { ariaOnly: true, exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('button')]
      .some(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Journal'));
    await clickButton(page, 'Conduite', { exact: true });
    await chooseSummary(page, 'Houblons', true);
    await clickButton(page, 'Explorer les ajouts futurs dans V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', seeded.recipeName);
    assert.equal(await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count'))), 0,
      'Un Host neuf démarre sans rejouer la prévision conservée.');
    await clickButton(page, 'Historique', { exact: true, scope: '.hv-nav' });
    await clickButton(page, 'Relire la prévision v1', { exact: true });
    await page.waitForSelector('.hv-decision-response--historical', { visible: true, timeout: 20000 });
    await waitForText(page, '.hv-decision__question', batchQuestion);
    const reopenedBatchArchive = await snapshotQa(page);
    const reopenedBatchWorkspace = reopenedBatchArchive.workspaces.find(workspace => workspace.sourceBatchId === seeded.batchId);
    const reopenedBatchReading = reopenedBatchWorkspace?.decisionReadings.find(reading => reading.question === batchQuestion);
    assert.equal(reopenedBatchReading?.contentReference, batchReading.contentReference,
      'La prévision rouvre la lecture archivée au contenu exact.');
    assert.equal(reopenedBatchWorkspace?.snapshotIntents.find(row => row.question === batchQuestion)?.decisionReadingReference,
      batchReading.contentReference, 'La référence historique reste scellée au snapshot après réouverture.');
    assert.equal(await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count'))), 0,
      'La réouverture de la prévision J5 archivée n’exécute pas de calcul.');
    record.steps.push('Prévision J5 rouverte en lecture seule depuis un Host neuf, compteur de simulations à 0');
    record.captures.push(await capture(page, 'app-' + width + '-archive-j5-brassin-compteur-zero', width, runDirectory));
    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await page.waitForFunction(() => [...document.querySelectorAll('button')]
      .some(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Journal'));
    await clickButton(page, 'Journal', { ariaOnly: true, exact: true });
    await waitForText(page, '[aria-label="Journal modifiable"]', journalNote);
    await waitForText(page, '[aria-label="Journal modifiable"]', '1.047');
    assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.batch(id), seeded.batchId), batchBeforeHost,
      'La lecture d’archive retourne au même brassin et au même journal.');

    await clickButton(page, 'Fermer', { ariaOnly: true, exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('button')]
      .some(button => button.getClientRects().length && (button.getAttribute('aria-label') ?? '').startsWith('Brassins')));
    await clickButton(page, 'Recettes', { ariaPrefix: true });
    await clickButton(page, 'Ouvrir la recette ' + seeded.recipeName, { ariaOnly: true, exact: true });
    await waitForText(page, 'h1', seeded.recipeName);
    await chooseSummary(page, 'Potentiel aromatique', true);
    await clickButton(page, 'Ouvrir l’atelier Houblons V5.5', { exact: true });
    await waitForText(page, '.hv-context strong', seeded.recipeName);
    await clickButton(page, 'Décider', { exact: true, scope: '.hv-nav' });
    await page.waitForSelector('.hv-decision-response--historical', { visible: true, timeout: 20000 });
    await waitForText(page, '.hv-decision__question', recipeQuestion);
    await clickButton(page, 'Relire cette demande dans le contexte actif', { exact: true });
    await waitForText(page, '.hv-decision__question', recipeQuestion);
    assert.equal(await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count'))), 0,
      'La relecture de la question de recette prépare le contexte sans J5 implicite.');
    await clickButton(page, 'Ma bière', { exact: true, scope: '.hv-nav' });
    await prepareWhirlpoolBranch(page, 'Prévision QA · recette V5.5');
    await page.waitForSelector('.hv55-comparison', { visible: true, timeout: 25000 });
    const branchHandle = await page.waitForFunction(() => {
      const card = [...document.querySelectorAll('.hv55-cmp-branch')]
        .find(node => (node.textContent ?? '').includes('Prévision QA · recette V5.5') && node.querySelector('.hv55-cmp-choose'));
      return card?.querySelector('.hv55-cmp-choose') ?? null;
    }, { timeout: 20000 });
    await branchHandle.asElement().evaluate(button => button.scrollIntoView({ block: 'center' }));
    await branchHandle.asElement().click();
    await branchHandle.dispose();
    await page.waitForSelector('.hv-choice', { visible: true, timeout: 18000 });
    await page.waitForSelector('section.hv-full-copy form', { visible: true, timeout: 20000 });
    await fill(page, '[aria-label="Nom de la nouvelle recette"]', 'Recette fixture V5.5 · copie vérifiée');
    await clickButton(page, 'Prévisualiser la copie complète', { exact: true });

    // Alpha can only be entered when the real copy preview asks for it. The
    // existing synthetic recipe value (5%) is the declared fixture source;
    // this never creates a COA, analysis or measured value.
    await page.waitForFunction(() => document.querySelector('.hv-copy-preview')
      || document.querySelectorAll('[aria-label^="Alpha de travail"]').length > 0
      || document.querySelector('.hv-copy-recompute')
      || [...document.querySelectorAll('[role="alert"]')].some(node => node.textContent.trim()),
    { timeout: 20000 });
    const alphaFields = await page.$$eval('.hv-full-copy .hv-copy-alpha', blocks => blocks.map(block => ({
      alpha: block.querySelector('[aria-label^="Alpha de travail"]')?.getAttribute('aria-label') ?? '',
      reason: block.querySelector('[aria-label^="Motif alpha pour "]')?.getAttribute('aria-label') ?? '',
    })).filter(row => row.alpha));
    if (alphaFields.length) {
      for (const fields of alphaFields) {
        assert(fields.reason, 'Le choix alpha doit avoir son motif associé dans le même bloc.');
        await fill(page, '[aria-label="' + fields.alpha + '"]', '5');
        await fill(page, '[aria-label="' + fields.reason + '"]',
          'Valeur explicite de la recette fixture QA, sans analyse ni portée commerciale.');
      }
      await clickButton(page, 'Prévisualiser la copie complète', { exact: true });
      await page.waitForSelector('.hv-copy-preview', { visible: true, timeout: 20000 });
    }
    const copyBlock = await page.$eval('.hv-full-copy', node => node.textContent ?? '');
    assert(!copyBlock.includes('Nouvelle prévision requise'), 'La candidate doit pouvoir être relue avec le contexte exact avant copie.');
    assert(await page.$('.hv-copy-preview'), 'Le vrai service de copie doit vérifier une candidate avant sa création.');
    const previewText = await page.$eval('.hv-copy-preview', node => node.textContent ?? '');
    assert(previewText.includes('Recette fixture V5.5 · copie vérifiée'), 'La copie conserve le nom explicitement choisi.');
    record.steps.push('Prévision locale → branche sélectionnée → candidate de recette vérifiée');
    record.captures.push(await capture(page, 'app-' + width + '-candidate-de-copie', width, runDirectory));

    await clickButton(page, 'Créer la copie complète locale', { exact: true });
    await page.waitForFunction(async sourceRecipeId => {
      const workspaces = await window.__hopV55Qa.localWorkspaces();
      return workspaces.some(workspace => workspace.sourceRecipeId === sourceRecipeId && workspace.copies.length > 0);
    }, { timeout: 25000 }, seeded.recipeId);
    let beforeFixtureSave = await snapshotQa(page);
    const copySourceWorkspace = beforeFixtureSave.workspaces.find(workspace =>
      workspace.sourceRecipeId === seeded.recipeId && workspace.copies.length > 0);
    assert(copySourceWorkspace?.copies.length, 'La copie locale est conservée avant son enregistrement au carnet.');
    assert.equal(copySourceWorkspace.recipeSaveReceipts.length, 0, 'Aucun reçu de recette avant l’action de sauvegarde.');
    const localCopy = copySourceWorkspace.copies.at(-1);
    const copyId = localCopy.id;
    const copiedRecipeId = localCopy.recipeId;
    assert.notEqual(copiedRecipeId, seeded.recipeId, 'La candidate possède une identité distincte de la recette source.');
    assert.equal(copiedRecipeId, copyId, 'La recette candidate garde l’identité exacte scellée par le reçu v2.');
    const fullCopyReceipt = copySourceWorkspace.fullCopyReceipts.find(receipt => receipt.copyId === copyId);
    assert.equal(fullCopyReceipt?.format, 'hop-v55-full-recipe-copy-v2', 'La création utilise le contrat de copie complète v2.');
    assert(fullCopyReceipt?.sealReference && fullCopyReceipt.finalRecipeReference,
      'Le reçu v2 conserve le sceau d’intégrité et la référence de la recette finale.');
    assert(fullCopyReceipt?.candidateSnapshotReference && fullCopyReceipt.branchReference,
      'Le reçu v2 conserve les références de la prévision candidate et de la branche source.');
    const copySnapshotIntent = copySourceWorkspace.snapshotIntents.find(row => row.snapshotReference === fullCopyReceipt?.snapshotReference);
    const recipeReadingForCopy = copySourceWorkspace.decisionReadings.find(reading =>
      reading.contentReference === copySnapshotIntent?.decisionReadingReference);
    assert.equal(copySnapshotIntent?.decisionReadingReference, recipeReadingForCopy?.contentReference,
      'La prévision copiée reste reliée à la lecture source de la recette exacte.');
    const originalBeforeWrite = await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId);

    await page.evaluate(() => window.__hopV55Qa.rejectNextRecipeSave());
    await clickButton(page, 'Enregistrer comme nouvelle recette', { exact: true });
    await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')]
      .some(node => node.getClientRects().length && /QA : enregistrement refusé/i.test(node.textContent ?? '')),
    { timeout: 18000 });
    const afterRefusal = await snapshotQa(page);
    const refusedWorkspace = afterRefusal.workspaces.find(workspace =>
      workspace.sourceRecipeId === seeded.recipeId && workspace.copies.some(copy => copy.id === copyId));
    assert(refusedWorkspace?.copies.some(copy => copy.id === copyId), 'Le brouillon de copie reste conservé après refus du callback.');
    assert.deepEqual(refusedWorkspace?.fullCopyReceipts.find(receipt => receipt.copyId === copyId), fullCopyReceipt,
      'Le refus de sauvegarde laisse le reçu v2 exact intact.');
    assert(!refusedWorkspace.recipeSaveReceipts.some(receipt => receipt.copyId === copyId),
      'Un refus de lecture fixture ne crée pas de reçu de sauvegarde.');
    assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), originalBeforeWrite,
      'Le refus de copie ne modifie pas la recette source.');
    record.steps.push('saveRecipeConfirmed fixture : refus → brouillon conservé, aucun reçu');

    await clickButton(page, 'Enregistrer comme nouvelle recette', { exact: true });
    await waitForText(page, '.hv-copy', 'Recette confirmée');
    let afterFixtureConfirmation = await snapshotQa(page);
    const confirmedWorkspace = afterFixtureConfirmation.workspaces.find(workspace =>
      workspace.sourceRecipeId === seeded.recipeId && workspace.copies.some(copy => copy.id === copyId));
    const fixtureReceipt = confirmedWorkspace?.recipeSaveReceipts.find(receipt => receipt.copyId === copyId);
    assert(fixtureReceipt && fixtureReceipt.recipeId === copiedRecipeId, 'La confirmation fixture est liée au même ID de copie et de recette.');
    assert.deepEqual(confirmedWorkspace?.fullCopyReceipts.find(receipt => receipt.copyId === copyId), fullCopyReceipt,
      'Le retry conserve le même reçu v2, le même ID et les mêmes références de copie.');
    assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), originalBeforeWrite,
      'La recette source reste inchangée après confirmation de la copie.');
    assert(await page.evaluate(id => window.__hopV55Qa.fireStoreFixture.find('recipes', id), copiedRecipeId),
      'Le callback a lu la recette copiée dans le dépôt Firestore de test local.');
    assertNoRemoteServiceCalls(afterFixtureConfirmation, width);
    record.steps.push('saveRecipeConfirmed fixture : lecture locale confirmée, sans prétendre à un transport serveur');
    record.captures.push(await capture(page, 'app-' + width + '-copie-confirmee-fixture-locale', width, runDirectory));
    await clickButton(page, 'Fermer', { exact: true, scope: 'div[role="alert"].fixed' });
    await waitForNotVisible(page, 'div[role="alert"].fixed');
    await clickSelector(page, '.hv-titleline button[aria-label="Fermer l’atelier"]');
    await waitForText(page, 'h1', seeded.recipeName);
    assert.deepEqual(await page.evaluate(id => window.__hopV55Qa.recipe(id), seeded.recipeId), originalBeforeWrite,
      'Le retour depuis la copie rouvre la même recette source.');

    const finalState = await snapshotQa(page);
    assertNoRemoteServiceCalls(finalState, width);
    assert.deepEqual(record.errors, [], 'Console error/pageerror pendant le parcours à ' + width + ' px.');
    assert.deepEqual(allRemoteResponses, [], 'Aucune réponse distante ne doit être reçue.');
    assert.deepEqual(record.blockedExternalRequests, [], 'Aucun appel vers un service externe n’a été tenté.');
    record.firestoreFixture = finalState.firestore;
    record.localScenarioCount = finalState.scenarios.length;
    record.localWorkspaceCount = finalState.workspaces.length;
    record.functionCalls = finalState.functionCalls;
    record.remoteResponses = [...allRemoteResponses];
    record.warnings = [...new Set(record.warnings)];
    return { record, context, page };
  } catch (error) {
    record.errors.push(String(error?.stack ?? error));
    record.failureState = await snapshotQa(page).catch(readError => ({ readError: String(readError) }));
    record.visibleText = await page.$eval('body', node => (node.innerText ?? '').slice(0, 5000)).catch(() => '');
    record.visibleControls = await page.$$eval('input, select, textarea', nodes => nodes
      .filter(node => node.getClientRects().length > 0)
      .map(node => ({
        label: node.getAttribute('aria-label') ?? node.labels?.[0]?.textContent?.trim() ?? '',
        value: node.value,
        valid: node.checkValidity(),
        type: node.getAttribute('type') ?? node.tagName.toLowerCase(),
      }))).catch(() => []);
    record.visibleAlerts = await page.$$eval('[role="alert"]', nodes => nodes
      .filter(node => node.getClientRects().length > 0)
      .map(node => node.textContent?.trim() ?? '')).catch(() => []);
    record.pageShells = await page.$$eval('[data-page-shell]', nodes => nodes.map(node => ({
      text: (node.innerText ?? '').slice(0, 280),
      visible: node.getClientRects().length > 0,
      hasBrewLayout: !!node.querySelector('.brew-layout'),
      closeButtons: [...node.querySelectorAll('button[aria-label="Fermer"]')].map(button => ({
        visible: button.getClientRects().length > 0, disabled: button.disabled,
      })),
    }))).catch(() => []);
    record.captures.push(await page.screenshot({ path: resolve(runDirectory, 'app-' + width + '-failure.png') })
      .then(() => ({ kind: 'failure-capture', width, file: 'app-' + width + '-failure.png' })).catch(() => null));
    await context.close().catch(() => {});
    throw Object.assign(error, { record });
  }
}

let failure;
const widths = process.env.HOP_V55_APP_QA_WIDTH ? [Number(process.env.HOP_V55_APP_QA_WIDTH)] : [390, 1280];
try {
  for (const width of widths) {
    assert(Number.isInteger(width) && width >= 320, 'Viewport QA invalide.');
    const result = await testWidth(width);
    reports.push(result.record);
    await result.context.close();
  }
} catch (error) {
  failure = error;
  if (error?.record) reports.push(error.record);
} finally {
  await browser.close().catch(() => {});
  await new Promise(resolveClose => server.close(resolveClose));
}

const report = {
  format: 'hop-v55-real-app-browser-qa-v1',
  completedAt: new Date().toISOString(),
  status: failure ? 'failed' : 'passed',
  flow: selectedFlow,
  scope: manifest.scope,
  qaHarness: { path: 'scripts/check-hop-v55-app.mjs', sha256: sha256(await readFile(resolve(root, 'scripts/check-hop-v55-app.mjs'))) },
  transport: 'Only fixture-backed Firestore readback for saveRecipeConfirmed was exercised. No server scenario confirmation, Firebase transport, Gemini call or user data was used.',
  build: {
    path: buildDirectory,
    manifestSha256: sha256(manifestBytes),
    sourceCount: manifest.sourceCount,
    dependencyVersions: manifest.dependencies.filter(row => row.version).map(row => ({ path: row.path, version: row.version })),
  },
  widths,
  reports,
  blockedExternalRequests: allExternalAttempts,
  remoteResponses: allRemoteResponses,
  pageErrors,
  consoleErrors,
  error: failure ? String(failure?.stack ?? failure) : undefined,
};
await writeFile(resolve(runDirectory, 'report.json'), JSON.stringify(report, null, 2));
const finalReservation = selectedFlow === 'host-copy-alert'
  ? [
    'Portée : ce parcours simule un refus puis un readback par le FirestoreRepo fixture, sans transport réel. Il vérifie l’unique alerte Host/Page, son acquittement manuel, le callback réussi, ses IDs/reçus locaux et le succès UI neutre; aucun reçu serveur n’est revendiqué.',
    ...reports.map(row => {
      const after = row.batchAfterRetry;
      const cardBefore = row.batchCardBeforeJournal?.text ?? row.batchCardBeforeJournal?.action ?? 'non capturée';
      const cardAfter = row.batchCardAfterJournal?.text ?? row.batchCardAfterJournal?.action ?? 'non capturée';
      return `Brassin fixture ${row.width}px : status stocké=${after?.status ?? 'inconnu'} avant/après; champ de stockage brewStartedAt=${after?.brewStartedAt ?? 'absent'}; carte avant journal « ${cardBefore} », après relevé « ${cardAfter} ». Le changement d’étiquette suit la preuve de début calculée depuis la lecture valide, pas une simple ouverture.`;
    }),
  ].join('\n\n')
  : failure ? String(failure?.message ?? failure) : 'Réserve finale : aucune.';
const markdown = [
  '# QA navigateur · App réelle V5.5',
  '',
  'Parcours : **' + selectedFlow + '** · statut : **' + report.status + '** · viewports : ' + widths.join(' / ') + ' px.',
  '',
  'Le build charge la vraie App, HopV55Host, Page, services locaux/Dexie et domaine. Les seuls adapteurs remplacés sont identité, Firestore, Functions et migration. Chaque requête hors du serveur 127.0.0.1 a été interceptée et bloquée avant émission.',
  '',
  'La préparation, prévision et copie sont des fixtures synthétiques locales. saveRecipeConfirmed a été exercé avec un refus puis un readback par le FirestoreRepo fixture; cette preuve ne prétend pas à un transport ou reçu serveur.',
  '',
  reports.map(row => '## ' + row.width + ' px\n\n' + row.steps.map(step => '- ' + step).join('\n')
    + '\n\nCaptures : ' + row.captures.map(capture => capture?.file ?? 'aucune').join(', ')
    + '\n\nErreurs : ' + (row.errors.length ? row.errors.join(' | ') : 'aucune')
    + '\nRequêtes externes bloquées : ' + (row.blockedExternalRequests.length ? row.blockedExternalRequests.join(', ') : 'aucune')).join('\n\n'),
  '',
  finalReservation,
  '',
  'Manifest source : ' + JSON.stringify({ path: buildDirectory, sha256: report.build.manifestSha256, sourceCount: manifest.sourceCount }),
  'Harness exécuté : ' + JSON.stringify(report.qaHarness),
].join('\n');
await writeFile(resolve(runDirectory, 'rapport.md'), markdown, 'utf8');
await writeFile(resolve(evidenceRoot, 'last-run.json'), JSON.stringify({
  path: runDirectory,
  reportSha256: sha256(Buffer.from(JSON.stringify(report, null, 2))),
}, null, 2));
console.log(JSON.stringify({ status: report.status, runDirectory, buildDirectory, widths, failure: report.error }, null, 2));
if (failure) process.exitCode = 1;
