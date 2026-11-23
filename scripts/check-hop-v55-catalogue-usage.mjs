// Local rendered QA for catalogue CREATE → ENRICH → read → use on the real
// HopV55Page with its isolated Dexie/reducer fixture runtime. Browser plugin/skill
// is not available in this delegated tool set; use the repo's existing
// puppeteer-core/Chrome harness, which blocks every request outside localhost.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildHopV55Qa } from './build-hop-v55-qa.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mission = resolve(root, 'work/houblons-v55-integration-app-2026-10-02');
const evidenceRoot = resolve(mission, 'luna-catalogue-usage/browser');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(evidenceRoot, { recursive: true });

const reusePointer = process.env.HOP_V55_CATALOGUE_QA_REUSE_BUILD === '1'
  ? JSON.parse(await readFile(resolve(mission, 'last-qa-build.json'), 'utf8')) : undefined;
const buildDirectory = reusePointer?.path ?? await buildHopV55Qa();
assert(buildDirectory.startsWith(mission + sep), 'Le build doit rester dans le dossier QA de la mission.');
const buildPointer = reusePointer ?? JSON.parse(await readFile(resolve(mission, 'last-qa-build.json'), 'utf8'));
const manifestBytes = await readFile(resolve(buildDirectory, 'manifest.json'));
assert.equal(buildPointer.path, buildDirectory, 'Le dernier pointeur QA doit désigner le build gelé utilisé.');
assert.equal(sha256(manifestBytes), buildPointer.manifestSha256, 'Le manifeste du build a changé après compilation.');
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.format, 'hop-v55-local-qa-build-v2');
assert.equal(manifest.scope, 'isolatedFixtures');
assert(manifest.sources.filter(row => row.usedByCompiler).every(row => row.snapshotPath), 'Chaque source compilée conserve son snapshot exact.');
assert(!manifest.sources.some(row => /src\/data\/seedData\.ts$/i.test(row.path)), 'Le jeu initial privé ne doit pas entrer dans le build.');
for (const path of ['src/ui/hopV55/Catalogue.tsx', 'src/ui/hopV55/Page.tsx', 'src/ui/hopV55/PlanningEditor.tsx', 'src/ui/hopV55/FixturePreview.tsx', 'src/services/hopV55/fixtureRuntime.ts']) {
  assert(manifest.sources.some(row => row.path === path && row.usedByCompiler), `La source reçue doit figurer au manifeste : ${path}`);
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2',
};
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = resolve(buildDirectory, pathname === '/' ? 'tests/qa/hop-v55/index.html' : '.' + pathname);
    if (!file.startsWith(buildDirectory + sep)) { response.writeHead(403); response.end(); return; }
    const bytes = await readFile(file);
    response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404); response.end('Fichier QA absent.'); }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const base = 'http://127.0.0.1:' + server.address().port;
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
await access(executablePath);
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--mute-audio', '--no-sandbox', '--disable-dev-shm-usage'] });
const runs = [];
const blockedRequests = [];
const remoteResponses = [];
const consoleErrors = [];
const pageErrors = [];
const utcTag = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

async function clickButton(page, label, { scope, exact = true, timeout = 16000 } = {}) {
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
  const button = handle.asElement();
  assert(button, `Bouton absent ou non visible : ${label}`);
  await button.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await button.click();
  await handle.dispose();
}

async function setField(page, label, value) {
  const selector = await page.evaluate(label => {
    const normalizeText = value => String(value ?? '').replace(/\s+/g, ' ').trim();
    const labels = [...document.querySelectorAll('label')];
    const matches = labels.flatMap((node, index) => {
      const control = node.querySelector('input,textarea,select');
      if (!control || !control.getClientRects().length || getComputedStyle(control).visibility === 'hidden') return [];
      const copy = node.cloneNode(true);
      copy.querySelectorAll('input,textarea,select').forEach(child => child.remove());
      return normalizeText(copy.textContent) === label ? [{ node, control, index }] : [];
    });
    if (matches.length !== 1) return { error: `Champ « ${label} » : ${matches.length} correspondance(s).` };
    const { control, index } = matches[0];
    const key = `qa-catalogue-${index}`;
    control.setAttribute('data-qa-catalogue-field', key);
    return { selector: `[data-qa-catalogue-field="${key}"]`, tag: control.tagName.toLowerCase() };
  }, label);
  if (selector.error) throw new Error(selector.error);
  if (selector.tag === 'select') {
    const control = await page.$(selector.selector);
    assert(control, `Select absent après ciblage : ${label}`);
    await control.select(value);
    await control.dispose();
  } else await page.locator(selector.selector).fill(value);
}

