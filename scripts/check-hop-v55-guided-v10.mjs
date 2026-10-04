// Guided V5.5 journeys against an already frozen local build. This script
// never builds product code and only accepts the mission's 127.0.0.1 fixture.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import puppeteer from 'puppeteer-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mission = resolve(root, 'work/houblons-v55-integration-app-2026-10-02');
const build = resolve(mission, process.env.HOP_V55_GUIDED_BUILD_DIR || 'qa-build-gG4YfT');
const evidenceRoot = resolve(mission, process.env.HOP_V55_GUIDED_EVIDENCE_DIR || 'luna-explorer/app-qa/guided-v10');
const base = process.env.HOP_V55_GUIDED_BASE || 'http://127.0.0.1:5204';
const expectedManifestSha256 = process.env.HOP_V55_GUIDED_MANIFEST_SHA256 || '4803ade4d2c479e762a034546417f585b2465a54a8f8349ef6257e7df1d4519a';
const fixturePrefix = process.env.HOP_V55_GUIDED_FIXTURE_PREFIX || 'guided10';
assert(build.startsWith(mission), 'Le build source doit appartenir à la mission V5.5.');
const manifestBytes = await readFile(resolve(build, 'manifest.json'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(manifestBytes), expectedManifestSha256, 'Le build Source10 n’est plus le manifest gelé attendu.');
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.format, 'hop-v55-local-qa-build-v2');
assert(Number.isInteger(manifest.sourceCount) && manifest.sourceCount > 0);
assert.equal(manifest.entry, '/tests/qa/hop-v55/index.html');
const servedManifest = Buffer.from(await (await fetch(`${base}/manifest.json`)).arrayBuffer());
assert.equal(sha256(servedManifest), expectedManifestSha256, 'Le serveur 5204 ne sert pas le build Source10 attendu.');

const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const runDirectory = resolve(evidenceRoot, `guided-${runId}`);
await mkdir(runDirectory, { recursive: true });
const widths = (process.env.HOP_V55_GUIDED_WIDTHS || '390,1280').split(',').map(Number);
const selectedFlows = (process.env.HOP_V55_GUIDED_FLOWS || 'q1,q1b,q2,q3').split(',').map(value => value.trim()).filter(Boolean);
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath, headless: true,
  args: ['--mute-audio', '--no-sandbox', '--disable-dev-shm-usage'] });

const reports = [];
const blockedExternalRequests = [];
const pageErrors = [];
const consoleErrors = [];
const requestsToFixture = [];

function normalize(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function safeName(value) { return value.toLocaleLowerCase('fr').normalize('NFKD').replace(/\p{M}/gu, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48); }

async function assertTargetViewport(page, report, phase) {
  const actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio }));
  assert.equal(actual.width, report.width, `${phase}: innerWidth ${actual.width} ≠ viewport demandé ${report.width}.`);
  return actual;
}

async function clickButton(page, label, { scope, exact = true, timeout = 18000 } = {}) {
  const handle = await page.waitForFunction((label, scope, exact) => {
    const parent = scope ? document.querySelector(scope) : document;
    if (!parent) return null;
    return [...parent.querySelectorAll('button')].find(button => {
      const visible = button.getClientRects().length > 0 && getComputedStyle(button).visibility !== 'hidden';
      if (!visible || button.disabled) return false;
      const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim();
      const aria = button.getAttribute('aria-label') ?? '';
      return exact ? text === label || aria === label : text.includes(label) || aria.includes(label);
    }) ?? null;
  }, { timeout }, label, scope ?? null, exact);
  const element = handle.asElement();
  assert(element, `Bouton absent ou non visible : ${label}`);
  await element.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await element.click();
  await handle.dispose();
}

async function clickSummary(page, text, { scope = '[data-testid="hop-v55-reference-panel"]', exact = false } = {}) {
  const handle = await page.waitForFunction((text, scope, exact) => {
    const parent = scope ? document.querySelector(scope) : document;
    if (!parent) return null;
    return [...parent.querySelectorAll('summary')].find(summary => {
      const label = (summary.textContent ?? '').replace(/\s+/g, ' ').trim();
      return exact ? label === text : label.includes(text);
    }) ?? null;
  }, { timeout: 12000 }, text, scope, exact);
  const detailsState = await handle.evaluate(node => ({
    isDetails: node.parentElement?.tagName === 'DETAILS',
    open: node.parentElement?.tagName === 'DETAILS' && node.parentElement.open,
  }));
  if (detailsState.isDetails && !detailsState.open) {
    await handle.asElement().evaluate(node => node.scrollIntoView({ block: 'center' }));
    await handle.asElement().click();
  }
  if (detailsState.isDetails) await page.waitForFunction((text, scope, exact) => {
    const parent = scope ? document.querySelector(scope) : document;
    if (!parent) return false;
    const summary = [...parent.querySelectorAll('summary')].find(node => {
      const label = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      return exact ? label === text : label.includes(text);
    });
    return summary?.parentElement?.tagName === 'DETAILS' && summary.parentElement.open;
  }, { timeout: 10000 }, text, scope ?? null, exact);
  await handle.dispose();
}

async function fill(page, label, value) {
  const selector = `[aria-label=${JSON.stringify(label)}]`;
  await page.waitForFunction(selector => {
    const node = document.querySelector(selector);
    return node && node.checkVisibility() && node.getClientRects().length > 0 && !node.disabled && !node.readOnly;
  }, { timeout: 10000 }, selector);
  await page.evaluate(selector => document.querySelector(selector)?.scrollIntoView({ block: 'center', inline: 'nearest' }), selector);
  const field = await page.$(selector);
  assert(field, `Champ absent : ${label}`);
  await field.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type(String(value));
  await field.dispose();
}

async function selectByText(page, selector, text, { exact = false, occurrence = 0 } = {}) {
  const handle = await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  const selection = await handle.evaluate((select, { text, exact, occurrence }) => {
    const options = [...select.options].filter(option => exact
      ? (option.textContent ?? '').trim() === text
      : (option.textContent ?? '').includes(text));
    return { count: options.length, value: options[occurrence]?.value ?? '', labels: options.map(option => option.textContent?.trim()) };
  }, { text, exact, occurrence });
  assert(selection.value, `Option absente pour ${selector} : ${text} (${selection.count})`);
  await handle.select(selection.value);
  await handle.dispose();
  return selection;
}

async function selectByLabel(page, label, text, options = {}) {
  return selectByText(page, `select[aria-label=${JSON.stringify(label)}]`, text, options);
}

async function visibleText(page, selector) {
  return page.$eval(selector, node => (node.textContent ?? '').replace(/\s+/g, ' ').trim());
}

async function readFixtureCopyFromDexie(page) {
  return page.evaluate(async () => {
    const params = new URLSearchParams(location.search);
    const namespace = params.get('fixture');
    const mode = params.get('case');
    if (!namespace || !mode) throw new Error('Namespace et mode fixture absents de l’URL.');
    const encoded = encodeURIComponent(`${namespace}-${mode}`);
    const databaseName = `laffinee-hop-v55-fixture-${encoded}-workspaces-v1`;
    const ownerKey = `fixture:${encoded}`;
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error(`Ouverture Dexie échouée : ${databaseName}`));
      request.onblocked = () => reject(new Error(`Lecture Dexie bloquée : ${databaseName}`));
    });
    try {
      const rows = await new Promise((resolve, reject) => {
        const transaction = database.transaction('workspaces', 'readonly');
        const request = transaction.objectStore('workspaces').getAll();
        let values = [];
        request.onsuccess = () => { values = request.result; };
        request.onerror = () => reject(request.error ?? new Error('Lecture du store workspaces échouée.'));
        transaction.oncomplete = () => resolve(values);
        transaction.onerror = () => reject(transaction.error ?? new Error('Transaction Dexie workspaces interrompue.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Transaction Dexie workspaces annulée.'));
      });
      const workspaceRows = rows.filter(row => row.ownerKey === ownerKey && row.workspace?.sourceRecipeId === 'hop-v55-fixture-recipe-planning');
      return {
        databaseName, ownerKey,
        workspaces: workspaceRows.map(row => {
          const workspace = row.workspace;
          return {
            id: workspace.id, revision: workspace.revision, sourceRecipeId: workspace.sourceRecipeId ?? null,
            activeCopyId: workspace.activeCopyId ?? null,
            copies: (workspace.copies ?? []).map(copy => ({ id: copy.id, recipeId: copy.recipe?.id ?? null,
              recipeName: copy.recipe?.name ?? '', hops: (copy.recipe?.hops ?? []).map(hop => ({ name: hop.name, weightG: hop.weightG,
                stage: hop.stage ?? null, timeMin: hop.timeMin ?? null, dayOffset: hop.dayOffset ?? null,
                aromaTiming: hop.aromaTiming ?? null, aromaContactHours: hop.aromaContactHours ?? null,
                aromaTemperatureC: hop.aromaTemperatureC ?? null, tempC: hop.tempC ?? null })) })),
            fullCopyReceipts: (workspace.fullCopyReceipts ?? []).map(receipt => ({ format: receipt.format, copyId: receipt.copyId,
              previewReference: receipt.previewReference ?? null, snapshotReference: receipt.snapshotReference ?? null,
              branchId: receipt.branchId ?? null, branchReference: receipt.branchReference ?? null,
              candidateSnapshotReference: receipt.candidateSnapshotReference ?? null,
              finalRecipeId: receipt.finalRecipe?.id ?? null, finalRecipeReference: receipt.finalRecipeReference ?? null,
              integritySealFormat: receipt.integritySeal?.format ?? null,
              integritySealReference: receipt.integritySeal?.reference ?? receipt.sealReference ?? null })),
          };
        }),
      };
    } finally { database.close(); }
  });
}

async function readFixtureDecisionEvidence(page) {
  return page.evaluate(async () => {
    const params = new URLSearchParams(location.search);
    const namespace = params.get('fixture');
    const mode = params.get('case');
    if (!namespace || !mode) throw new Error('Namespace et mode fixture absents de l’URL.');
    const encoded = encodeURIComponent(`${namespace}-${mode}`);
    const databaseName = `laffinee-hop-v55-fixture-${encoded}-workspaces-v1`;
    const ownerKey = `fixture:${encoded}`;
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error(`Ouverture Dexie échouée : ${databaseName}`));
      request.onblocked = () => reject(new Error(`Lecture Dexie bloquée : ${databaseName}`));
    });
    try {
      const rows = await new Promise((resolve, reject) => {
        const transaction = database.transaction('workspaces', 'readonly');
        const request = transaction.objectStore('workspaces').getAll();
        let values = [];
        request.onsuccess = () => { values = request.result; };
        request.onerror = () => reject(request.error ?? new Error('Lecture du store workspaces échouée.'));
        transaction.oncomplete = () => resolve(values);
        transaction.onerror = () => reject(transaction.error ?? new Error('Transaction workspaces interrompue.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Transaction workspaces annulée.'));
      });
      const workspaceRows = rows.filter(row => row.ownerKey === ownerKey && row.workspace?.sourceRecipeId === 'hop-v55-fixture-recipe-planning');
      return { databaseName, ownerKey, workspaces: workspaceRows.map(row => {
        const workspace = row.workspace;
        return {
          id: workspace.id, revision: workspace.revision, sourceRecipeId: workspace.sourceRecipeId ?? null,
          activeCopyId: workspace.activeCopyId ?? null, decisionReadings: (workspace.decisionReadings ?? []).map(archive => ({
            id: archive.id, contentReference: archive.contentReference, format: archive.format, runtimeReference: archive.runtimeReference,
            question: archive.reading?.intent?.question ?? '', criteria: archive.reading?.intent?.criteria ?? [],
            criterionDrafts: archive.reading?.criterionDrafts ?? [], correction: archive.reading?.correction ?? null,
            responseActionKind: archive.reading?.response?.actionKind ?? null,
            responseAnswer: archive.reading?.response?.answer ?? null,
            branches: archive.reading?.branches ?? [], unresolved: archive.reading?.unresolved ?? [],
            preparation: archive.programPreparation ? {
              branch: archive.programPreparation.input?.branch ?? null,
              program: { id: archive.programPreparation.input?.program?.id ?? null, revision: archive.programPreparation.input?.program?.revision ?? null,
                additions: (archive.programPreparation.input?.program?.additions ?? []).map(line => ({ id: line.id, materialId: line.materialId,
                  grams: line.grams, use: line.use, status: line.status, contactHours: line.contactHours ?? null, temperatureC: line.temperatureC ?? null })) },
              materials: (archive.programPreparation.input?.materials ?? []).map(material => ({ id: material.id, name: material.name })),
              intent: archive.programPreparation.input?.intent ?? null,
              operations: archive.programPreparation.input?.operations ?? [],
              result: { status: archive.programPreparation.result?.status ?? null, programReference: archive.programPreparation.result?.programReference ?? null,
                needs: archive.programPreparation.result?.needs ?? [], branch: archive.programPreparation.result?.branch ?? null,
                proposalAdditions: (archive.programPreparation.result?.proposal?.program?.additions ?? []).map(line => ({ id: line.id,
                  materialId: line.materialId, grams: line.grams, use: line.use, status: line.status,
                  contactHours: line.contactHours ?? null, temperatureC: line.temperatureC ?? null, dayOffset: line.dayOffset ?? null,
                  boilMinutes: line.boilMinutes ?? null })) },
            } : null,
          })),
          copies: (workspace.copies ?? []).map(copy => ({ id: copy.id, recipeId: copy.recipe?.id ?? null, recipeName: copy.recipe?.name ?? '',
            hops: (copy.recipe?.hops ?? []).map(hop => ({ name: hop.name, weightG: hop.weightG, stage: hop.stage ?? null,
              timeMin: hop.timeMin ?? null, dayOffset: hop.dayOffset ?? null, aromaContactHours: hop.aromaContactHours ?? null,
              aromaTemperatureC: hop.aromaTemperatureC ?? null })) })),
          fullCopyReceipts: (workspace.fullCopyReceipts ?? []).map(receipt => ({ copyId: receipt.copyId,
            finalRecipeId: receipt.finalRecipe?.id ?? null, finalRecipeReference: receipt.finalRecipeReference ?? null,
            integritySealReference: receipt.integritySeal?.reference ?? receipt.sealReference ?? null })),
        };
      }) };
    } finally { database.close(); }
  });
}

function summarizeFixtureCopyReceipt(receipt) {
  return {
    format: receipt.format, copyId: receipt.copyId,
    previewReferenceSha256: receipt.previewReference ? sha256(Buffer.from(receipt.previewReference)) : null,
    snapshotReference: receipt.snapshotReference, branchId: receipt.branchId, branchReference: receipt.branchReference,
    candidateSnapshotReference: receipt.candidateSnapshotReference, finalRecipeId: receipt.finalRecipeId,
    finalRecipeReferenceSha256: receipt.finalRecipeReference ? sha256(Buffer.from(receipt.finalRecipeReference)) : null,
    integritySealFormat: receipt.integritySealFormat,
    integritySealReferenceSha256: receipt.integritySealReference ? sha256(Buffer.from(receipt.integritySealReference)) : null,
  };
}

function summarizeFixtureCopyEvidence(snapshot) {
  return {
    databaseName: snapshot.databaseName, ownerKey: snapshot.ownerKey,
    workspaces: snapshot.workspaces.map(workspace => ({
      id: workspace.id, revision: workspace.revision, sourceRecipeId: workspace.sourceRecipeId,
      activeCopyId: workspace.activeCopyId, copies: workspace.copies,
      fullCopyReceipts: workspace.fullCopyReceipts.map(summarizeFixtureCopyReceipt),
    })),
  };
}

async function capture(page, report, label, selector) {
  if (selector) {
    const node = await page.$(selector);
    if (node) await node.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const viewport = await assertTargetViewport(page, report, `Capture « ${label} »`);
  const file = `${safeName(report.flow)}-${report.width}-${safeName(label)}.png`;
  const path = resolve(runDirectory, file);
  const png = Buffer.from(await page.screenshot({ path, fullPage: false }));
  const dimensions = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  assert.equal(dimensions.width, report.width, `PNG « ${label} »: largeur ${dimensions.width} ≠ ${report.width}.`);
  assert.equal(dimensions.height, viewport.height, `PNG « ${label} »: hauteur ${dimensions.height} ≠ viewport ${viewport.height}.`);
  report.captures.push({ label, file, viewport, png: dimensions });
  return file;
}

async function newPage(report, mode, seed = '') {
  const page = await browser.newPage();
  const viewport = { width: report.width, height: report.width === 390 ? 844 : 900, deviceScaleFactor: 1,
    isMobile: report.width < 600, hasTouch: report.width < 600 };
  await page.setViewport(viewport);
  report.viewportRequested = viewport;
  const appliedViewport = page.viewport();
  assert.equal(appliedViewport?.width, report.width, `Avant navigation: page.viewport().width ${appliedViewport?.width} ≠ ${report.width}.`);
  assert.equal(appliedViewport?.height, viewport.height, `Avant navigation: page.viewport().height ${appliedViewport?.height} ≠ ${viewport.height}.`);
  report.viewportBeforeNavigation = appliedViewport;
  page.on('pageerror', error => { pageErrors.push({ flow: report.flow, width: report.width, error: String(error) }); report.errors.push(String(error)); });
  page.on('console', message => {
    if (message.type() === 'error') {
      const text = message.text();
      if (/favicon\.ico/i.test(text)) return;
      consoleErrors.push({ flow: report.flow, width: report.width, error: text });
      report.errors.push(text);
    }
  });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') { void request.continue(); return; }
    if (url.origin === base) {
      requestsToFixture.push({ flow: report.flow, width: report.width, path: url.pathname });
      if (url.pathname === '/favicon.ico') { void request.respond({ status: 204, body: '' }); return; }
      void request.continue(); return;
    }
    blockedExternalRequests.push({ flow: report.flow, width: report.width, url: request.url() });
    report.blockedExternalRequests.push(request.url());
    void request.abort('blockedbyclient');
  });
  const query = new URLSearchParams({ fixture: `${fixturePrefix}-${safeName(report.flow)}-${report.width}`, case: mode });
  if (seed) query.set('fixtureSeed', seed);
  await page.goto(`${base}/tests/qa/hop-v55/index.html?${query}`, { waitUntil: 'networkidle0', timeout: 25000 });
  await page.waitForSelector('[data-testid="hop-v55"]', { timeout: 12000 });
  await page.waitForSelector('[data-testid="hop-v55-reference-panel"]', { timeout: 12000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Ouverture du journal de références…'), { timeout: 12000 });
  await new Promise(resolve => setTimeout(resolve, 250));
  const identity = { url: page.url(), title: await page.title(), viewport: await assertTargetViewport(page, report, 'Après chargement UI') };
  assert.equal(new URL(identity.url).origin, base);
  assert(identity.title.includes('V5.5'));
  report.identity = identity;
  report.initialSimulationCount = await page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count')));
  return page;
}

async function simulationCount(page) {
  return page.$eval('[data-testid="hop-v55"]', node => Number(node.getAttribute('data-simulation-count')));
}

async function addReferenceHop(page, materialName, grams, use = 'Whirlpool') {
  await selectByLabel(page, 'Matière de la référence', materialName);
  await fill(page, 'Masse de référence', grams);
  await selectByLabel(page, 'Emploi supposé', use, { exact: true });
  await clickButton(page, 'Ajouter à la référence', { scope: '[data-testid="hop-v55-reference-panel"]' });
  await page.waitForFunction((name, grams) => {
    const panel = document.querySelector('[data-testid="hop-v55-reference-panel"]');
    return panel && (panel.innerText ?? '').includes(`${name} · ${grams} g`);
  }, { timeout: 10000 }, materialName, String(grams));
}

async function createHypotheticalSource(page, report, lines) {
  await clickSummary(page, 'Hypothèse de référence', { exact: true });
  await clickSummary(page, 'Déclarer une hypothèse de référence', { exact: true });
  await fill(page, 'Nom de la référence', 'QA · base hypothétique Saazer, sans source physique');
  await fill(page, 'Volume de la référence', '20');
  for (const line of lines) await addReferenceHop(page, 'Saazer', line.grams, line.use ?? 'Whirlpool');
  const panel = await visibleText(page, '[data-testid="hop-v55-reference-panel"]');
  assert(panel.includes('Saazer · 40 g'), 'La ligne test Saazer doit rester une quantité hypothétique déclarée.');
  const adoptLabel = (await page.$$eval('[data-testid="hop-v55-reference-panel"] button', nodes => nodes
    .map(node => node.textContent?.trim()).find(text => text === 'Adopter cette hypothèse de référence'
      || text === 'Proposer et adopter cette nouvelle version')));
  assert(adoptLabel, 'Le geste d’adoption explicite de la référence est absent.');
  await clickButton(page, adoptLabel, { scope: '[data-testid="hop-v55-reference-panel"]' });
  await page.waitForFunction(() => {
    const text = document.querySelector('[data-testid="hop-v55-reference-panel"]')?.innerText ?? '';
    return text.includes('Hypothèse de comparaison') && /version 1|version 2|version 3/.test(text);
  }, { timeout: 15000 });
  const text = await visibleText(page, '[data-testid="hop-v55-reference-panel"]');
  assert(text.includes('passé inconnu') || text.includes('Contexte réel non renseigné') || text.includes('Aucune recette'),
    'La référence hypothétique doit rester distincte du passé réel.');
  report.steps.push(`Base de test explicitement hypothétique : ${lines.map(line => `${line.grams} g Saazer · ${line.use ?? 'Whirlpool'}`).join(' + ')}; aucun lot/recette physique n’est créé.`);
  await capture(page, report, 'reference-hypothetique-adoptee', '[data-testid="hop-v55-reference-panel"]');
}

async function readQuestion(page, question) {
  await fill(page, 'Question au brasseur', question);
  await clickButton(page, 'Lire ma question', { exact: true });
  await page.waitForSelector('.hv-decision-response', { visible: true, timeout: 25000 });
  await page.waitForFunction(question => document.querySelector('.hv-decision__question')?.textContent?.includes(question),
    { timeout: 10000 }, question);
}

async function openProgramComposer(page) {
  if (!await page.$('.hv-decision-preparation__program')) {
    await clickButton(page, 'Composer plusieurs opérations de programme', { scope: '.hv-decision-response' });
  }
  await page.waitForSelector('.hv-decision-preparation__program', { visible: true, timeout: 10000 });
}

async function ensureOperation(page, kind) {
  const kinds = await page.$$eval('.hv-decision-preparation__operation select[aria-label^="Type de l’opération"]',
    nodes => nodes.map(node => node.value));
  if (!kinds.length) {
    await selectByLabel(page, 'Type du nouveau geste', kind === 'replace' ? 'Remplacer une matière' : kind === 'remove' ? 'Retirer une ligne ou une masse' : 'Ajouter une ligne');
    await page.waitForSelector('.hv-decision-preparation__operation');
  } else if (kinds[0] !== kind) {
    await selectByText(page, '.hv-decision-preparation__operation select[aria-label="Type de l’opération 1"]',
      kind === 'replace' ? 'Remplacer une matière' : kind === 'remove' ? 'Retirer une ligne ou une masse' : 'Ajouter une ligne', { exact: true });
  }
}

async function selectOperationControl(page, prefix, choice, { occurrence = 0 } = {}) {
  const selector = `select[aria-label^=${JSON.stringify(prefix)}]`;
  const handles = await page.$$(selector);
  assert(handles.length > occurrence, `Sélecteur d’opération absent : ${prefix}`);
  const handle = handles[occurrence];
  const labels = await handle.evaluate((select, choice) => {
    const match = [...select.options].filter(option => (option.textContent ?? '').includes(choice));
    return { options: [...select.options].map(option => ({ value: option.value, text: option.textContent?.trim() })),
      match: match.map(option => ({ value: option.value, text: option.textContent?.trim() })) };
  }, choice);
  assert(labels.match.length, `Option de champ «${prefix}» absente : ${choice}`);
  await handle.select(labels.match[0].value);
  return { selected: labels.match[0], options: labels.options };
}

async function chooseReplacePair(page, { chooseSource = true, target = 'Styrian Golding (Celeia)' } = {}) {
  await ensureOperation(page, 'replace');
  await fill(page, 'Nom de la proposition de programme', 'QA · remplacement Saazer vers Styrian');
  const sourceSelector = 'select[aria-label^="Ligne source de l’opération"]';
  const sourceHandle = await page.waitForSelector(sourceSelector, { visible: true, timeout: 10000 });
  const sources = await sourceHandle.evaluate(select => [...select.options].map(option => ({ value: option.value, text: option.textContent?.trim() })));
  const saazerRows = sources.filter(row => row.value && row.text?.includes('Saazer'));
  if (chooseSource) {
    assert(saazerRows.length >= 1, `Ligne Saazer absente du programme source : ${JSON.stringify(sources)}`);
    const chosen = saazerRows[0];
    await sourceHandle.select(chosen.value);
  }
  const targetSelector = 'select[aria-label^="Identité cible de l’opération"]';
  const targetHandle = await page.waitForSelector(targetSelector, { visible: true, timeout: 10000 });
  const targetOptions = await targetHandle.evaluate((select, target) => [...select.options]
    .filter(option => (option.textContent ?? '').includes(target))
    .map(option => ({ value: option.value, text: option.textContent?.trim() })), target);
  assert(targetOptions.length, `Cible exacte absente du catalogue : ${target}`);
  await targetHandle.select(targetOptions[0].value);
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Comparaison documentaire exacte avant convention"]'), { timeout: 10000 }).catch(() => {});
  return { sourceOptions: sources, sourceMatches: saazerRows, targetOptions };
}

async function savePreparation(page) {
  await clickButton(page, 'Vérifier et conserver cette préparation', { scope: '.hv-decision-preparation__program' });
  await page.waitForFunction(() => /Proposition entière conservée|Préparation conservée avec les choix restant à préciser/.test(document.body.innerText ?? ''),
    { timeout: 20000 });
  const archive = await page.$('.hv-decision-preparation__archive');
  const notice = await page.evaluate(() => (document.body.innerText ?? '').match(/Proposition entière conservée[^\n]*|Préparation conservée avec les choix restant à préciser[^\n]*/)?.[0] ?? 'Notice de préparation non trouvée');
  if (archive) return `${notice}\n${await archive.evaluate(node => node.innerText)}`;
  return `${notice}\n${await page.$eval('.hv-decision-preparation__program', node => node.innerText)}\nRécapitulatif archivé incomplète non rendu.`;
}

async function chooseScenarioBranch(page, branchLabel) {
  await page.waitForFunction(() => document.querySelectorAll('.hv55-cmp-branch .hv55-cmp-choose, .hv55-sensory-candidate .hv55-sensory-choose').length > 0,
    { timeout: 20000 });
  const sensory = !!await page.$('.hv55-sensory-candidate .hv55-sensory-choose');
  const cardSelector = sensory ? '.hv55-sensory-candidate' : '.hv55-cmp-branch';
  const buttonSelector = sensory ? '.hv55-sensory-choose' : '.hv55-cmp-choose';
  const cards = await page.$$(cardSelector);
  const details = [];
  for (const card of cards) details.push({ card, text: await card.evaluate(node => node.innerText) });
  const chosen = details.find(row => row.text.includes(branchLabel)) ?? (details.length === 1 ? details[0] : undefined);
  assert(chosen, `La branche «${branchLabel}» est absente des comparateurs : ${details.map(row => row.text.slice(0, 200)).join(' / ')}`);
  const button = await chosen.card.$(buttonSelector);
  assert(button, 'Le candidat n’a pas de commande de choix.');
  await button.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await button.click();
  return { kind: sensory ? 'SensoryComparison' : 'HopV55Comparison', cardText: chosen.text };
}

async function chooseSameMass(page) {
  const modeSelector = 'select[aria-label^="Mode de dose pour l’opération"]';
  const modes = await page.$$(modeSelector);
  assert(modes.length, 'Le choix de convention de dose n’est pas affiché.');
  await modes[0].select('basis');
  const basisSelector = 'select[aria-label^="Convention de dose pour l’opération"]';
  await page.waitForSelector(basisSelector, { visible: true, timeout: 10000 });
  const basis = await page.$(basisSelector);
  const option = await basis.evaluate(select => [...select.options].find(row => row.value === 'sameMass')?.value);
  assert.equal(option, 'sameMass', 'La convention explicite de même masse n’est pas disponible.');
  await basis.select('sameMass');
}

async function runExactAndAmbiguousReplace(report) {
  const page = await newPage(report, 'unknown');
  try {
    await createHypotheticalSource(page, report, [{ grams: 40 }]);
    const question = 'Remplacer l’ajout prévu de Saazer par Styrian Golding (Celeia), sans fixer la dose avant la comparaison des fiches.';
    await readQuestion(page, question);
    assert.equal(await simulationCount(page), 0, 'La lecture de question ne doit pas lancer J5.');
    await openProgramComposer(page);
    const pair = await chooseReplacePair(page, { chooseSource: true });
    const documentComparison = await visibleText(page, '[aria-label="Comparaison documentaire exacte avant convention"]');
    assert(documentComparison.includes('Saazer') && documentComparison.includes('Styrian Golding'),
      'La comparaison doit porter sur la paire exacte avant le choix de dose.');
    const mode = await page.$eval('select[aria-label^="Mode de dose pour l’opération"]', node => node.value);
    assert.equal(mode, '', 'Aucune convention/dose ne doit être présélectionnée avant décision du brasseur.');
    await capture(page, report, 'paire-documentaire-avant-convention', '[aria-label="Comparaison documentaire exacte avant convention"]');
    report.steps.push('Paire documentaire exacte Saazer → Styrian Golding affichée avant le choix de dose; convention laissée vide.');
    await chooseSameMass(page);
    let archived = await savePreparation(page);
    report.preparationStatus = archived.includes('Proposition prête à examiner') ? 'ready' : archived.includes('Préparation incomplète') ? 'needsInput' : 'blocked';
    report.preparationText = archived.slice(0, 2400);
    assert.equal(report.preparationStatus, 'ready', `Le choix SameMass n’a pas rendu la proposition prête : ${archived.slice(0, 1200)}`);
    assert(archived.includes('Styrian Golding (Celeia)') && archived.includes('40 g physiques'),
      'Le programme proposé doit conserver les 40 g physiques choisis explicitement.');
    report.steps.push('Même masse choisie explicitement; proposition prête et conservée sans confondre masse et équivalence sensorielle.');
    await capture(page, report, 'proposition-prete-avant-j5', '.hv-decision-preparation__archive');
    await clickButton(page, 'Comparer cette proposition à la référence', { scope: '.hv-decision-preparation__archive' });
    await page.waitForSelector('.hv55-comparison', { visible: true, timeout: 30000 });
    assert.equal(await simulationCount(page), 1, 'J5 doit partir uniquement après Comparer cette proposition.');
    report.steps.push('J5 local déclenché par Comparer cette proposition; compteur de simulations = 1.');
    await capture(page, report, 'comparaison-j5', '.hv55-comparison');
    await page.waitForFunction(() => document.querySelectorAll('.hv55-sensory-candidate').length > 0, { timeout: 10000 }).catch(() => {});
    const branch = await page.$$eval('.hv55-sensory-candidate', nodes => nodes.map(node => ({ text: node.innerText,
      buttons: [...node.querySelectorAll('button')].map(button => ({ text: button.innerText.trim(), className: button.className })) })));
    report.comparisonBranches = branch.map(row => row.text.slice(0, 400));
    report.comparisonButtons = branch.flatMap(row => row.buttons);
    report.comparisonDom = await page.$eval('.hv-decision', node => node.innerText.slice(-2400)).catch(() => '');
    const chooseHandle = await page.waitForFunction(() => {
      const card = [...document.querySelectorAll('.hv55-sensory-candidate')].find(node =>
        (node.textContent ?? '').includes('QA · remplacement Saazer vers Styrian')
        || (node.textContent ?? '').includes('Styrian Golding (Celeia)'));
      return card?.querySelector('.hv55-sensory-choose') ?? null;
    }, { timeout: 15000 }).catch(() => null);
    if (chooseHandle) {
      await chooseHandle.asElement().evaluate(node => node.scrollIntoView({ block: 'center' }));
      await chooseHandle.asElement().click();
      await chooseHandle.dispose();
      await page.waitForSelector('.hv-choice', { visible: true, timeout: 12000 });
      const choiceText = await visibleText(page, '.hv-choice');
      report.choiceText = choiceText.slice(0, 2200);
      report.steps.push('Branche de remplacement choisie; la suite est une référence hypothétique sans recette physique.');
      await capture(page, report, 'branche-choisie-suite-hypothetique', '.hv-choice');
      const futureDraft = await page.$('.hv-future-recipe-draft');
      report.copyApplicability = futureDraft
        ? 'aperçu de brouillon futur visible; la source reste hypothétique et aucune recette n’est matérialisée'
        : 'pas de recette physique dans la source hypothétique; copie recette non applicable dans cette fixture';
      if (futureDraft) await capture(page, report, 'brouillon-futur-en-apercu', '.hv-future-recipe-draft');
    } else {
      report.copyApplicability = `aucun choix de branche disponible dans le rendu (${branch.length} carte(s)); aucune copie simulée`;
      report.uxFindings = [...(report.uxFindings ?? []), 'Le J5 a été conservé, mais le comparateur ne rend aucune carte de branche sélectionnable pour cette référence hypothétique.'];
      report.steps.push(`J5 conservé, mais aucune carte de branche sélectionnable n’est rendue (${branch.length}); la suite copie est sans objet.`);
    }

    await clickButton(page, 'Ma bière', { scope: '.hv-nav' });
    await page.waitForFunction(() => document.querySelector('.hv-beer')?.getClientRects().length > 0, { timeout: 10000 });
    const returned = await visibleText(page, '.hv-beer');
    assert(returned.includes('Saazer') && returned.includes('40 g'), 'Le retour doit conserver le baseline hypothétique source exact.');
    report.steps.push('Retour à Ma bière : référence source hypothétique Saazer intacte.');
    await capture(page, report, 'retour-a-la-reference', '.hv-beer');

    report.branchCardCount = branch.length;
    report.steps.push(`Comparateur J5 : ${branch.length} carte(s) de branche observée(s).`);
  } catch (error) {
    report.failureBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 5000);
    const file = `${safeName(report.flow)}-${report.width}-failure.png`;
    await page.screenshot({ path: resolve(runDirectory, file), fullPage: false }).catch(() => {});
    report.captures.push({ label: 'échec conservé', file });
    throw error;
  } finally {
    report.finalSimulationCount = await simulationCount(page).catch(() => null);
    report.finalBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 3500);
    await page.close();
  }
}