async function waitForText(page, selector, text, timeout = 16000) {
  await page.waitForFunction((selector, text) => [...document.querySelectorAll(selector)].some(node =>
    node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden'
      && String(node.textContent ?? '').replace(/\s+/g, ' ').trim().includes(text)),
  { timeout }, selector, text);
}

async function capture(page, run, name, width) {
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
    scrollY: scrollY, title: document.title,
  }));
  assert(metrics.documentWidth <= metrics.viewport + 1 && metrics.bodyWidth <= metrics.viewport + 1,
    `Débordement horizontal à ${width}px : document=${metrics.documentWidth}, body=${metrics.bodyWidth}.`);
  const file = `${run.namespace}-${name}.png`;
  await page.screenshot({ path: resolve(run.directory, file), captureBeyondViewport: false });
  run.captures.push({ file, width, ...metrics });
}

async function readCatalogueDatabase(page, namespace) {
  const databaseName = `laffinee-hop-v55-fixture-${encodeURIComponent(`${namespace}-planning`)}-catalogue-v1`;
  return page.evaluate(databaseName => new Promise((resolveRead, rejectRead) => {
    const open = indexedDB.open(databaseName);
    open.onerror = () => rejectRead(open.error ?? new Error('Ouverture de l’index catalogue fixture impossible.'));
    open.onupgradeneeded = () => { open.transaction?.abort(); rejectRead(new Error('Base catalogue fixture absente; aucune nouvelle base ne doit être créée par la QA.')); };
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('records') || !db.objectStoreNames.contains('operations')) {
        db.close(); rejectRead(new Error('Schéma de l’index catalogue fixture inattendu.')); return;
      }
      const tx = db.transaction(['records', 'operations'], 'readonly');
      const records = tx.objectStore('records').getAll();
      const operations = tx.objectStore('operations').getAll();
      tx.oncomplete = () => { const result = { records: records.result, operations: operations.result }; db.close(); resolveRead(result); };
      tx.onerror = () => { const error = tx.error ?? new Error('Lecture de l’index catalogue fixture impossible.'); db.close(); rejectRead(error); };
    };
  }), databaseName);
}

function recordOf(state, kind, name) {
  const row = state.records.find(item => item.kind === kind && item.record?.name === name);
  assert(row, `Enregistrement persistant absent : ${kind}/${name}`);
  return row;
}

function operationTrace(state, id) {
  return state.operations.filter(row => row.receipt?.targetId === id).sort((a, b) => a.receipt.revision - b.receipt.revision).map(row => ({
    operationId: row.operationId, kind: row.kind, targetId: row.targetId, status: row.receipt.status,
    revision: row.receipt.revision, fingerprint: row.receipt.fingerprint, committedAt: row.receipt.committedAt,
  }));
}

async function enterCatalogue(page) {
  await clickButton(page, 'Explorer', { scope: '.hv-nav' });
  const alreadyOpen = await page.$eval('.hv-section-title button', node => node.getAttribute('aria-pressed') === 'true');
  if (!alreadyOpen) await clickButton(page, 'Catalogues', { scope: '.hv-section-title', exact: false });
  await page.waitForSelector('.hv55-catalogue-header h2', { visible: true, timeout: 16000 });
}

async function searchFor(page, kindLabel, query) {
  await clickButton(page, kindLabel, { scope: '.hv55-kind-tabs', exact: true });
  await page.locator('#hv55-catalogue-search').fill(query);
  await clickButton(page, 'Chercher', { scope: '.hv55-search', exact: true });
  await waitForText(page, '.hv55-search-results .hv55-result-count', 'résultat');
}

async function assertCanonicalReread(page) {
  await page.waitForFunction(() => {
    const node = document.querySelector('.hv55-notice');
    const text = String(node?.textContent ?? '');
    return !!node?.getClientRects().length && !text.includes('Relecture en cours') && /Fiche enregistrée|Opération déjà appliquée/.test(text);
  }, { timeout: 16000 });
  const text = await page.$eval('.hv55-notice', node => String(node.textContent ?? '').replace(/\s+/g, ' ').trim());
  assert(!/n’a pas retrouvé|relecture a échoué/i.test(text), `La relecture canonique doit réussir : ${text}`);
}