async function runAmbiguousSource(report) {
  const page = await newPage(report, 'unknown');
  try {
    await createHypotheticalSource(page, report, [{ grams: 40, use: 'Whirlpool' }, { grams: 20, use: 'Fermentation active' }]);
    const question = 'Remplacer un ajout prévu de Saazer par Styrian Golding (Celeia), après avoir choisi la ligne exacte.';
    await readQuestion(page, question);
    assert.equal(await simulationCount(page), 0, 'La question avec deux sources n’entraîne pas J5.');
    await openProgramComposer(page);
    await ensureOperation(page, 'replace');
    await fill(page, 'Nom de la proposition de programme', 'QA · source Saazer ambiguë');
    const sources = await page.$$eval('select[aria-label^="Ligne source de l’opération"]', nodes => nodes[0]
      ? [...nodes[0].options].map(option => ({ value: option.value, text: option.textContent?.trim(), selected: option.selected })) : []);
    const saazerOptions = sources.filter(row => row.value && row.text?.includes('Saazer'));
    assert(saazerOptions.length >= 2, `Deux lignes source exactes Saazer attendues, reçues : ${JSON.stringify(sources)}`);
    report.ambiguousSourceOptions = saazerOptions;
    assert(!saazerOptions.some(row => row.selected), 'Une source ambiguë ne doit pas être présélectionnée.');
    await selectOperationControl(page, 'Identité cible de l’opération', 'Styrian Golding (Celeia)');
    const incomplete = await savePreparation(page);
    assert(incomplete.includes('Préparation conservée avec les choix restant à préciser'), 'La source ambiguë doit rester incompletement conservée.');
    report.incompleteSummaryVisible = !!await page.$('.hv-decision-preparation__archive');
    assert.equal(await simulationCount(page), 0, 'Une source ambiguë ne doit pas lancer J5.');
    report.steps.push(`Deux lignes Saazer exactes présentées; aucune source présélectionnée. ${report.incompleteSummaryVisible ? 'Le besoin est visible.' : 'La notice confirme needsInput mais le récapitulatif d’archive manque.'}`);
    await capture(page, report, 'source-ambigue-sans-presel', '.hv-decision-preparation__program');

    const sourceSelector = 'select[aria-label^="Ligne source de l’opération"]';
    const source = await page.$(sourceSelector);
    const chosen = await source.evaluate(select => [...select.options].find(option => option.value && option.text.includes('Saazer · 20 g'))?.value
      ?? [...select.options].find(option => option.value && option.text.includes('Saazer'))?.value);
    assert(chosen, 'Une ligne Saazer exacte doit pouvoir être sélectionnée.');
    await source.select(chosen);
    await page.waitForSelector('[aria-label="Comparaison documentaire exacte avant convention"]', { visible: true, timeout: 12000 });
    const comparison = await visibleText(page, '[aria-label="Comparaison documentaire exacte avant convention"]');
    assert(comparison.includes('Saazer') && comparison.includes('Styrian Golding'), 'La sélection exacte doit ouvrir la comparaison documentaire avant dose.');
    report.steps.push('La ligne choisie nomme exactement son emploi et sa masse; la comparaison documentaire devient disponible avant la convention.');
    await capture(page, report, 'source-exacte-resolue-documents', '[aria-label="Comparaison documentaire exacte avant convention"]');
    await chooseSameMass(page);
    const ready = await savePreparation(page);
    report.resolutionStatus = ready.includes('Proposition prête à examiner') ? 'ready' : ready.includes('Préparation conservée avec les choix restant à préciser') ? 'needsInput' : 'unknown';
    assert.equal(report.resolutionStatus, 'ready', `La ligne source exacte ne rend pas la proposition prête : ${ready.slice(0, 1200)}`);
    await clickButton(page, 'Comparer cette proposition à la référence', { scope: '.hv-decision-preparation__archive' });
    await page.waitForSelector('.hv55-comparison', { visible: true, timeout: 30000 });
    assert.equal(await simulationCount(page), 1, 'J5 ne part qu’après résolution de la ligne et convention.');
    report.steps.push('Après sélection de la ligne ambiguë et convention, J5 part explicitement.');
    await capture(page, report, 'source-resolue-j5', '.hv55-comparison');
  } catch (error) {
    report.failureBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 5000);
    const file = `${safeName(report.flow)}-${report.width}-failure.png`;
    await page.screenshot({ path: resolve(runDirectory, file), fullPage: false }).catch(() => {});
    report.captures.push({ label: 'échec conservé', file });
    throw error;
  } finally {
    report.finalSimulationCount = await simulationCount(page).catch(() => null);
    report.finalBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 3500);
    await page.close();
  }
}