async function createHop(page, name, run) {
  await searchFor(page, 'Houblons', name);
  await clickButton(page, 'Créer une fiche absente', { scope: '.hv55-search-results' });
  await setField(page, 'Nom de la fiche', name);
  await capture(page, run, 'hop-create-form', run.width);
  await clickButton(page, 'Créer la fiche', { scope: '.hv55-write-form' });
  await waitForText(page, '.hv55-selected h3', name);
  await assertCanonicalReread(page);
  const state = await readCatalogueDatabase(page, run.namespace);
  const row = recordOf(state, 'hopVariety', name);
  assert.equal(row.record.catalogueMeta.revision, 1);
  run.records.hop = { id: row.id, revisionAfterCreate: row.record.catalogueMeta.revision,
    fingerprintAfterCreate: row.record.catalogueMeta.fingerprint, operations: operationTrace(state, row.id) };
  run.steps.push('CREATE houblon absent → relecture canonique locale');
}

async function enrichHop(page, name, run) {
  await clickButton(page, 'Enrichir', { scope: '.hv55-selected' });
  await setField(page, 'Renseignement à ajouter', 'description');
  await page.$eval('.hv55-guided-claim', node => node.scrollIntoView({ block: 'start' }));
  await capture(page, run, 'hop-enrich-guided-entry', run.width);
  await setField(page, 'Contexte de la description', 'beer');
  await setField(page, 'Conditions détaillées de la source, si utiles', 'Fixture de dégustation synthétique');
  await setField(page, 'Description transcrite de la source', 'Note sensorielle QA');
  await setField(page, 'Nature de l’information', 'researchClaim');
  const source = { title: 'Fiche QA houblon', author: 'Banc QA', kind: 'research', reference: `fixture://qa/${run.width}/hop` };
  await setField(page, 'Titre', source.title); await setField(page, 'Auteur', source.author);
  await setField(page, 'Nature', source.kind); await setField(page, 'Référence', source.reference);
  await capture(page, run, 'hop-enrich-form', run.width);
  await clickButton(page, 'Enregistrer l’enrichissement', { scope: '.hv55-write-form' });
  await waitForText(page, '.hv55-hop-descriptions', 'Note sensorielle QA');
  await assertCanonicalReread(page);
  const state = await readCatalogueDatabase(page, run.namespace);
  const row = recordOf(state, 'hopVariety', name);
  assert.equal(row.record.catalogueMeta.revision, 2);
  assert.equal(row.record.descriptions.length, 1);
  assert.equal(row.record.descriptions[0].text, 'Note sensorielle QA');
  assert.equal(row.record.descriptions[0].context, 'beer');
  assert.equal(row.record.descriptions[0].source.reference, source.reference);
  assert.equal(row.record.catalogueMeta.claims.at(-1).context.sensoryContext, 'beer');
  assert.equal(row.record.catalogueMeta.projections.at(-1).targetField, 'hop.description');
  run.records.hop = { id: row.id, revisionAfterCreate: 1, revisionAfterEnrich: row.record.catalogueMeta.revision,
    fingerprintAfterEnrich: row.record.catalogueMeta.fingerprint, descriptions: row.record.descriptions,
    claim: row.record.catalogueMeta.claims.at(-1), operations: operationTrace(state, row.id) };
  await capture(page, run, 'hop-enrich-reread', run.width);
  run.steps.push('ENRICH houblon → description append-only, contexte/source exacts, révision 2');
}

async function createYeast(page, name, source) {
  await searchFor(page, 'Levures', name);
  await clickButton(page, 'Créer une fiche absente', { scope: '.hv55-search-results' });
  await setField(page, 'Nom de la fiche', name);
  await setField(page, 'Titre', source.title); await setField(page, 'Auteur', source.author);
  await setField(page, 'Nature', source.kind); await setField(page, 'Référence', source.reference);
  await clickButton(page, 'Créer la fiche', { scope: '.hv55-write-form' });
  await waitForText(page, '.hv55-selected h3', name);
  await assertCanonicalReread(page);
}