async function runComposedOperations(report) {
  const page = await newPage(report, 'planning');
  try {
    const question = 'Retirer 20 g d’Identité fictive A côté moût, puis ajouter 20 g d’Identité fictive C à cru.';
    await readQuestion(page, question);
    assert.equal(await simulationCount(page), 0, 'La lecture du geste composé ne lance pas J5.');
    await openProgramComposer(page);
    const groups = await page.$$('.hv-decision-preparation__operation');
    assert.equal(groups.length, 2, `Deux opérations composées doivent être reprises, reçu ${groups.length}.`);
    const fieldState = await page.$$eval('.hv-decision-preparation__operation select, .hv-decision-preparation__operation input, .hv-decision-preparation__operation textarea', nodes => nodes.map(node => ({
      aria: node.getAttribute('aria-label'), value: node.value, tag: node.tagName,
    })));
    report.operationFields = fieldState;
    assert(fieldState.some(row => row.aria?.startsWith('Masse à retirer') && row.value === '20'), 'Le retrait exact de 20 g doit rester dans l’opération source.');
    assert(fieldState.some(row => row.aria?.startsWith('Masse à ajouter') && row.value === '20'), 'La masse ajoutée de 20 g doit rester distincte.');
    assert(fieldState.some(row => row.aria?.startsWith('Portée du côté d’emploi') && row.value === 'coldSide'), '« À cru » doit limiter le côté froid sans choisir la phase.');
    assert(fieldState.some(row => row.aria?.startsWith('Emploi de l’opération') && row.value === ''), 'Fermentation ou après-fermentation ne doit pas être déduit.');
    await selectOperationControl(page, 'Ligne source de l’opération', 'Identité fictive A');
    await selectOperationControl(page, 'Identité cible de l’opération', 'Identité fictive C');
    await capture(page, report, 'deux-operations-20g-phase-a-choisir', '.hv-decision-preparation__program');
    let archived = await savePreparation(page);
    assert(archived.includes('Préparation conservée avec les choix restant à préciser'), 'La Page doit confirmer l’archivage des besoins froids.');
    report.firstPreparationArchiveVisible = !!await page.$('.hv-decision-preparation__archive');
    report.needsInputNotice = archived.split('\n')[0];
    assert(report.firstPreparationArchiveVisible, 'La préparation needsInput archivée doit être lisible avant reprise.');
    assert(!await page.$('.hv-decision-preparation__compare'), 'Un lot incomplet ne doit pas proposer Compare/J5.');
    assert.equal(await simulationCount(page), 0);
    report.steps.push(`Retrait et ajout de 20 g gardés dans une même préparation; côté froid connu, emploi à choisir. ${report.firstPreparationArchiveVisible ? 'Besoins rendus.' : 'Notice seule; le récapitulatif needsInput manque.'}`);
    await capture(page, report, 'preparation-composee-incomplete', '.hv-decision-preparation__program');

    assert(report.firstPreparationArchiveVisible, 'Après le correctif, la préparation needsInput doit être visible pour reprendre ses besoins.');
    await clickButton(page, 'Reprendre les choix manquants', { scope: '.hv-decision-preparation__archive' });
    report.resumeFocus = await page.evaluate(() => ({
      label: document.activeElement?.getAttribute('aria-label') ?? '',
      operationId: document.activeElement?.closest('[data-operation-id]')?.getAttribute('data-operation-id') ?? '',
      tag: document.activeElement?.tagName ?? '',
    }));
    assert(report.resumeFocus.operationId, 'Reprendre doit placer le focus dans l’opération qui porte le premier besoin.');
    assert(['INPUT', 'SELECT', 'TEXTAREA'].includes(report.resumeFocus.tag), 'Reprendre doit focaliser le contrôle du besoin.');

    await selectOperationControl(page, 'Emploi de l’opération', 'Fermentation active');
    const contactLabel = await page.$eval('input[aria-label^="Temps de contact de l’opération"], textarea[aria-label^="Temps de contact de l’opération"]', node => node.getAttribute('aria-label') ?? '');
    const temperatureLabel = await page.$eval('input[aria-label^="Température de l’opération"], textarea[aria-label^="Température de l’opération"]', node => node.getAttribute('aria-label') ?? '');
    assert(contactLabel && temperatureLabel, 'La phase doit faire apparaître les champs de contact et température requis.');
    await fill(page, contactLabel, '24');
    await fill(page, temperatureLabel, '18');
    await fill(page, 'Nom de la proposition de programme', 'QA · retrait 20 g et ajout 20 g en fermentation');
    report.explicitColdHypothesis = { use: 'fermentation', contactHours: 24, temperatureC: 18,
      note: 'Choix explicites propres à cette fixture QA, pas des mesures de brassin.' };
    archived = await savePreparation(page);
    report.readyPreparationVisible = !!await page.$('.hv-decision-preparation__archive');
    report.readyPreparationText = archived.slice(0, 3200);
    assert(archived.includes('Proposition prête à examiner'), `Les deux opérations choisies ne sont pas prêtes : ${archived.slice(0, 1200)}`);
    assert(archived.includes('20 g physiques'), 'La proposition doit garder le retrait et l’ajout comme masses physiques explicites.');
    assert.equal(await simulationCount(page), 0, 'La préparation prête n’a pas encore lancé J5.');
    report.steps.push('Reprise ciblée du besoin; emploi fermentation choisi explicitement, avec 24 h / 18 °C déclarés comme hypothèses de QA. Les deux opérations sont prêtes et conservées ensemble.');
    await capture(page, report, 'proposition-composee-prete-avant-j5', '.hv-decision-preparation__archive');
    await clickButton(page, 'Comparer cette proposition à la référence', { scope: '.hv-decision-preparation__archive' });
    await page.waitForFunction(() => !!document.querySelector('.hv55-comparison') || !!document.querySelector('.hv55-sensory-candidate'),
      { timeout: 30000 });
    report.firstSimulationCountBeforeCopy = await simulationCount(page);
    assert.equal(report.firstSimulationCountBeforeCopy, 1, 'J5 doit partir uniquement après la préparation complète et le geste Comparer.');
    report.steps.push('J5 local lancé après la préparation complète des deux opérations.');
    await capture(page, report, 'comparaison-j5-operations-composees', '.hv55-comparison, .hv55-sensory-candidate');
    const selectedBranch = await chooseScenarioBranch(page, 'QA · retrait 20 g et ajout 20 g en fermentation');
    report.comparisonKind = selectedBranch.kind;
    report.steps.push('Branche composée choisie explicitement dans le comparateur.');
    await page.waitForSelector('.hv-choice', { visible: true, timeout: 15000 });
    await page.waitForSelector('.hv-full-copy', { visible: true, timeout: 15000 });
    const copyBeforePreview = await visibleText(page, '.hv-full-copy');
    assert(copyBeforePreview.includes('Recette synthétique avant brassage'), 'Le panneau de copie doit se rattacher à la recette source exacte de la fixture.');
    await clickButton(page, 'Prévisualiser la copie complète', { scope: '.hv-full-copy' });
    await page.waitForFunction(() => document.querySelector('.hv-copy-preview')
      || document.querySelectorAll('.hv-copy-alpha').length > 0
      || document.querySelector('.hv-copy-recompute')
      || [...document.querySelectorAll('[role="alert"]')].some(node => node.getClientRects().length), { timeout: 20000 });
    const alphaRows = await page.$$eval('.hv-copy-alpha', nodes => nodes.map(node => ({
      alphaLabel: node.querySelector('input[aria-label^="Alpha de travail"], textarea[aria-label^="Alpha de travail"]')?.getAttribute('aria-label') ?? '',
      alphaValue: node.querySelector('input[aria-label^="Alpha de travail"], textarea[aria-label^="Alpha de travail"]')?.value ?? '',
      reasonLabel: node.querySelector('input[aria-label^="Motif alpha pour"], textarea[aria-label^="Motif alpha pour"]')?.getAttribute('aria-label') ?? '',
    })));
    report.copyPreviewFields = alphaRows;
    if (alphaRows.length) {
      await capture(page, report, 'alpha-de-travail-vide-avant-choix', '.hv-copy-alpha');
      const targetAlpha = alphaRows.find(row => row.alphaLabel.includes('Identité fictive C'));
      assert(targetAlpha && targetAlpha.alphaValue === '' && targetAlpha.reasonLabel,
        `La matière cible doit présenter un alpha de travail vide et son motif : ${JSON.stringify(alphaRows)}`);
      const alphaAssumption = '5,125';
      const alphaReason = 'Hypothèse synthétique de QA, aucune analyse de la matière';
      await fill(page, targetAlpha.alphaLabel, alphaAssumption);
      await fill(page, targetAlpha.reasonLabel, alphaReason);
      report.alphaAssumption = { material: 'Identité fictive C', entered: alphaAssumption, reason: alphaReason,
        basis: 'hypothèse de travail explicitement saisie; jamais présentée comme mesure' };
      assert.equal(await page.$eval(`[aria-label=${JSON.stringify(targetAlpha.alphaLabel)}]`, node => node.value), alphaAssumption);
      await capture(page, report, 'alpha-hypothese-qa-saisie-avant-apercu', '.hv-copy-alpha');
      await clickButton(page, 'Prévisualiser la copie complète', { scope: '.hv-full-copy' });
      await page.waitForFunction(() => !!document.querySelector('.hv-copy-preview')
        || [...document.querySelectorAll('[role="alert"]')].some(node => node.getClientRects().length), { timeout: 20000 });
      if (await page.$('.hv-copy-preview')) {
        const preview = await visibleText(page, '.hv-copy-preview');
        assert(preview.includes('Identité fictive C') && preview.includes('20 g'),
          `L’aperçu local ne conserve pas l’ajout de 20 g : ${preview.slice(0, 1200)}`);
        report.copyPreview = preview.slice(0, 3000);
        await capture(page, report, 'copie-preview-alpha-hypothese-qa', '.hv-copy-preview');
        const buttons = await page.$$eval('.hv-full-copy button', nodes => nodes.map(node => ({ text: node.innerText.trim(), disabled: node.disabled })));
        report.copyButtons = buttons;
        if (buttons.some(row => row.text === 'Créer la copie complète locale' && !row.disabled)) {
          await clickButton(page, 'Créer la copie complète locale', { scope: '.hv-full-copy' });
          let settlement;
          try {
            const handle = await page.waitForFunction(() => {
              const success = document.querySelector('.hv-copy-success');
              const pending = document.querySelector('.hv-copy-pending');
              const busyTransmission = [...document.querySelectorAll('.hv-copy-pending button')]
                .some(button => button.disabled || /Transmission…|Revalidation…/i.test(button.textContent ?? ''));
              if (success?.getClientRects().length && !pending && !busyTransmission) {
                return { status: 'completed', message: success.textContent?.trim() ?? '', surface: 'RecipeCopyPanel' };
              }
              const activeCopy = [...document.querySelectorAll('.hv-beer .hv-copy')]
                .find(node => node.getClientRects().length && /Copie locale ·/.test(node.textContent ?? '')
                  && /Relecture locale disponible ; aucun reçu serveur/.test(node.textContent ?? ''));
              if (activeCopy && !pending && !busyTransmission) {
                return { status: 'completed', message: activeCopy.textContent?.trim() ?? '', surface: 'activeCopy' };
              }
              const retry = pending?.querySelector('button');
              if (pending?.getClientRects().length && retry && !retry.disabled && !busyTransmission) {
                return { status: 'pending', message: pending.textContent?.trim() ?? '',
                  error: document.querySelector('.hv-copy-live[role="alert"]')?.textContent?.trim() ?? '' };
              }
              return null;
            }, { timeout: 60000 });
            settlement = await handle.jsonValue();
            await handle.dispose();
          } catch (error) {
            report.copySettlement = { status: 'timeout', error: String(error?.message ?? error),
              pendingText: await page.$eval('.hv-copy-pending', node => node.textContent?.trim() ?? '').catch(() => ''),
              appError: await page.$eval('.hv-copy-live[role="alert"]', node => node.textContent?.trim() ?? '').catch(() => '') };
            const timeoutDexie = await readFixtureCopyFromDexie(page).catch(readError => ({ error: String(readError?.message ?? readError) }));
            report.copyPendingDexie = timeoutDexie.workspaces ? summarizeFixtureCopyEvidence(timeoutDexie) : timeoutDexie;
            report.copyStatus = 'PENDING · callback de copie locale non stabilisé';
            throw new Error(`PENDING copie locale après 60 s; ${report.copySettlement.error}; `
              + `UI=${report.copySettlement.pendingText}; erreur=${report.copySettlement.appError}`);
          }
          report.copySettlement = settlement;
          if (settlement.status !== 'completed') {
            report.copyStatus = 'PENDING · callback de copie locale terminé avec une erreur; aucune réussite revendiquée';
            const pendingDexie = await readFixtureCopyFromDexie(page).catch(error => ({ error: String(error?.message ?? error) }));
            report.copyPendingDexie = pendingDexie.workspaces ? summarizeFixtureCopyEvidence(pendingDexie) : pendingDexie;
            report.copyPendingError = settlement.error;
            await capture(page, report, 'copie-pending-apres-settlement', '.hv-copy-pending');
            throw new Error(`PENDING copie locale après fin du callback; ${settlement.error || settlement.message}`);
          }

          report.copyCompletionStatus = settlement.message;
          const copyProof = await readFixtureCopyFromDexie(page);
          const workspace = copyProof.workspaces.find(row => row.activeCopyId
            && row.copies.some(copy => copy.id === row.activeCopyId));
          const copy = workspace?.copies.find(row => row.id === workspace.activeCopyId);
          const receipt = workspace?.fullCopyReceipts.find(row => row.copyId === copy?.id);
          assert(copy && receipt, `Le callback a réussi mais le Dexie fixture ne contient pas la copie et son reçu liés : ${JSON.stringify(summarizeFixtureCopyEvidence(copyProof))}`);
          assert.equal(receipt.copyId, copy.id, 'Le reçu Dexie doit référencer l’ID de copie exacte.');
          assert.equal(receipt.finalRecipeId, copy.recipeId, 'Le reçu Dexie doit référencer l’ID de Recipe exacte.');
          assert(copy.hops.some(row => row.name === 'Identité fictive C' && row.weightG === 20),
            'La copie Dexie doit garder l’ajout fictif de 20 g dans la recette.');
          report.copyDexieBeforeReload = { databaseName: copyProof.databaseName, ownerKey: copyProof.ownerKey,
            workspaceId: workspace.id, workspaceRevision: workspace.revision, sourceRecipeId: workspace.sourceRecipeId,
            activeCopyId: workspace.activeCopyId, copyId: copy.id, recipeId: copy.recipeId, recipeName: copy.recipeName,
            copiedHops: copy.hops, receipt: summarizeFixtureCopyReceipt(receipt) };
          report.copyStatus = 'copie complète locale conservée dans Dexie après callback onCopy; aucun enregistrement serveur';
          report.steps.push(`Alpha de travail ${alphaAssumption}% saisi avec motif QA; callback terminé, copie et reçu Dexie liés sous ${copy.id}.`);
          await capture(page, report, 'copie-locale-transmise-au-workspace',
            settlement.surface === 'RecipeCopyPanel' ? '.hv-copy-success' : '.hv-beer .hv-copy');

          await clickButton(page, 'Décider', { scope: '.hv-nav' });
          await page.waitForSelector('.hv-decision__question', { visible: true, timeout: 12000 });
          await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
          await page.waitForSelector('[data-testid="hop-v55-reference-panel"]', { timeout: 15000 });
          await clickButton(page, 'Ma bière', { scope: '.hv-nav' });
          await page.waitForSelector('.hv-beer', { visible: true, timeout: 12000 });
          await page.waitForFunction(name => [...document.querySelectorAll('.hv-copy')]
            .some(node => node.getClientRects().length && (node.textContent ?? '').includes(name)),
          { timeout: 20000 }, copy.recipeName);
          const copyProofAfterReload = await readFixtureCopyFromDexie(page);
          const restoredWorkspace = copyProofAfterReload.workspaces.find(row => row.id === workspace.id);
          const restoredCopy = restoredWorkspace?.copies.find(row => row.id === copy.id);
          const restoredReceipt = restoredWorkspace?.fullCopyReceipts.find(row => row.copyId === copy.id);
          assert(restoredWorkspace?.activeCopyId === copy.id && restoredCopy && restoredReceipt,
            'Après reload, le même ID de copie, reçu et activeCopyId doivent être restaurés depuis Dexie.');
          const restoredReceiptSummary = summarizeFixtureCopyReceipt(restoredReceipt);
          assert.deepEqual(restoredReceiptSummary, report.copyDexieBeforeReload.receipt,
            'Le reçu complet conservé par Dexie doit avoir le même hash avant et après reload.');
          report.copyAfterReload = { databaseName: copyProofAfterReload.databaseName, workspaceId: restoredWorkspace.id,
            workspaceRevision: restoredWorkspace.revision, activeCopyId: restoredWorkspace.activeCopyId,
            copyId: restoredCopy.id, recipeId: restoredCopy.recipeId, recipeName: restoredCopy.recipeName,
            sameIdAndReceipt: restoredReceipt.copyId === copy.id && restoredCopy.id === copy.id,
            receipt: restoredReceiptSummary };
          report.steps.push(`Reload : copie locale restaurée depuis Dexie sous le même ID ${copy.id} avec son reçu lié.`);
          await capture(page, report, 'copie-locale-restauree-apres-reload', '.hv-copy');
        } else {
          report.copyStatus = 'aperçu prêt, bouton de copie locale absent ou bloqué par les contrôles de la candidate';
          report.steps.push(`Alpha de travail ${alphaAssumption}% saisi avec motif QA; l’aperçu reste consultable mais la copie locale est bloquée.`);
        }
      } else {
        report.copyStatus = 'un autre besoin empêche encore l’aperçu après le choix explicite d’alpha';
        report.steps.push(`Alpha de travail ${alphaAssumption}% saisi avec motif QA; l’aperçu reste bloqué par un autre besoin.`);
      }
    } else if (await page.$('.hv-copy-preview')) {
      report.copyStatus = 'aperçu de copie locale généré; aucun enregistrement/copie n’a été confirmé';
      report.copyPreview = (await visibleText(page, '.hv-copy-preview')).slice(0, 2200);
    } else {
      report.copyStatus = 'la copie reste à compléter avant aperçu';
    }
    report.steps.push(report.copyStatus);
    await capture(page, report, 'copie-source-preview-ou-choix-alpha', '.hv-full-copy');
    await clickButton(page, 'Ma bière', { scope: '.hv-nav' });
    await page.waitForFunction(() => document.querySelector('.hv-beer')?.getClientRects().length > 0, { timeout: 10000 });
    if (report.copyStatus?.includes('copie complète locale conservée')) {
      await clickButton(page, 'Revenir au programme précédent', { scope: '.hv-beer' });
      await page.waitForFunction(() => !document.body.innerText.includes('Copie locale ·')
        && (document.querySelector('.hv-context strong')?.textContent ?? '').includes('Recette synthétique avant brassage'), { timeout: 15000 });
    }
    const sourceAfterCopy = await visibleText(page, '.hv-beer');
    assert(sourceAfterCopy.includes('Identité fictive A') && sourceAfterCopy.includes('40 g')
      && sourceAfterCopy.includes('Identité fictive B') && sourceAfterCopy.includes('30 g'),
    'Le retour doit conserver les deux lignes de la recette source exacte.');
    report.steps.push('Retour à la recette fixture : les lignes A 40 g et B 30 g restent intactes.');
    await capture(page, report, 'retour-a-la-recette-source', '.hv-beer');

    const variant = 'Retirer 20 g d’Identité fictive A côté moût, puis ajouter à cru de l’Identité fictive C sans dose décidée.';
    const j5BeforeVariant = await simulationCount(page);
    assert.equal(j5BeforeVariant, 0, 'Après reload de la copie, le calcul d’origine n’est pas relancé automatiquement.');
    await readQuestion(page, variant);
    await openProgramComposer(page);
    const variantFields = await page.$$eval('.hv-decision-preparation__operation select, .hv-decision-preparation__operation input, .hv-decision-preparation__operation textarea', nodes => nodes.map(node => ({
      aria: node.getAttribute('aria-label'), value: node.value, tag: node.tagName,
    })));
    report.variantOperationFields = variantFields;
    assert.equal((await page.$$('.hv-decision-preparation__operation')).length, 2, 'Le deuxième énoncé doit encore conserver les deux gestes.');
    assert(variantFields.some(row => row.aria?.startsWith('Masse à retirer') && row.value === '20'), 'La masse source connue doit rester exacte dans la variante.');
    const addMass = variantFields.find(row => row.aria?.startsWith('Masse à ajouter'));
    assert(addMass && addMass.value === '', 'La dose de l’ajout doit rester inconnue, jamais convertie en 0.');
    const phase = variantFields.find(row => row.aria?.startsWith('Emploi de l’opération'));
    assert(phase && phase.value === '', 'La phase froide précise doit rester inconnue.');
    await selectOperationControl(page, 'Ligne source de l’opération', 'Identité fictive A');
    await selectOperationControl(page, 'Identité cible de l’opération', 'Identité fictive C');
    archived = await savePreparation(page);
    assert(archived.includes('Préparation conservée avec les choix restant à préciser'), 'La variante avec inconnues doit être conservée comme incomplète.');
    report.variantArchiveVisible = !!await page.$('.hv-decision-preparation__archive');
    assert(report.variantArchiveVisible, 'La variante incomplete doit aussi être relisible dans son archive active.');
    assert(!await page.$('.hv-decision-preparation__compare'), 'La variante incomplète ne doit pas lancer Compare/J5.');
    assert.equal(await simulationCount(page), j5BeforeVariant, 'La variante inconnue ne doit pas ajouter un J5.');
    report.steps.push('Variante sans dose ajoutée ni phase précise : champs vides conservés, deux opérations archivées, aucun J5.');
    await capture(page, report, 'dose-phase-inconnues-conservees', '.hv-decision-preparation__archive');

    await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
    await page.waitForSelector('[data-testid="hop-v55-reference-panel"]', { timeout: 15000 });
    await page.waitForFunction(question => document.body.innerText.includes(question), { timeout: 15000 }, variant);
    await clickButton(page, 'Historique', { scope: '.hv-nav' });
    const readingSummary = await page.waitForFunction(() => [...document.querySelectorAll('.hv-main details')]
      .find(details => details.querySelector('summary')?.textContent?.includes('Lectures et préparations de question'))
      ?.querySelector('summary') ?? null, { timeout: 10000 });
    await readingSummary.asElement().evaluate(node => node.scrollIntoView({ block: 'center' }));
    if (!await readingSummary.asElement().evaluate(node => node.parentElement?.open ?? false)) await readingSummary.asElement().click();
    await page.waitForFunction(() => [...document.querySelectorAll('.hv-main details')]
      .some(details => details.querySelector('summary')?.textContent?.includes('Lectures et préparations de question') && details.open), { timeout: 5000 });
    await readingSummary.dispose();
    report.historyReadControl = await page.evaluate(question => {
      const details = [...document.querySelectorAll('.hv-main details')].find(node => node.querySelector('summary')?.textContent?.includes('Lectures et préparations de question'));
      const article = [...(details?.querySelectorAll('article') ?? [])].find(node => (node.textContent ?? '').includes(question)
        && (node.textContent ?? '').includes('préparation de programme conservée'));
      const button = [...(article?.querySelectorAll('button') ?? [])].find(node => node.textContent?.trim() === 'Relire cette lecture');
      if (article) article.setAttribute('data-qa-reading-target', 'true');
      return { detailsOpen: details?.open ?? false, articleFound: !!article, buttonFound: !!button,
        buttonDisabled: button?.disabled ?? null, buttonVisible: !!button?.getClientRects().length };
    }, variant);
    assert(report.historyReadControl.detailsOpen && report.historyReadControl.articleFound && report.historyReadControl.buttonVisible
      && !report.historyReadControl.buttonDisabled, `La ligne de lecture historique doit être ouverte et actionnable : ${JSON.stringify(report.historyReadControl)}`);
    await clickButton(page, 'Relire cette lecture', { scope: 'article[data-qa-reading-target="true"]' });
    await page.waitForFunction(() => document.body.innerText.includes('Lecture et préparation exactes rouvertes. Aucun service de lecture ou calcul relancé.'), { timeout: 15000 });
    await page.waitForSelector('.hv-decision-response--historical', { visible: true, timeout: 15000 });
    await page.waitForSelector('.hv-decision-preparation__archive', { visible: true, timeout: 15000 });
    assert.equal(await simulationCount(page), 0, 'La relecture historique du V2 incomplet doit rester à 0 J5.');
    const reopenedIncomplete = await visibleText(page, '.hv-decision-preparation__archive');
    assert(reopenedIncomplete.includes('Préparation incomplète') && reopenedIncomplete.includes('Aucune branche n’a été créée.'),
      'La lecture historique doit montrer l’état needsInput et ses opérations exactes.');
    assert(!await page.$('.hv-decision-preparation__compare'), 'Une archive historique needsInput ne doit pas exposer Compare/J5.');
    assert(!await page.$('.hv-decision-preparation__resume'), 'Une archive historique reste en lecture seule.');
    report.steps.push('Relecture directe de la lecture V2 needsInput depuis Historique : opérations et besoins scellés visibles, aucun moteur ni J5 relancé.');
    await capture(page, report, 'historique-v2-needsinput-readonly', '.hv-decision-preparation__archive');
  } catch (error) {
    report.failureBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 5000);
    const file = `${safeName(report.flow)}-${report.width}-failure.png`;
    await page.screenshot({ path: resolve(runDirectory, file), fullPage: false }).catch(() => {});
    report.captures.push({ label: 'échec conservé', file });
    throw error;
  } finally {
    report.finalSimulationCount = await simulationCount(page).catch(() => null);
    report.finalBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 3500);
    await page.close();
  }
}