async function enrichYeast(page, name, run) {
  await clickButton(page, 'Enrichir', { scope: '.hv55-selected' });
  await setField(page, 'Renseignement à ajouter', 'temperature');
  await page.$eval('.hv55-guided-claim', node => node.scrollIntoView({ block: 'start' }));
  await capture(page, run, 'yeast-enrich-guided-entry', run.width);
  await setField(page, 'Type de valeur', 'range');
  await setField(page, 'Minimum documenté (°C)', '16'); await setField(page, 'Maximum documenté (°C)', '22');
  await setField(page, 'Valeur rapportée par la source', '16–22 °C');
  await setField(page, 'Nature de l’information', 'manufacturerClaim');
  await setField(page, 'Condition ou contexte, si utile', 'Température indiquée par la fiche QA');
  const source = { title: 'Fiche QA levure', author: 'Banc QA', kind: 'manufacturer', reference: `fixture://qa/${run.width}/yeast` };
  await setField(page, 'Titre', source.title); await setField(page, 'Auteur', source.author);
  await setField(page, 'Nature', source.kind); await setField(page, 'Référence', source.reference);
  await capture(page, run, 'yeast-enrich-form', run.width);
  await clickButton(page, 'Enregistrer l’enrichissement', { scope: '.hv55-write-form' });
  await waitForText(page, '.hv55-claims', '16–22 °C');
  await assertCanonicalReread(page);
  const state = await readCatalogueDatabase(page, run.namespace);
  const row = recordOf(state, 'yeastStrain', name);
  const reading = row.record.reviewedDocumentary?.technicalSelections?.temperature;
  assert.equal(row.record.catalogueMeta.revision, 2);
  assert.deepEqual(reading?.range, { min: 16, max: 22 });
  assert.equal(reading?.unit, '°C');
  assert.equal(reading?.sourceUrl, undefined);
  assert.equal(row.record.catalogueMeta.claims.at(-1).source.reference, source.reference);
  assert.equal(row.record.catalogueMeta.claims.at(-1).context, 'Température indiquée par la fiche QA');
  assert.equal(row.record.catalogueMeta.projections.at(-1).targetField, 'reviewedDocumentary.technicalSelections.temperature');
  run.records.yeast = { id: row.id, revisionAfterCreate: 1, revisionAfterEnrich: row.record.catalogueMeta.revision,
    fingerprintAfterEnrich: row.record.catalogueMeta.fingerprint, reading, claim: row.record.catalogueMeta.claims.at(-1), operations: operationTrace(state, row.id) };
  await capture(page, run, 'yeast-enrich-reread', run.width);
  run.steps.push('CREATE/ENRICH levure → 16–22 °C et contexte sourcé, révision 2');
}

async function createStyle(page, guideName, styleName, source, run) {
  await searchFor(page, 'Styles', guideName);
  await clickButton(page, 'Créer une fiche absente', { scope: '.hv55-search-results' });
  await setField(page, 'Nom de la fiche', guideName);
  await setField(page, 'Version', 'qa-v1'); await setField(page, 'Édition', 'QA');
  await setField(page, 'Statut', 'true'); await setField(page, 'Attribution', 'Banc QA');
  await setField(page, 'Code du style', `Q${run.width}`); await setField(page, 'Nom du style', styleName);
  await setField(page, 'Famille', 'QA');
  await setField(page, 'Titre', source.title); await setField(page, 'Auteur', source.author);
  await setField(page, 'Nature', source.kind); await setField(page, 'Référence', source.reference);
  await capture(page, run, 'style-create-form', run.width);
  await clickButton(page, 'Créer la fiche', { scope: '.hv55-write-form' });
  await waitForText(page, '.hv55-selected h3', styleName);
  await assertCanonicalReread(page);
  const state = await readCatalogueDatabase(page, run.namespace);
  const row = recordOf(state, 'brewingStyle', guideName);
  assert.equal(row.record.catalogueMeta.revision, 1);
  assert.equal(row.record.styles.length, 1);
  assert(row.record.styles[0].id, 'Le fournisseur doit fournir un styleId canonique.');
  run.records.style = { guideId: row.id, versionAfterCreate: row.record.version, styleId: row.record.styles[0].id,
    revisionAfterCreate: row.record.catalogueMeta.revision, fingerprintAfterCreate: row.record.catalogueMeta.fingerprint,
    operations: operationTrace(state, row.id) };
  run.steps.push('CREATE guide/style → IDs et source relus du record canonique');
}

async function enrichStyle(page, guideName, run) {
  await clickButton(page, 'Enrichir', { scope: '.hv55-selected' });
  await setField(page, 'Nouvelle version du guide', 'qa-v2');
  await setField(page, 'Renseignement à ajouter', 'styleStat');
  await setField(page, 'Statistique', 'ibu');
  await page.$eval('.hv55-guided-claim', node => node.scrollIntoView({ block: 'start' }));
  await capture(page, run, 'style-enrich-guided-entry', run.width);
  await setField(page, 'Minimum (IBU)', '18'); await setField(page, 'Maximum (IBU)', '26');
  await setField(page, 'Valeur rapportée par la source', '18–26 IBU');
  await setField(page, 'Nature de l’information', 'researchClaim');
  const source = { title: 'Fiche QA guide', author: 'Banc QA', kind: 'research', reference: `fixture://qa/${run.width}/style` };
  await setField(page, 'Titre', source.title); await setField(page, 'Auteur', source.author);
  await setField(page, 'Nature', source.kind); await setField(page, 'Référence', source.reference);
  await capture(page, run, 'style-enrich-form', run.width);
  await clickButton(page, 'Enregistrer l’enrichissement', { scope: '.hv55-write-form' });
  await waitForText(page, '.hv55-stylefacts', '18–26 IBU');
  await assertCanonicalReread(page);
  const state = await readCatalogueDatabase(page, run.namespace);
  const row = recordOf(state, 'brewingStyle', guideName);
  assert.equal(row.record.catalogueMeta.revision, 2);
  assert.equal(row.record.version, 'qa-v2');
  assert.equal(row.record.history?.[0]?.version, 'qa-v1');
  const priorStyleId = run.records.style.styleId;
  assert.equal(row.record.styles[0].id, priorStyleId, 'L’ENRICH garde le styleId exact.');
  assert.deepEqual(row.record.styles[0].stats.ibu, { min: 18, max: 26 });
  assert.equal(row.record.styles[0].source.reference, `fixture://qa/${run.width}/style-create`, 'La source de création est préservée.');
  assert.equal(row.record.catalogueMeta.claims.at(-1).source.reference, source.reference, 'La plage IBU garde sa source exacte dans le claim.');
  const write = row.record.catalogueMeta.projections.at(-1);
  assert.equal(write.targetField, `styles.${priorStyleId}.stats.ibu`);
  run.records.style = { ...run.records.style, versionAfterCreate: 'qa-v1', versionAfterEnrich: row.record.version,
    revisionAfterEnrich: row.record.catalogueMeta.revision, fingerprintAfterEnrich: row.record.catalogueMeta.fingerprint,
    stat: row.record.styles[0].stats.ibu, claim: row.record.catalogueMeta.claims.at(-1), operations: operationTrace(state, row.id) };
  await capture(page, run, 'style-enrich-reread', run.width);
  run.steps.push('ENRICH guide/style → IBU 18–26, history v1 préservé, ID inchangé, révision 2');
}

async function rereadAndSelect(page, kindLabel, query, expectedName, run) {
  await enterCatalogue(page);
  await searchFor(page, kindLabel, query);
  await clickButton(page, expectedName, { scope: '.hv55-search-results', exact: false });
  await waitForText(page, '.hv55-selected h3', expectedName);
  const displayedRevision = await page.$eval('.hv55-selected-head .hv55-muted', node => String(node.textContent ?? '').replace(/\s+/g, ' ').trim());
  assert(displayedRevision.includes('Révision 2'), `La fiche doit être relue en révision 2: ${displayedRevision}`);
  await clickButton(page, 'Utiliser cette fiche', { scope: '.hv55-selected' });
}