async function runR19R1ArchivedReplacementResume(report) {
  const page = await newPage(report, 'planning');
  try {
    const question = 'Remplace un ajout prévu par Hallertau, sans fixer la dose pour le moment. Je veux plus de poire, garder le floral et ne pas augmenter l’amertume.';
    const simulationBefore = await simulationCount(page);
    assert.equal(simulationBefore, 0, 'La fixture commence sans calcul J5.');
    await readQuestion(page, question);
    assert.equal(await simulationCount(page), 0, 'La demande R19 seule ne lance pas J5.');

    const criteriaSummary = await page.waitForFunction(() => [...document.querySelectorAll('.hv-decision-response summary')]
      .find(summary => summary.textContent?.includes('Vérifier ou corriger les critères')) ?? null, { timeout: 15000 });
    const criteriaIsOpen = await criteriaSummary.asElement().evaluate(node => node.parentElement?.tagName === 'DETAILS'
      ? node.parentElement.open : false);
    if (!criteriaIsOpen) await criteriaSummary.asElement().click();
    await page.waitForFunction(() => {
      const summary = [...document.querySelectorAll('.hv-decision-response summary')]
        .find(node => node.textContent?.includes('Vérifier ou corriger les critères'));
      return summary?.parentElement?.tagName === 'DETAILS' && summary.parentElement.open;
    }, { timeout: 8000 });
    await criteriaSummary.dispose();
    const criterionFields = await page.$$eval('.hv-decision-preparation__criterion', nodes => nodes.map(fieldset => ({
      term: fieldset.querySelector('input[aria-label^="Terme exact"], textarea[aria-label^="Terme exact"]')?.value ?? '',
      termLabel: fieldset.querySelector('input[aria-label^="Terme exact"], textarea[aria-label^="Terme exact"]')?.getAttribute('aria-label') ?? '',
      source: fieldset.querySelector('blockquote')?.innerText ?? '',
    })));
    report.criterionDraftsBeforeCorrection = criterionFields;
    const pear = criterionFields.find(row => /poire/i.test(`${row.term} ${row.source}`));
    assert(pear?.termLabel, `Le critère poire de la question originale doit être éditable : ${JSON.stringify(criterionFields)}`);
    await fill(page, pear.termLabel, 'poire fraîche');
    await capture(page, report, 'lecture-poire-corrigee-avant-recalcul', '.hv-decision-preparation');
    await clickButton(page, 'Corriger et recalculer cette lecture', { scope: '.hv-decision-preparation' });
    await page.waitForFunction(() => (document.body.innerText ?? '').includes('Lecture corrigée conservée avec ses fragments.'), { timeout: 20000 });
    const correctedTerms = await page.$$eval('.hv-decision-preparation__criterion', nodes => nodes.map(fieldset => ({
      term: fieldset.querySelector('input[aria-label^="Terme exact"], textarea[aria-label^="Terme exact"]')?.value ?? '',
      source: fieldset.querySelector('blockquote')?.innerText ?? '',
    })));
    assert(correctedTerms.some(row => row.term === 'poire fraîche' && /poire/i.test(row.source)),
      `La correction explicite poire doit être conservée avec son extrait source exact : ${JSON.stringify(correctedTerms)}`);
    report.correctedCriteria = correctedTerms;
    assert.equal(await simulationCount(page), 0, 'Corriger la lecture ne lance pas J5.');

    await openProgramComposer(page);
    const operationKinds = await page.$$eval('.hv-decision-preparation__operation select[aria-label^="Type de l’opération"]', nodes => nodes.map(node => node.value));
    report.operationKindsBeforeSelection = operationKinds;
    await ensureOperation(page, 'replace');
    const operationCount = await page.$$eval('.hv-decision-preparation__operation', nodes => nodes.length);
    assert.equal(operationCount, 1, `Cette demande doit rester un seul remplacement, observé : ${operationCount} geste(s), ${JSON.stringify(operationKinds)}.`);
    await fill(page, 'Nom de la proposition de programme', 'R19 · Identité fictive A vers Hallertau Blanc');
    await selectOperationControl(page, 'Ligne source de l’opération', 'Identité fictive A');
    const targetOptions = await selectOperationControl(page, 'Identité cible de l’opération', 'Hallertau Blanc');
    report.selectedTarget = targetOptions.selected;
    await page.waitForSelector('[aria-label="Comparaison documentaire exacte avant convention"]', { visible: true, timeout: 15000 });
    const pairText = await visibleText(page, '[aria-label="Comparaison documentaire exacte avant convention"]');
    assert(pairText.includes('Identité fictive A') && pairText.includes('Hallertau Blanc'),
      `La paire source/cible exacte n’est pas affichée : ${pairText.slice(0, 1200)}`);
    await selectByText(page, 'select[aria-label^="Mode de dose pour l’opération"]', 'Saisir une dose cible', { exact: true });
    const doseModeState = await page.$$eval('select[aria-label^="Mode de dose pour l’opération"]', nodes => nodes.map(node => ({
      label: node.getAttribute('aria-label'), value: node.value,
    })));
    report.doseModeStateBeforeArchive = doseModeState;
    assert.equal(doseModeState[0]?.value, 'explicit', `Le mode explicite doit être choisi : ${JSON.stringify(doseModeState)}`);
    report.operationControlsAfterDoseMode = await page.$$eval('.hv-decision-preparation__program select, .hv-decision-preparation__program input, .hv-decision-preparation__program textarea', nodes => nodes.map(node => ({
      tag: node.tagName, label: node.getAttribute('aria-label'), value: node.value, visible: node.checkVisibility(),
    })));
    await page.waitForSelector('input[aria-label^="Masse cible pour"], textarea[aria-label^="Masse cible pour"]', { visible: true, timeout: 5000 });
    const initialMass = await page.$eval('input[aria-label^="Masse cible pour"], textarea[aria-label^="Masse cible pour"]', node => ({
      label: node.getAttribute('aria-label'), value: node.value,
    }));
    assert.equal(initialMass.value, '', 'La dose cible doit rester vide avant la première archive.');
    await capture(page, report, 'paire-a-hallertau-dose-nulle', '.hv-decision-preparation__program');

    const incomplete = await savePreparation(page);
    assert(incomplete.includes('Préparation incomplète') && incomplete.includes('Identité fictive A') && incomplete.includes('Hallertau Blanc'),
      `L’archive needsInput doit conserver la source, la cible et son besoin : ${incomplete.slice(0, 1600)}`);
    assert(incomplete.includes('Quantité à préciser') || incomplete.includes('Masse cible en grammes'),
      `L’unique valeur à compléter doit être la dose : ${incomplete.slice(0, 1600)}`);
    assert(!await page.$('.hv-decision-preparation__compare'), 'Une préparation incomplète ne doit pas lancer ni proposer J5.');
    assert.equal(await simulationCount(page), 0);
    const beforeReloadEvidence = await readFixtureDecisionEvidence(page);
    const workspaceBeforeReload = beforeReloadEvidence.workspaces[0];
    assert(workspaceBeforeReload, 'Le workspace fixture doit exister après sauvegarde de l’archive needsInput.');
    const initialArchive = workspaceBeforeReload.decisionReadings.find(row => row.preparation?.result.status === 'needsInput');
    assert(initialArchive, `L’archive needsInput n’est pas lue depuis Dexie : ${JSON.stringify(workspaceBeforeReload.decisionReadings)}`);
    assert(initialArchive.criterionDrafts.some(row => row.term === 'poire fraîche' && row.origin === 'brasseur'),
      'La lecture corrigée doit être scellée avant le reload.');
    const archivedOperation = initialArchive.preparation.operations[0];
    assert.equal(initialArchive.preparation.operations.length, 1);
    assert.equal(archivedOperation.kind, 'replace');
    assert.equal(initialArchive.preparation.materials.find(row => row.id === archivedOperation.sourceMaterialId)?.name,
      'Identité fictive A', `Identité A exacte absente : ${JSON.stringify(archivedOperation)}`);
    assert.equal(archivedOperation.materialId, targetOptions.selected.value);
    assert.deepEqual(archivedOperation.dose, { kind: 'explicit', grams: null });
    report.archiveBeforeReload = {
      contentReference: initialArchive.contentReference, runtimeReference: initialArchive.runtimeReference,
      criterion: initialArchive.criterionDrafts.find(row => row.term === 'poire fraîche'),
      preparationStatus: initialArchive.preparation.result.status, needs: initialArchive.preparation.result.needs,
      operations: initialArchive.preparation.operations,
    };
    report.steps.push('Lecture exacte corrigée, paire Identité fictive A → Hallertau Blanc archivée avec dose nulle; J5 reste à 0.');
    await capture(page, report, 'archive-incomplete-avant-reload', '.hv-decision-preparation__archive');

    await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
    await page.waitForSelector('[data-testid="hop-v55-reference-panel"]', { timeout: 15000 });
    await assertTargetViewport(page, report, 'Après reload avant Historique');
    assert.equal(await simulationCount(page), 0, 'Le reload de l’archive ne lance pas J5.');
    await clickButton(page, 'Historique', { scope: '.hv-nav' });
    await clickSummary(page, 'Lectures et préparations de question', { scope: '.hv-main' });
    const reopenHandle = await page.waitForFunction(question => [...document.querySelectorAll('.hv-main article')].find(article => {
      const text = article.innerText ?? '';
      return text.includes(question) && text.includes('préparation de programme conservée');
    })?.querySelector('button') ?? null, { timeout: 15000 }, question);
    await reopenHandle.asElement().evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await reopenHandle.asElement().click();
    await reopenHandle.dispose();
    await page.waitForSelector('.hv-decision-response--historical', { visible: true, timeout: 15000 });
    const historicalArchive = await visibleText(page, '.hv-decision-preparation__archive');
    assert(historicalArchive.includes('Identité fictive A') && historicalArchive.includes('Hallertau Blanc') && /masse inconnue/i.test(historicalArchive),
      `L’historique doit relire les choix exacts et la dose inconnue : ${historicalArchive.slice(0, 1800)}`);
    assert(historicalArchive.includes('Quantité à préciser') || historicalArchive.includes('Masse cible en grammes'),
      'Le besoin de quantité doit être visible dans l’archive relue.');
    assert(await page.$eval('.hv-decision-preparation__archive', node => [...node.querySelectorAll('button')]
      .some(button => button.textContent?.trim() === 'Reprendre cette préparation dans le contexte actif')),
    'Le CTA de reprise explicite manque dans Historique.');
    assert(!await page.$('.hv-decision-preparation__compare'), 'La préparation historique incomplète ne doit pas proposer J5.');
    report.steps.push('Reload puis Historique : l’archive V2 reste lisible sans recalcul; source, cible, dose nulle et critère corrigé sont présents.');
    await capture(page, report, 'archive-relue-needsinput', '.hv-decision-preparation__archive');
    await clickButton(page, 'Reprendre cette préparation dans le contexte actif', { scope: '.hv-decision-preparation__archive' });
    await page.waitForFunction(() => (document.body.innerText ?? '').includes('Choix archivés repris sans calcul.'), { timeout: 20000 });
    await page.waitForSelector('.hv-decision-response:not(.hv-decision-response--historical) .hv-decision-preparation__program', { visible: true, timeout: 15000 });
    assert.equal(await simulationCount(page), 0, 'La reprise ne relance pas parser/J5; J5 reste à 0 avant Comparer.');
    const afterResumeEvidence = await readFixtureDecisionEvidence(page);
    const workspaceAfterResume = afterResumeEvidence.workspaces.find(row => row.id === workspaceBeforeReload.id);
    assert(workspaceAfterResume, 'Le workspace existe après la reprise.');
    const preservedArchive = workspaceAfterResume.decisionReadings.find(row => row.contentReference === initialArchive.contentReference);
    assert.deepEqual(preservedArchive, initialArchive, 'L’archive source doit rester bit-à-bit lisible après la reprise.');
    const resumedArchive = workspaceAfterResume.decisionReadings.find(row => row.contentReference !== initialArchive.contentReference
      && row.preparation?.result.status === 'needsInput');
    assert(resumedArchive, 'Une nouvelle archive de préparation needsInput doit être créée par la reprise.');
    assert.equal(resumedArchive.question, question, 'La question ne doit pas être réinterprétée ni réécrite.');
    assert.deepEqual(resumedArchive.criteria, initialArchive.criteria);
    assert.deepEqual(resumedArchive.criterionDrafts, initialArchive.criterionDrafts);
    assert.deepEqual(resumedArchive.preparation.operations, initialArchive.preparation.operations);
    assert.deepEqual(resumedArchive.preparation.result.needs.map(row => row.field), ['quantity']);
    assert.equal(resumedArchive.preparation.result.status, 'needsInput');
    const resumeFormValues = await page.$$eval('.hv-decision-preparation__program .hv-decision-preparation__operation', nodes => nodes.map(fieldset => ({
      source: fieldset.querySelector('select[aria-label^="Ligne source"]')?.selectedOptions[0]?.textContent?.trim() ?? '',
      target: fieldset.querySelector('select[aria-label^="Matière exacte cible"], select[aria-label^="Identité cible"]')?.selectedOptions[0]?.textContent?.trim() ?? '',
      mode: fieldset.querySelector('select[aria-label^="Mode de dose"]')?.value ?? '',
      mass: fieldset.querySelector('input[aria-label^="Masse cible"], textarea[aria-label^="Masse cible"]')?.value ?? '',
    })));
    report.resumedForm = resumeFormValues;
    assert.equal(resumeFormValues.length, 1);
    assert(resumeFormValues[0].source.includes('Identité fictive A') && resumeFormValues[0].target.includes('Hallertau Blanc'),
      `La reprise doit préremplir source et cible : ${JSON.stringify(resumeFormValues)}`);
    assert.equal(resumeFormValues[0].mode, 'explicit');
    assert.equal(resumeFormValues[0].mass, '', 'La dose, seule valeur manquante, reste vide après la reprise.');
    report.steps.push('Reprise explicite : le parent réévalue dans le contexte actif, conserve l’archive source et préremplit A→Hallertau; seule la dose reste à saisir.');
    await capture(page, report, 'reprise-active-dose-seule-a-completer', '.hv-decision-preparation__program');

    const massLabel = await page.$eval('input[aria-label^="Masse cible pour"], textarea[aria-label^="Masse cible pour"]', node => node.getAttribute('aria-label') ?? '');
    assert(massLabel, 'Le champ de masse cible doit apparaître après la reprise.');
    await fill(page, massLabel, '17,625');
    const branchLabel = await page.$eval('input[aria-label="Nom de la proposition de programme"], textarea[aria-label="Nom de la proposition de programme"]', node => node.getAttribute('aria-label') ?? '');
    await fill(page, branchLabel, 'R19 · remplacement A par Hallertau Blanc');
    assert.equal(await simulationCount(page), 0, 'Saisir 17,625 g ne doit pas déclencher J5.');
    await capture(page, report, 'dose-17625-saisie-avant-archivage', '.hv-decision-preparation__program');
    const readyArchiveText = await savePreparation(page);
    report.readyPreparation = readyArchiveText.slice(0, 2600);
    assert(readyArchiveText.includes('Proposition prête à examiner') && readyArchiveText.includes('17,625 g physiques')
      && readyArchiveText.includes('Hallertau Blanc'), `La préparation prête doit garder les 17,625 g : ${readyArchiveText.slice(0, 1700)}`);
    assert(readyArchiveText.includes('Identité fictive B') && readyArchiveText.includes('30 g physiques'),
      `La ligne B30 g doit rester lisible dans le programme proposé : ${readyArchiveText.slice(0, 2200)}`);
    const readyEvidence = await readFixtureDecisionEvidence(page);
    const readyWorkspace = readyEvidence.workspaces.find(row => row.id === workspaceBeforeReload.id);
    const readyArchive = readyWorkspace?.decisionReadings.find(row => row.preparation?.result.status === 'ready');
    assert(readyArchive, 'La préparation prête doit être durablement relisible dans Dexie.');
    const sourceB = readyArchive.preparation.program.additions.find(line => line.id === 'recipe-hop:1');
    const proposedB = readyArchive.preparation.result.proposalAdditions.find(line => line.id === 'recipe-hop:1');
    assert.deepEqual({ grams: sourceB?.grams, use: sourceB?.use, contactHours: sourceB?.contactHours, temperatureC: sourceB?.temperatureC },
      { grams: 30, use: 'fermentation', contactHours: 48, temperatureC: 19 }, 'Le programme source B doit conserver 30 g / 48 h / 19 °C.');
    assert.deepEqual({ grams: proposedB?.grams, use: proposedB?.use, contactHours: proposedB?.contactHours, temperatureC: proposedB?.temperatureC },
      { grams: 30, use: 'fermentation', contactHours: 48, temperatureC: 19 }, 'Le programme proposé doit conserver B30/48 h/19 °C.');
    report.preservedB = { source: sourceB, proposed: proposedB };
    assert.equal(await simulationCount(page), 0, 'La préparation prête n’est pas J5 tant que Comparer n’est pas pressé.');
    report.steps.push('Dose cible 17,625 g saisie; B30 g / 48 h / 19 °C reste conservé. Proposition ready archivée, J5 encore à 0.');
    await capture(page, report, 'proposition-ready-avant-comparer', '.hv-decision-preparation__archive');

    await clickButton(page, 'Comparer cette proposition à la référence', { scope: '.hv-decision-preparation__archive' });
    await page.waitForFunction(() => !!document.querySelector('.hv55-comparison') || !!document.querySelector('.hv55-sensory-candidate'), { timeout: 30000 });
    report.simulationCountAfterCompare = await simulationCount(page);
    assert.equal(report.simulationCountAfterCompare, 1, 'Le clic Comparer doit déclencher exactement un J5.');
    await capture(page, report, 'j5-apres-comparer-explicite', '.hv55-comparison, .hv55-sensory-candidate');
    const chosenBranch = await chooseScenarioBranch(page, 'R19 · remplacement A par Hallertau Blanc');
    report.chosenBranch = chosenBranch;
    await page.waitForSelector('.hv-choice', { visible: true, timeout: 15000 });
    await page.waitForSelector('.hv-full-copy', { visible: true, timeout: 15000 });
    assert((await visibleText(page, '.hv-choice')).includes('Hallertau Blanc'), 'Le candidat choisi doit rester celui préparé.');
    await capture(page, report, 'branche-j5-choisie', '.hv-choice');

    const copyBeforePreview = await visibleText(page, '.hv-full-copy');
    assert(copyBeforePreview.includes('Recette synthétique avant brassage'), 'La copie doit rester ancrée à la recette source synthétique attendue.');
    await clickButton(page, 'Prévisualiser la copie complète', { scope: '.hv-full-copy' });
    await page.waitForFunction(() => document.querySelector('.hv-copy-preview') || document.querySelectorAll('.hv-copy-alpha').length > 0
      || [...document.querySelectorAll('[role="alert"]')].some(node => node.getClientRects().length), { timeout: 20000 });
    let alphaRows = await page.$$eval('.hv-copy-alpha', nodes => nodes.map(node => ({
      text: node.innerText ?? '',
      label: node.querySelector('input[aria-label^="Alpha de travail"], textarea[aria-label^="Alpha de travail"]')?.getAttribute('aria-label') ?? '',
      value: node.querySelector('input[aria-label^="Alpha de travail"], textarea[aria-label^="Alpha de travail"]')?.value ?? '',
      reason: node.querySelector('input[aria-label^="Motif alpha pour"], textarea[aria-label^="Motif alpha pour"]')?.getAttribute('aria-label') ?? '',
    })));
    report.alphaRowsBeforeChoice = alphaRows;
    const alphaRow = alphaRows.find(row => /Hallertau Blanc/i.test(row.label));
    assert(alphaRow?.label && alphaRow.reason, `La ligne Hallertau doit demander un alpha motivé : ${JSON.stringify(alphaRows)}`);
    report.alphaDomainVisible = alphaRow.text;
    assert(/9\s*(?:–|-|à)\s*12/i.test(alphaRow.text) && /source|Hopsteiner/i.test(alphaRow.text)
      && /Portée variétale/i.test(alphaRow.text),
      `Plage 9–12%, source et portée doivent rester visibles près du champ : ${alphaRow.text}`);
    await capture(page, report, 'alpha-domaine-source-portee', '.hv-copy-alpha-evidence');
    await capture(page, report, 'alpha-champ-et-motif', 'input[aria-label^="Alpha de travail"], textarea[aria-label^="Alpha de travail"]');

    const rejectedReason = 'Hypothèse synthétique de QA sous le domaine affiché; aucune analyse de lot.';
    await fill(page, alphaRow.label, '5,875');
    await fill(page, alphaRow.reason, rejectedReason);
    await clickButton(page, 'Prévisualiser la copie complète', { scope: '.hv-full-copy' });
    await page.waitForFunction(() => [...document.querySelectorAll('.hv-full-copy [role="alert"], .hv-copy-live[role="alert"], .hv-copy-alpha [role="alert"]')]
      .some(node => node.getClientRects().length), { timeout: 15000 });
    const refusedAlpha = await page.$eval(`[aria-label=${JSON.stringify(alphaRow.label)}]`, node => node.value);
    const refusalText = await page.$$eval('[role="alert"]', nodes => nodes.filter(node => node.getClientRects().length).map(node => node.innerText.trim()).join(' · '));
    assert.equal(refusedAlpha, '5,875', 'Le refus doit garder la valeur saisie pour correction.');
    assert(refusalText, 'Le dépassement du domaine doit expliquer le refus.');
    report.refusedAlpha = { valueRetained: refusedAlpha, reason: rejectedReason, message: refusalText };
    const afterRefusalDexie = await readFixtureCopyFromDexie(page);
    assert(afterRefusalDexie.workspaces.every(row => row.copies.length === 0 && row.fullCopyReceipts.length === 0),
      'Le refus alpha ne doit créer ni copie ni reçu.');
    assert.equal(await simulationCount(page), 1, 'Le refus de copie ne recalcule pas J5.');
    report.steps.push('Alpha 5,875% sous la plage affichée refusé; la valeur et le motif restent dans le formulaire, aucun reçu créé.');
    await capture(page, report, 'alpha-5875-refuse-valeur-conservee', '.hv-copy-alpha');

    const acceptedReason = 'Hypothèse synthétique de QA dans la plage documentaire visible 9–12 %, aucune analyse de lot.';
    await fill(page, alphaRow.label, '10,375');
    await fill(page, alphaRow.reason, acceptedReason);
    await clickButton(page, 'Prévisualiser la copie complète', { scope: '.hv-full-copy' });
    await page.waitForFunction(() => !!document.querySelector('.hv-copy-preview')
      || [...document.querySelectorAll('.hv-full-copy [role="alert"], .hv-copy-live[role="alert"]')].some(node => node.getClientRects().length), { timeout: 20000 });
    assert(await page.$('.hv-copy-preview'), `L’alpha motivé 10,375% devrait permettre l’aperçu : ${await page.$eval('body', node => node.innerText).catch(() => '')}`);
    const previewText = await visibleText(page, '.hv-copy-preview');
    assert(previewText.includes('Hallertau Blanc') && previewText.includes('17,625'), `L’aperçu doit garder le remplacement et la dose : ${previewText.slice(0, 2000)}`);
    assert(previewText.includes('Identité fictive B') && previewText.includes('30'), 'L’aperçu doit conserver la ligne B.');
    report.acceptedAlpha = { value: '10,375', reason: acceptedReason, displayedDomain: alphaRow.text };
    report.copyPreview = previewText.slice(0, 4000);
    report.steps.push('Alpha 10,375% accepté seulement comme hypothèse QA motivée; aperçu conserve Hallertau 17,625 g et B30 g.');
    await capture(page, report, 'alpha-10375-apercu-valide', '.hv-copy-preview');

    const copyButtons = await page.$$eval('.hv-full-copy button', nodes => nodes.map(node => ({ text: node.innerText.trim(), disabled: node.disabled })));
    report.copyButtons = copyButtons;
    assert(copyButtons.some(row => row.text === 'Créer la copie complète locale' && !row.disabled),
      `Le bouton de copie locale doit être disponible après l’aperçu : ${JSON.stringify(copyButtons)}`);
    await clickButton(page, 'Créer la copie complète locale', { scope: '.hv-full-copy' });
    const settlementHandle = await page.waitForFunction(() => {
      const success = document.querySelector('.hv-copy-success');
      const pending = document.querySelector('.hv-copy-pending');
      const busy = [...document.querySelectorAll('.hv-copy-pending button')].some(button => button.disabled || /Transmission…|Revalidation…/i.test(button.textContent ?? ''));
      if (success?.getClientRects().length && !pending && !busy) return { status: 'completed', message: success.textContent?.trim() ?? '', surface: 'RecipeCopyPanel' };
      const activeCopy = [...document.querySelectorAll('.hv-beer .hv-copy')].find(node => node.getClientRects().length
        && /Copie locale ·/.test(node.textContent ?? '') && /Relecture locale disponible ; aucun reçu serveur/.test(node.textContent ?? ''));
      if (activeCopy && !pending && !busy) return { status: 'completed', message: activeCopy.textContent?.trim() ?? '', surface: 'activeCopy' };
      const retry = pending?.querySelector('button');
      if (pending?.getClientRects().length && retry && !retry.disabled && !busy) return { status: 'pending', message: pending.textContent?.trim() ?? '',
        error: document.querySelector('.hv-copy-live[role="alert"]')?.textContent?.trim() ?? '' };
      return null;
    }, { timeout: 60000 });
    const settlement = await settlementHandle.jsonValue();
    await settlementHandle.dispose();
    report.copySettlement = settlement;
    assert.equal(settlement.status, 'completed', `Le callback de copie ne s’est pas terminé : ${JSON.stringify(settlement)}`);
    const copyProof = await readFixtureCopyFromDexie(page);
    const workspaceCopy = copyProof.workspaces.find(row => row.activeCopyId && row.copies.some(copy => copy.id === row.activeCopyId));
    const copy = workspaceCopy?.copies.find(row => row.id === workspaceCopy.activeCopyId);
    const receipt = workspaceCopy?.fullCopyReceipts.find(row => row.copyId === copy?.id);
    assert(copy && receipt, `Callback terminé sans copie/reçu Dexie lié : ${JSON.stringify(summarizeFixtureCopyEvidence(copyProof))}`);
    assert.equal(receipt.copyId, copy.id);
    assert.equal(receipt.finalRecipeId, copy.recipeId);
    assert(copy.hops.some(row => /Hallertau Blanc/i.test(row.name) && row.weightG === 17.625), 'La copie doit porter 17,625 g Hallertau.');
    const copiedB = copy.hops.find(row => /Identité fictive B/i.test(row.name));
    assert(copiedB && copiedB.weightG === 30 && copiedB.aromaContactHours === 48 && copiedB.aromaTemperatureC === 19,
      `La copie doit garder B30 g / 48 h / 19 °C : ${JSON.stringify(copiedB)}`);
    report.copyConfirmed = { status: settlement.status, message: settlement.message, workspaceId: workspaceCopy.id,
      activeCopyId: workspaceCopy.activeCopyId, copyId: copy.id, recipeId: copy.recipeId, receiptCopyId: receipt.copyId,
      receiptRecipeId: receipt.finalRecipeId, hops: copy.hops };
    report.steps.push(`Callback terminé; la copie et son reçu local Dexie sont liés sous ${copy.id}.`);
    await capture(page, report, 'copie-confirmee-et-recue-local', '.hv-copy-success, .hv-beer .hv-copy');

    await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
    await page.waitForSelector('[data-testid="hop-v55-reference-panel"]', { timeout: 15000 });
    await assertTargetViewport(page, report, 'Après reload de la copie');
    await clickButton(page, 'Ma bière', { scope: '.hv-nav' });
    await page.waitForFunction(recipeName => [...document.querySelectorAll('.hv-copy')].some(node => node.getClientRects().length
      && (node.textContent ?? '').includes(recipeName)), { timeout: 20000 }, copy.recipeName);
    const reloadedCopyEvidence = await readFixtureCopyFromDexie(page);
    const restoredWorkspace = reloadedCopyEvidence.workspaces.find(row => row.id === workspaceCopy.id);
    const restoredCopy = restoredWorkspace?.copies.find(row => row.id === copy.id);
    const restoredReceipt = restoredWorkspace?.fullCopyReceipts.find(row => row.copyId === copy.id);
    assert(restoredWorkspace?.activeCopyId === copy.id && restoredCopy && restoredReceipt, 'Après reload, les mêmes copie et reçu doivent se relire.');
    assert.equal(restoredReceipt.finalRecipeId, copy.recipeId);
    const restoredB = restoredCopy.hops.find(row => /Identité fictive B/i.test(row.name));
    assert(restoredB && restoredB.weightG === 30 && restoredB.aromaContactHours === 48 && restoredB.aromaTemperatureC === 19,
      `Après reload, B30 g / 48 h / 19 °C doit rester exact : ${JSON.stringify(restoredB)}`);
    report.copyAfterReload = { workspaceId: restoredWorkspace.id, workspaceRevision: restoredWorkspace.revision,
      activeCopyId: restoredWorkspace.activeCopyId, copyId: restoredCopy.id, recipeId: restoredCopy.recipeId,
      receiptCopyId: restoredReceipt.copyId, receiptRecipeId: restoredReceipt.finalRecipeId, hops: restoredCopy.hops };
    const copyCard = await visibleText(page, '.hv-copy');
    assert(copyCard.includes('Relecture locale disponible ; aucun reçu serveur'), `La relecture doit rester locale et ne pas prétendre à un reçu serveur : ${copyCard}`);
    report.steps.push(`Reload : même copie ${copy.id} et reçu local relus; aucun reçu serveur affirmé.`);
    await capture(page, report, 'copie-rechargee-meme-id-recu', '.hv-copy');

    await clickButton(page, 'Revenir au programme précédent', { scope: '.hv-beer' });
    await page.waitForFunction(() => {
      const text = document.querySelector('.hv-beer')?.innerText ?? '';
      return !text.includes('Copie locale ·') && text.includes('Identité fictive A') && text.includes('40 g')
        && text.includes('Identité fictive B') && text.includes('30 g');
    }, { timeout: 15000 });
    const sourceAfterReturn = await visibleText(page, '.hv-beer');
    report.returnedSource = sourceAfterReturn.slice(0, 2200);
    assert(sourceAfterReturn.includes('Identité fictive A') && sourceAfterReturn.includes('40 g')
      && sourceAfterReturn.includes('Identité fictive B') && sourceAfterReturn.includes('30 g'),
    `Retour à la source doit garder A40/B30 : ${sourceAfterReturn.slice(0, 1600)}`);
    const returnedDexie = await readFixtureDecisionEvidence(page);
    const finalWorkspace = returnedDexie.workspaces.find(row => row.id === workspaceCopy.id);
    assert(finalWorkspace && finalWorkspace.activeCopyId == null, 'Le retour ne doit pas laisser la copie comme programme actif.');
    report.steps.push('Retour au programme source : A40/B30 ressortent inchangés après copie/reload.');
    await capture(page, report, 'retour-source-a40-b30', '.hv-beer');
  } catch (error) {
    report.failureBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 6000);
    const file = `${safeName(report.flow)}-${report.width}-failure.png`;
    await page.screenshot({ path: resolve(runDirectory, file), fullPage: false }).catch(() => {});
    report.captures.push({ label: 'échec conservé', file });
    throw error;
  } finally {
    report.finalSimulationCount = await simulationCount(page).catch(() => null);
    report.finalBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 4500);
    await page.close();
  }
}