async function runWidth(width) {
  const short = `${utcTag}-${width}`;
  const namespace = `qa-catalogue-${short}`;
  const directory = resolve(evidenceRoot, `run-${short}`);
  await mkdir(directory, { recursive: true });
  const run = { width, short, namespace, directory, steps: [], captures: [], errors: [], records: {}, useResults: {} };
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.on('pageerror', error => { run.errors.push(String(error?.message ?? error)); pageErrors.push(String(error?.message ?? error)); });
  page.on('console', message => { if (message.type() === 'error') { run.errors.push(message.text()); consoleErrors.push(message.text()); } });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:') || url === 'about:blank') void request.continue();
    else { blockedRequests.push({ width, url }); void request.abort(); }
  });
  page.on('response', response => { if (/^https?:/.test(response.url()) && !response.url().startsWith(base + '/')) remoteResponses.push(response.url()); });
  await page.setBypassServiceWorker(true);
  await page.setViewport({ width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => localStorage.clear());

  try {
    await page.goto(`${base}${manifest.entry}?fixture=${encodeURIComponent(namespace)}&case=planning`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.hv-nav', { visible: true, timeout: 20000 });
    await waitForText(page, '.hv-context strong', 'Recette synthétique avant brassage');
    assert.equal(await page.title(), 'L’Affinée — V5.5, fixtures d’intégration');
    await enterCatalogue(page);
    await waitForText(page, '.hv55-catalogue-header', 'Recherche fixture isolée');
    await capture(page, run, 'catalogue-initial', width);

    const hopName = `Houblon QA ${width}`;
    const yeastName = `Levure QA ${width}`;
    const styleGuideName = `Guide QA ${width}`;
    const styleName = `Style QA ${width}`;
    const yeastSource = { title: 'Fiche QA levure', author: 'Banc QA', kind: 'manufacturer', reference: `fixture://qa/${width}/yeast-create` };
    const styleSource = { title: 'Fiche QA guide', author: 'Banc QA', kind: 'research', reference: `fixture://qa/${width}/style-create` };

    await createHop(page, hopName, run);
    await enrichHop(page, hopName, run);
    await createYeast(page, yeastName, yeastSource);
    await enrichYeast(page, yeastName, run);
    await createStyle(page, styleGuideName, styleName, styleSource, run);
    await enrichStyle(page, styleGuideName, run);

    // Search/re-read/use each just-written canonical record through Page's callback.
    await rereadAndSelect(page, 'Houblons', hopName, hopName, run);
    await waitForText(page, '.hop-v55-explorer__crucible', 'Creuset');
    await waitForText(page, '.hop-v55-explorer__crucible-list', hopName);
    run.useResults.hop = { displayedInCreuset: await page.$eval('.hop-v55-explorer__crucible-list', node => String(node.textContent ?? '').replace(/\s+/g, ' ').trim()) };
    await capture(page, run, 'hop-selected-creuset', width);

    await page.locator('#hop-v55-explorer-search').fill('Identité fictive A');
    await clickButton(page, 'Ajouter Identité fictive A au creuset', { scope: '.hop-v55-explorer__materials', exact: true });
    const secondMaterialId = 'hop-v55-fixture-identity-a';
    await page.locator(`[aria-label="Quantité de ${hopName}"]`).fill('3.5');
    await page.locator('[aria-label="Quantité de Identité fictive A"]').fill('2');
    await page.locator('#hop-v55-composition-label').fill(`QA creuset ${short}`);
    const compositionUse = await page.$('#hop-v55-composition-use');
    assert(compositionUse, 'Select d’emploi du creuset absent.');
    await compositionUse.select('postFermentation');
    await compositionUse.dispose();
    await capture(page, run, 'hop-and-fixture-in-crucible', width);
    const hopMaterialText = await page.$eval('.hop-v55-explorer__crucible-list', node => String(node.textContent ?? '').replace(/\s+/g, ' ').trim());
    assert(hopMaterialText.includes(hopName) && hopMaterialText.includes('Identité fictive A'));
    run.useResults.hop.creusetWithExplicitDose = { hopName, grams: '3.5', secondMaterialId, secondMaterialGrams: '2', use: 'postFermentation' };
    run.steps.push('recherche → relecture révision 2 → Utiliser houblon → sélection visible au Creuset avec masses choisies');

    await enterCatalogue(page);
    await rereadAndSelect(page, 'Levures', yeastName, yeastName, run);
    await waitForText(page, '.hop-v55-explorer__crucible', 'Creuset');
    await page.waitForFunction(id => document.querySelector('#hop-v55-composition-yeast')?.value === id,
      { timeout: 12000 }, run.records.yeast.id);
    const yeastSelect = await page.$eval('#hop-v55-composition-yeast', node => ({ value: node.value, label: node.selectedOptions?.[0]?.textContent?.trim() ?? '' }));
    assert.equal(yeastSelect.value, run.records.yeast.id);
    assert(yeastSelect.label.includes(yeastName));
    run.useResults.yeast = yeastSelect;
    await capture(page, run, 'yeast-selected-in-crucible', width);
    run.steps.push('recherche → relecture révision 2 → Utiliser levure → ID exact sélectionné dans le Creuset');

    await enterCatalogue(page);
    await rereadAndSelect(page, 'Styles', styleGuideName, styleName, run);
    await page.waitForSelector('select[aria-label="Guide de style"]', { visible: true, timeout: 16000 });
    const styleSelection = await page.evaluate(() => ({
      guide: { value: document.querySelector('select[aria-label="Guide de style"]')?.value ?? '', label: document.querySelector('select[aria-label="Guide de style"]')?.selectedOptions?.[0]?.textContent?.trim() ?? '' },
      style: { value: document.querySelector('select[aria-label="Style exact"]')?.value ?? '', label: document.querySelector('select[aria-label="Style exact"]')?.selectedOptions?.[0]?.textContent?.trim() ?? '' },
      role: document.querySelector('select[aria-label="Rôle du style"]')?.value ?? '',
      invalid: !!document.querySelector('[role="alert"]')?.getClientRects().length,
    }));
    const expectedGuideId = run.records.style.guideId;
    const expectedStyleId = run.records.style.styleId;
    assert.equal(styleSelection.guide.value, `${encodeURIComponent(expectedGuideId)}::${encodeURIComponent('qa-v2')}`);
    assert.equal(styleSelection.style.value, [expectedGuideId, 'qa-v2', expectedStyleId].map(encodeURIComponent).join('::'));
    assert(styleSelection.guide.label.includes('qa-v2') && styleSelection.style.label.includes(styleName));
    assert.equal(styleSelection.role, '', 'Le rôle cible/référence doit rester un choix explicite.');
    assert.equal(styleSelection.invalid, false, 'Le préremplissage doit résoudre les IDs exacts.');
    run.useResults.style = { ...styleSelection, expectedGuideId, expectedStyleId, version: 'qa-v2' };
    await page.$eval('#hv-planning-style-title', node => node.scrollIntoView({ block: 'start' }));
    await capture(page, run, 'style-prefilled-planning-editor', width);
    run.steps.push('recherche → relecture révision 2 → Utiliser style → PlanningEditor prérempli par guideId/version/styleId; rôle non inventé');

    // Return to Catalogue, reload the standalone Page and re-read all persisted records.
    await clickButton(page, 'Explorer', { scope: '.hv-nav' });
    await enterCatalogue(page);
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.hv-nav', { visible: true, timeout: 20000 });
    await waitForText(page, '.hv-context strong', 'Recette synthétique avant brassage');
    await enterCatalogue(page);
    const postReload = await readCatalogueDatabase(page, namespace);
    for (const [key, kind, name] of [['hop', 'hopVariety', hopName], ['yeast', 'yeastStrain', yeastName], ['style', 'brewingStyle', styleGuideName]]) {
      const row = recordOf(postReload, kind, name);
      assert.equal(row.record.catalogueMeta.revision, 2, `Révision canonique après reload pour ${kind}.`);
      const prior = run.records[key];
      assert.equal(row.id, key === 'style' ? prior.guideId : prior.id);
      assert.equal(row.record.catalogueMeta.fingerprint, prior.fingerprintAfterEnrich, `Empreinte canonique inchangée après reload (${key}).`);
    }
    const postReloadHop = recordOf(postReload, 'hopVariety', hopName);
    const postReloadYeast = recordOf(postReload, 'yeastStrain', yeastName);
    const postReloadStyle = recordOf(postReload, 'brewingStyle', styleGuideName);
    assert.equal(postReloadStyle.record.styles[0].id, expectedStyleId);
    assert.equal(postReloadStyle.record.version, 'qa-v2');
    run.reload = {
      hop: { id: postReloadHop.id, revision: postReloadHop.record.catalogueMeta.revision, fingerprint: postReloadHop.record.catalogueMeta.fingerprint },
      yeast: { id: postReloadYeast.id, revision: postReloadYeast.record.catalogueMeta.revision, fingerprint: postReloadYeast.record.catalogueMeta.fingerprint },
      style: { guideId: postReloadStyle.id, styleId: postReloadStyle.record.styles[0].id, version: postReloadStyle.record.version,
        revision: postReloadStyle.record.catalogueMeta.revision, fingerprint: postReloadStyle.record.catalogueMeta.fingerprint },
      operations: postReload.operations.sort((a, b) => a.kind.localeCompare(b.kind) || a.receipt.revision - b.receipt.revision)
        .map(row => ({ operationId: row.operationId, targetId: row.targetId, kind: row.kind,
        status: row.receipt.status, revision: row.receipt.revision, fingerprint: row.receipt.fingerprint, committedAt: row.receipt.committedAt })),
    };
    const rereadUi = {};
    for (const item of [
      { key: 'hop', kind: 'Houblons', query: hopName, name: hopName },
      { key: 'yeast', kind: 'Levures', query: yeastName, name: yeastName },
      { key: 'style', kind: 'Styles', query: styleName, name: styleName },
    ]) {
      await searchFor(page, item.kind, item.query);
      await clickButton(page, item.name, { scope: '.hv55-search-results', exact: false });
      await waitForText(page, '.hv55-selected h3', item.name);
      const revision = await page.$eval('.hv55-selected-head .hv55-muted', node => String(node.textContent ?? '').replace(/\s+/g, ' ').trim());
      assert(revision.includes('Révision 2'), `Révision 2 attendue après reload (${item.key}): ${revision}`);
      rereadUi[item.key] = { name: item.name, revision };
      if (item.key === 'hop') await capture(page, run, 'after-reload-hop-reread', width);
    }
    run.reload.ui = rereadUi;
    run.steps.push('Retour Explorer → reload navigateur → recherche/relecture révision 2 des 3 types → IDs, empreintes et sources relus dans Dexie');

    assert.deepEqual(run.errors, [], `Console/page errors at ${width}px.`);
    assert.deepEqual(blockedRequests.filter(row => row.width === width), [], `Aucune requête externe ne doit être tentée à ${width}px.`);
    assert.deepEqual(remoteResponses, [], 'Aucune réponse distante.');
    return run;
  } catch (error) {
    run.errors.push(String(error?.stack ?? error));
    run.failureState = await page.evaluate(() => ({
      url: location.href, title: document.title,
      text: (document.body.innerText ?? '').slice(0, 6000),
      alerts: [...document.querySelectorAll('[role="alert"]')].filter(node => node.getClientRects().length).map(node => String(node.textContent ?? '').replace(/\s+/g, ' ').trim()),
      fields: [...document.querySelectorAll('input,select,textarea')].filter(node => node.getClientRects().length).map(node => ({
        label: node.getAttribute('aria-label') ?? node.labels?.[0]?.textContent?.trim() ?? '', value: node.value,
      })),
    })).catch(readError => ({ error: String(readError) }));
    await page.screenshot({ path: resolve(directory, `${namespace}-failure.png`), captureBeyondViewport: false }).catch(() => {});
    throw Object.assign(error, { run });
  } finally {
    await context.close().catch(() => {});
  }
}

let failure;
try {
  for (const width of [390, 1280]) runs.push(await runWidth(width));
  assert.deepEqual(blockedRequests, [], 'La fixture ne doit tenter aucune requête externe.');
  assert.deepEqual(remoteResponses, [], 'Aucune réponse distante ne doit être reçue.');
  assert.deepEqual(consoleErrors, [], 'Console errors pendant la QA.');
  assert.deepEqual(pageErrors, [], 'Page errors pendant la QA.');
} catch (error) {
  failure = error;
  if (error?.run && !runs.some(row => row.namespace === error.run.namespace)) runs.push(error.run);
} finally {
  await browser.close().catch(() => {});
  await new Promise(resolveClose => server.close(resolveClose));
}

const report = {
  format: 'hop-v55-catalogue-page-browser-qa-v1',
  completedAt: new Date().toISOString(),
  status: failure ? 'failed' : 'passed',
  method: 'Puppeteer fallback: Browser plugin/skill is not listed in this delegated session; the existing repo Puppeteer harness is used with the isolated standalone Page fixture and strict localhost-only request interception.',
  scope: 'Real HopV55Page/Catalogue/PlanningEditor; createHopV55FixtureServices with actual fixture reducer/store and Dexie. No production App/Host, live Firebase, user database, or paid model.',
  build: { path: buildDirectory, manifestSha256: buildPointer.manifestSha256, sourceCount: manifest.sourceCount,
    builtAt: manifest.builtAt, catalogueSource: manifest.sources.find(row => row.path === 'src/ui/hopV55/Catalogue.tsx') },
  viewports: [390, 1280],
  runs, blockedRequests, remoteResponses, consoleErrors, pageErrors,
  error: failure ? String(failure?.stack ?? failure) : undefined,
};
await writeFile(resolve(evidenceRoot, `report-${utcTag}.json`), JSON.stringify(report, null, 2));
await writeFile(resolve(evidenceRoot, `report-${utcTag}.md`), [
  '# QA navigateur — catalogue et handoff V5.5', '',
  `Statut : **${report.status}** · viewports : 390 / 1280 px.`, '', report.method, '', report.scope, '',
  `Build figé v2 : ${buildDirectory} · manifeste ${buildPointer.manifestSha256} · ${manifest.sourceCount} sources exactes.`, '',
  ...runs.map(run => `## ${run.width}px / ${run.namespace}\n\n${run.steps.map(step => `- ${step}`).join('\n')}\n\nCaptures : ${run.captures.map(capture => capture.file).join(', ')}\n\nCanonique : ${JSON.stringify(run.records)}\n\nHandoff : ${JSON.stringify(run.useResults)}\n\nReload : ${JSON.stringify(run.reload)}\n\nErreurs : ${run.errors.length ? run.errors.join(' | ') : 'aucune'}`), '',
  `Requêtes externes tentées : ${blockedRequests.length}. Réponses distantes : ${remoteResponses.length}. Console errors : ${consoleErrors.length}. Page errors : ${pageErrors.length}.`, '',
  `Réserve : ${failure ? String(failure?.message ?? failure) : 'aucune.'}`,
].join('\n'), 'utf8');
console.log(JSON.stringify({ status: report.status, buildDirectory, manifestSha256: buildPointer.manifestSha256,
  runDirectories: runs.map(row => row.directory), failure: report.error }, null, 2));
if (failure) process.exitCode = 1;