async function runQ07AndProducts(report) {
  const page = await newPage(report, 'planning');
  try {
    const question = 'Plus de poire, préserver le floral, ne pas augmenter l’amertume, éviter le coco; tropical facultatif.';
    await readQuestion(page, question);
    assert.equal(await simulationCount(page), 0, 'La question sensorielle seule ne doit pas lancer J5.');
    const criteriaSummary = await page.waitForFunction(() => [...document.querySelectorAll('.hv-decision-response summary')]
      .find(summary => summary.textContent?.includes('Vérifier ou corriger les critères')));
    await criteriaSummary.asElement().evaluate(node => node.scrollIntoView({ block: 'center' }));
    const criteriaOpen = await criteriaSummary.asElement().evaluate(node => node.parentElement?.open ?? false);
    if (!criteriaOpen) await criteriaSummary.asElement().click();
    await page.waitForFunction(() => [...document.querySelectorAll('.hv-decision-response summary')]
      .find(summary => summary.textContent?.includes('Vérifier ou corriger les critères'))?.parentElement?.open === true, { timeout: 5000 });
    await criteriaSummary.dispose();
    let criteria = await page.$$eval('.hv-decision-preparation__criterion', nodes => nodes.map(fieldset => ({
      term: fieldset.querySelector('input[aria-label^="Terme exact"], textarea[aria-label^="Terme exact"]')?.value ?? '',
      relation: fieldset.querySelector('select[aria-label^="Relation du fragment"]')?.value ?? '',
      qualification: fieldset.querySelector('input[aria-label^="Précision du fragment"], textarea[aria-label^="Précision du fragment"]')?.value ?? '',
      source: fieldset.querySelector('blockquote')?.innerText ?? '',
    })));
    report.initialCriteria = criteria;
    assert(criteria.length >= 4, `Q07 doit conserver plusieurs fragments critériels, reçu ${criteria.length}.`);
    const tropical = criteria.findIndex(row => /tropic/i.test(row.term) || /tropic/i.test(row.source));
    assert(tropical >= 0, `Le fragment facultatif tropical manque dans les critères éditables : ${JSON.stringify(criteria)}`);
    const relationControls = await page.$$eval('.hv-decision-preparation__criterion', nodes => nodes.map(fieldset => fieldset.querySelector('select[aria-label^="Relation du fragment"]')?.getAttribute('aria-label')));
    const relationLabel = relationControls[tropical];
    assert(relationLabel, 'Le contrôle de relation du fragment tropical est absent.');
    if (criteria[tropical].relation !== 'optional') {
      const relation = await page.$(`select[aria-label=${JSON.stringify(relationLabel)}]`);
      const optionalValue = await relation.evaluate(select => [...select.options].find(option => option.value === 'optional')?.value);
      assert.equal(optionalValue, 'optional', 'L’éditeur n’offre pas l’annotation facultative.');
      await relation.select('optional');
    }
    const selectedRelation = await page.$eval(`[aria-label=${JSON.stringify(relationLabel)}]`, node => node.value);
    assert.equal(selectedRelation, 'optional', 'La préférence tropicale doit être facultative, direction nulle.');
    const qualificationLabels = await page.$$eval('.hv-decision-preparation__criterion', nodes => nodes.map(fieldset => ({
      term: fieldset.querySelector('input[aria-label^="Terme exact"], textarea[aria-label^="Terme exact"]')?.value ?? '',
      label: fieldset.querySelector('input[aria-label^="Précision du fragment"], textarea[aria-label^="Précision du fragment"]')?.getAttribute('aria-label') ?? '',
    })));
    const tropicalQualification = qualificationLabels[tropical]?.label;
    report.tropicalQualificationLabel = tropicalQualification;
    if (tropicalQualification) {
      await clickSummary(page, 'Vérifier ou corriger les critères', { scope: '.hv-decision-response' });
      await page.waitForFunction(label => {
        const node = document.querySelector(`[aria-label=${JSON.stringify(label)}]`);
        return !!node && node.checkVisibility() && node.getClientRects().length > 0;
      }, { timeout: 10000 }, tropicalQualification);
      await fill(page, tropicalQualification, 'facultatif');
    }
    await capture(page, report, 'q07-correction-tropical-facultatif', '.hv-decision-preparation');
    const correctionButton = await page.waitForFunction(() => [...document.querySelectorAll('.hv-decision-preparation button')]
      .find(button => button.textContent?.trim() === 'Corriger et recalculer cette lecture' && !button.disabled), { timeout: 10000 });
    await correctionButton.asElement().evaluate(node => node.scrollIntoView({ block: 'center' }));
    await correctionButton.asElement().click();
    await correctionButton.dispose();
    await page.waitForFunction(() => (document.body.innerText ?? '').includes('Lecture corrigée conservée avec ses fragments.'), { timeout: 20000 });
    const corrected = await page.$$eval('.hv-decision-preparation__criterion', nodes => nodes.map(fieldset => ({
      term: fieldset.querySelector('input[aria-label^="Terme exact"], textarea[aria-label^="Terme exact"]')?.value ?? '',
      relation: fieldset.querySelector('select[aria-label^="Relation du fragment"]')?.value ?? '',
      source: fieldset.querySelector('blockquote')?.innerText ?? '',
    })));
    assert(corrected.some(row => (/tropic/i.test(row.term) || /tropic/i.test(row.source)) && row.relation === 'optional'),
      `La lecture V2 corrigée ne montre pas tropical facultatif : ${JSON.stringify(corrected)}`);
    report.correctedCriteria = corrected;
    assert.equal(await simulationCount(page), 0, 'Corriger la lecture ne déclenche pas J5.');
    report.steps.push('Fragment tropical passé explicitement en facultatif; nouvelle lecture archivée V2, sans recalcul du programme.');

    await page.reload({ waitUntil: 'networkidle0', timeout: 25000 });
    await page.waitForSelector('[data-testid="hop-v55-reference-panel"]', { timeout: 15000 });
    await clickButton(page, 'Décider', { scope: '.hv-nav' });
    await page.waitForSelector('.hv-decision-response--historical', { visible: true, timeout: 15000 });
    assert.equal(await simulationCount(page), 0, 'La réouverture de l’archive après reload reste à 0 calcul.');
    const historicalText = await visibleText(page, '.hv-decision-response--historical');
    assert(historicalText.includes(question), 'La question Q07 exacte doit être conservée dans l’archive.');
    assert(historicalText.includes('Lecture archivée') && historicalText.includes('lecture seule'), 'La réouverture doit signaler une archive non modifiable.');
    report.steps.push('Reload du workspace : Q07 V2 rouverte en lecture seule; compteur J5 toujours à 0.');
    await capture(page, report, 'q07-archive-reouverte-readonly', '.hv-decision-response--historical');

    const productQuestion = 'Quelles sont les sources, les emplois et les limites de dose pour HyperBoost et Cryo Hops ?';
    await readQuestion(page, productQuestion);
    const productPanel = await page.waitForSelector('[aria-label="Produits commerciaux documentés"]', { visible: true, timeout: 18000 });
    const productText = await productPanel.evaluate(node => node.innerText);
    assert(productText.includes('HyperBoost') && productText.includes('Cryo Hops'), 'Les deux dossiers produits doivent apparaître.');
    assert(productText.includes('Yakima Chief Hops'), 'Les sources fabricant doivent être visibles dans les dossiers.');
    assert(productText.includes('whirlpool') || productText.includes('Whirlpool'), 'L’emploi whirlpool documenté doit rester distingué.');
    assert(productText.includes('fermentation') || productText.includes('Fermentation'), 'L’emploi fermentation documenté doit rester visible.');
    assert(productText.includes('ratio massique') || productText.includes('plage') || productText.includes('40–50'),
      'Les limites/conventions spécifiques doivent être affichées sans les généraliser.');
    report.productText = productText.slice(0, 4000);
    report.steps.push('Dossiers HyperBoost et Cryo routés depuis la question : sources fabricant, emplois et limites affichés; aucune disponibilité/ingrédient n’est créé.');
    assert.equal(await simulationCount(page), 0, 'La consultation documentaire des produits ne lance pas J5.');
    await capture(page, report, 'produits-hyperboost-cryo-sources', '[aria-label="Produits commerciaux documentés"]');
  } catch (error) {
    report.failureBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 5000);
    const file = `${safeName(report.flow)}-${report.width}-failure.png`;
    await page.screenshot({ path: resolve(runDirectory, file), fullPage: false }).catch(() => {});
    report.captures.push({ label: 'échec conservé', file });
    throw error;
  } finally {
    report.finalSimulationCount = await simulationCount(page).catch(() => null);
    report.finalBodyText = (await page.$eval('body', node => node.innerText).catch(() => '')).slice(0, 3500);
    await page.close();
  }
}

async function runCase(flow, width, action) {
  const report = { flow, width, status: 'running', steps: [], captures: [], errors: [], blockedExternalRequests: [],
    startedAt: new Date().toISOString() };
  try {
    await action(report);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.error = String(error?.stack ?? error);
    report.failureBodyText = report.finalBodyText ?? '';
  }
  report.completedAt = new Date().toISOString();
  reports.push(report);
  return report;
}

try {
  for (const width of widths) {
    if (selectedFlows.includes('r19-r1')) await runCase('R19-R1-reprise-dose-copie', width, report => runR19R1ArchivedReplacementResume(report));
    if (selectedFlows.includes('q1')) await runCase('Q1-remplacement-exact-et-source-ambigue', width, report => runExactAndAmbiguousReplace(report));
    if (selectedFlows.includes('q1b')) await runCase('Q1b-source-ambigue', width, report => runAmbiguousSource(report));
    if (selectedFlows.includes('q2')) await runCase('Q2-operations-composees-20g', width, report => runComposedOperations(report));
    if (selectedFlows.includes('q3')) await runCase('Q3-correction-archive-produits', width, report => runQ07AndProducts(report));
  }
} finally {
  await browser.close().catch(() => {});
}

const report = {
  format: 'hop-v55-guided-browser-qa-v2',
  startedAt: reports[0]?.startedAt,
  completedAt: new Date().toISOString(),
  status: reports.every(row => row.status === 'passed') ? 'passed' : 'failed',
  environment: { base, entry: `${base}${manifest.entry}`, expectedServingPid: Number(process.env.HOP_V55_GUIDED_SERVING_PID || 393200), browser: 'Puppeteer-Core + Chrome headless', widths,
    fixturePrefix,
    fixturePolicy: `Chaque workspace passe par l’UI V5.5; namespace Dexie unique par parcours. Seules les requêtes loopback ${base} passent; data:/blob: restent locales. Les appels externes sont bloqués avant émission.` },
  build: { path: build, manifestSha256: sha256(manifestBytes), sourceCount: manifest.sourceCount, format: manifest.format,
    builtAt: manifest.builtAt, entry: manifest.entry },
  harness: { path: 'scripts/check-hop-v55-guided-v10.mjs', sha256: sha256(await readFile(resolve(root, 'scripts/check-hop-v55-guided-v10.mjs'))) },
  transport: 'Aucun Firebase, Gemini, serveur réel ni donnée utilisateur; la lecture et J5 utilisent la logique locale du build gelé.',
  reports,
  blockedExternalRequests,
  consoleErrors,
  pageErrors,
  localRequestCount: requestsToFixture.length,
};
await writeFile(resolve(runDirectory, 'report.json'), JSON.stringify(report, null, 2));
const summary = [
  '# QA guidée V5.5 · build local gelé', '',
  `Statut : **${report.status}** · ${report.completedAt} · viewports ${widths.join(' / ')} px.`, '',
  `Build : ${manifest.sourceCount} sources · manifest SHA-256 \`${report.build.manifestSha256}\` · serveur attendu PID ${report.environment.expectedServingPid} sur ${base}.`,
  `Harness SHA-256 \`${report.harness.sha256}\`.`, '',
  selectedFlows.includes('r19-r1')
    ? 'Ce parcours suit la recette synthétique avant brassage, avec Identité fictive A/B; il ne modifie ni recette physique ni brassin réel. Hallertau Blanc est une matière de catalogue dans la fixture; l’alpha est saisi uniquement comme hypothèse de QA.'
    : 'Les autres parcours utilisent les fixtures synthétiques de la recette ou une hypothèse déclarée par le brasseur; aucun houblon fictif n’est présenté comme réel.', '',
  ...reports.map(row => `## ${row.flow} · ${row.width}px\n\nStatut : **${row.status}**\n\n${row.steps.map(step => `- ${step}`).join('\n') || '- Aucun geste terminé.'}\n\n${row.uxFindings?.map(finding => `Réserve UI : ${finding}`).join('\n') ?? ''}\n\n${row.error ? `Erreur : \`${row.error.split('\n')[0]}\`\n\n` : ''}Captures : ${row.captures.map(capture => capture.file).join(', ') || 'aucune'}\n\n${row.finalSimulationCount != null ? `Compteur J5 final : ${row.finalSimulationCount}.` : ''}`),
  '', `Requêtes externes bloquées : ${blockedExternalRequests.length}. Erreurs console : ${consoleErrors.length}. Erreurs de page : ${pageErrors.length}.`,
  '', 'Les décisions préparées restent des propositions; les captures et statuts décrivent uniquement les gestes réellement obtenus dans cette fixture.',
].join('\n');
await writeFile(resolve(runDirectory, 'rapport.md'), summary);
console.log(JSON.stringify({ status: report.status, runDirectory, build: report.build, harness: report.harness,
  cases: reports.map(row => ({ flow: row.flow, width: row.width, status: row.status, steps: row.steps.length,
    error: row.error?.split('\n')[0], finalSimulationCount: row.finalSimulationCount, captures: row.captures.map(capture => capture.file) })),
  blockedExternalRequests: blockedExternalRequests.length, consoleErrors, pageErrors }, null, 2));
