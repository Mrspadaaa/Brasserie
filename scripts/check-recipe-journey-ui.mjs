// Local-only end-to-end browser checks for the seven-step recipe wizard.
// The QA build compiles real production UI against tests/qa/hop-recipe adapters.
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';

const buildDir = resolve(process.env.HOP_QA_BUILD_DIR || resolve(tmpdir(), 'laffinee-hop-qa-build'));
const out = resolve(process.env.HOP_QA_OUTPUT || resolve(tmpdir(), 'laffinee-recipe-journey-evidence'));
const mode = process.env.RECIPE_QA_MODE || 'journey';
const captureOnly = process.env.RECIPE_QA_CAPTURE_ONLY === '1';
const runPerformance = process.env.RECIPE_QA_PERF !== '0' && !captureOnly;
const keepServer = process.env.RECIPE_QA_KEEP_SERVER === '1';
await mkdir(out, { recursive: true });
if (process.env.HOP_QA_SKIP_BUILD !== '1') await buildHopRecipeQa(buildDir);

const walkBuildFiles = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walkBuildFiles(path) : [path];
  }));
  return nested.flat();
};
const qaBundleFiles = await walkBuildFiles(buildDir);
const qaBundleStats = { files: qaBundleFiles.length, rawBytes: 0, gzipBytes: 0, entry: undefined, entryRawBytes: 0, entryGzipBytes: 0 };
for (const file of qaBundleFiles) {
  const bytes = await readFile(file);
  const compressedBytes = gzipSync(bytes).length;
  const size = bytes.length;
  qaBundleStats.rawBytes += size;
  qaBundleStats.gzipBytes += compressedBytes;
  const pathFromBuild = relative(buildDir, file).replaceAll('\\', '/');
  if (/^assets\/index-[^/]+\.js$/u.test(pathFromBuild)) {
    assert.equal(qaBundleStats.entry, undefined, `One QA entry JS bundle exists, found a second candidate at ${pathFromBuild}`);
    qaBundleStats.entry = pathFromBuild;
    qaBundleStats.entryRawBytes = size;
    qaBundleStats.entryGzipBytes = compressedBytes;
  }
}
assert(qaBundleStats.entry, `QA entry bundle exists in ${buildDir}`);

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(buildDir, path === '/' ? 'tests/qa/hop-recipe/index.html' : `.${path}`);
    if (!file.startsWith(buildDir + sep)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const errors = [], remote = [], blocked = [], requests = [], responses = [];
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (['error', 'warn'].includes(m.type())) errors.push(m.text()); });
page.on('request', r => { requests.push(r.url()); if (/^https?:/.test(r.url()) && !r.url().startsWith(base + '/')) remote.push(r.url()); });
page.on('response', r => { if (r.status() >= 400) responses.push({ url: r.url(), status: r.status() }); });
page.on('requestfailed', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith(base + '/')) blocked.push({ url: r.url(), failure: r.failure()?.errorText }); });
const cdp = await page.createCDPSession(); await cdp.send('Network.enable');
await cdp.send('Network.setBlockedURLs', { urlPatterns: [{ urlPattern: base + '/*', block: false }], urls: ['http://*', 'https://*'] });
await page.evaluateOnNewDocument(() => {
  try {
    if (!localStorage.getItem('laffinee_ui_state')) localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' }));
  } catch { /* about:blank has an opaque origin before the QA page is loaded. */ }
});

const visible = element => !!element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
const visibleButtons = async () => page.$$eval('button', nodes => nodes.filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => ({ text: e.innerText.trim(), label: e.getAttribute('aria-label'), role: e.getAttribute('role') })));
const clickUnique = async (selector, description) => {
  const matches = await page.$$(selector);
  const live = [];
  for (const match of matches) if (await match.evaluate(e => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')) live.push(match);
  assert.equal(live.length, 1, `${description}: expected one visible match, found ${live.length}`);
  await live[0].evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await live[0].click();
};
const clickExactLabel = async (selector, label, description = label) => {
  const matches = await page.$$(selector);
  const live = [];
  for (const match of matches) {
    if (await match.evaluate((e, expected) => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' &&
      (e.getAttribute('aria-label') || e.innerText || e.textContent).trim().replace(/\s+/g, ' ') === expected, label)) live.push(match);
  }
  assert.equal(live.length, 1, `${description}: expected one visible exact label, found ${live.length}`);
  await live[0].evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await live[0].click();
};
const capture = async (name, selector) => {
  if (selector) {
    const element = await page.waitForSelector(selector, { visible: true });
    await element.evaluate(e => e.scrollIntoView({ block: 'start', inline: 'nearest' }));
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow in ${name}`);
  await page.screenshot({ path: resolve(out, `${name}.png`) });
};
const installJourneyMetrics = async () => page.evaluate(() => {
  window.__recipeJourneyMetrics = { inputs: [], navigation: [] };
  document.addEventListener('input', event => {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) || !event.target.closest('.recipe-wizard')) return;
    const start = event.timeStamp;
    requestAnimationFrame(() => requestAnimationFrame(() => window.__recipeJourneyMetrics.inputs.push(performance.now() - start)));
  }, true);
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element) || !event.target.closest('.recipe-wizard nav[aria-label="Étapes"] button')) return;
    const start = event.timeStamp;
    requestAnimationFrame(() => requestAnimationFrame(() => window.__recipeJourneyMetrics.navigation.push(performance.now() - start)));
  }, true);
});
const metricSummary = async () => page.evaluate(() => {
  const percentile = (values, p) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)].toFixed(1)) : null;
  };
  const inputs = window.__recipeJourneyMetrics.inputs;
  const navigation = window.__recipeJourneyMetrics.navigation;
  return { unit: 'ms', inputEventToFrameAfterPaint: { count: inputs.length, p50: percentile(inputs, .5), p95: percentile(inputs, .95), max: percentile(inputs, 1) }, stepNavigationToFrameAfterPaint: { count: navigation.length, p50: percentile(navigation, .5), p95: percentile(navigation, .95), max: percentile(navigation, 1) } };
});
const snapshot = async label => ({
  label,
  url: page.url(),
  body: await page.evaluate(() => document.body.innerText.slice(0, 7000)),
  buttons: await visibleButtons(),
  inputs: await page.$$eval('input,textarea,select', nodes => nodes.filter(e => e.getClientRects().length).map(e => ({ id: e.id, aria: e.getAttribute('aria-label'), placeholder: e.getAttribute('placeholder'), value: e.value, type: e.type })))
});

const journeyStepNames = ['Identité', 'Fermentescibles', 'Houblons', 'Levure', 'Paliers', 'Eau et sels', 'Récapitulatif'];
const clickTextContains = async (selector, fragment, description = fragment) => {
  const matches = await page.$$(selector), live = [];
  for (const match of matches) if (await match.evaluate((e, expected) => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && (e.getAttribute('aria-label') || e.innerText || e.textContent).replace(/\s+/g, ' ').includes(expected), fragment)) live.push(match);
  assert.equal(live.length, 1, `${description}: expected one visible match, found ${live.length}`);
  await live[0].evaluate(e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await live[0].click();
};
const selectNativeOptionByKeyboard = async (selector, value, description = value) => {
  const controls = await page.$$(selector), visibleControls = [];
  for (const control of controls) if (await control.evaluate(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')) visibleControls.push(control);
  assert.equal(visibleControls.length, 1, `${description} control is uniquely visible`);
  const control = visibleControls[0];
  const optionValues = await control.$$eval('option', options => options.map(option => option.value));
  const index = optionValues.indexOf(value);
  assert(index >= 0, `${description} exists as a native select option`);
  await control.click();
  await page.keyboard.press('Home');
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForFunction((sel, expected) => [...document.querySelectorAll(sel)].some(element => element.getClientRects().length && element.value === expected), {}, selector, value);
};
const waitStable = () => new Promise(resolve => setTimeout(resolve, 80));
const inputP95 = samples => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * .95) - 1)].toFixed(1)) : null;
};

async function runJourney() {
  const widths = process.env.RECIPE_QA_WIDTHS ? process.env.RECIPE_QA_WIDTHS.split(',').map(value => Number(value.trim())) : [320, 375, 430, 1280];
  assert(widths.length > 0 && widths.every(width => [320, 375, 430, 1280].includes(width)), 'RECIPE_QA_WIDTHS uses one or more supported viewport widths');
  assert.equal(new Set(widths).size, widths.length, 'RECIPE_QA_WIDTHS has no duplicate widths');
  const heightFor = width => width === 1280 ? 900 : 812;
  const reports = [], errorsByWidth = [], performanceFailures = [];

  for (const width of widths) {
    const height = heightFor(width), mobile = width < 500;
    const errorStart = errors.length, responseStart = responses.length, remoteStart = remote.length, blockedStart = blocked.length;
    // Give each viewport a fresh origin so a prior wizard draft cannot leak into the next run.
    await page.goto('about:blank');
    await new Promise((resolve, reject) => server.close(error => {
      if (error) { reject(error); return; }
      server.listen(0, '127.0.0.1', () => resolve());
    }));
    base = `http://127.0.0.1:${server.address().port}`;
    await cdp.send('Network.setBlockedURLs', { urlPatterns: [{ urlPattern: base + '/*', block: false }], urls: ['http://*', 'https://*'] });
    await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__hopQa?.ready(), { timeout: 12000 });
    await page.waitForFunction(() => document.body.innerText.includes('Recettes'), { timeout: 12000 });
    assert((await page.title()).includes('banc QA'), `QA-only build title at ${width}px`);
    const qaMarker = await page.evaluate(() => localStorage.getItem(window.__hopQa.marker));
    assert(qaMarker, 'The isolated QA adapter marker is present');
    await page.evaluate(() => {
      const storage = window.__hopQa.storage;
      storage.addStockItem('rawMaterials', { id: 'qa-cascade-stock', ref: 'qa-cascade-stock', name: 'Cascade', category: 'Houblon', unit: 'g', currentStock: 1000, minStock: 0, reorder: false, alphaPct: 7, supplier: 'Fixture synthétique du banc QA' });
      storage.addStockItem('rawMaterials', { id: 'qa-pale-malt', ref: 'qa-pale-malt', name: 'Malt pâle QA', category: 'Malt', unit: 'kg', currentStock: 20, minStock: 0, reorder: false, colorEbc: 4, potentialPpg: 37, supplier: 'Fixture synthétique du banc QA' });
    });

    await clickUnique('.floating-actions button[aria-label="Actions rapides"]', `Ouvrir les actions rapides à ${width}px`);
    await clickExactLabel('[role="menuitem"]', 'Créer une recette', 'Choisir le menu Créer une recette');
    await page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
    const railCount = await page.$$eval('.recipe-wizard nav[aria-label="Étapes"] button', nodes => nodes.filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').length);
    assert.equal(railCount, 7, `The visible wizard rail exposes seven labelled steps at ${width}px`);
    const routes = [], inputGroups = [];
    await capture(`journey-${width}-identite-vierge`, '.recipe-wizard #wz-title');
    if ([320, 375, 1280].includes(width) && !captureOnly) {
      const zoomEquivalent = width === 1280;
      const testWidth = zoomEquivalent ? Math.floor(width / 2) : width;
      const viewportLabel = zoomEquivalent ? '640 px CSS · reflow équivalent à 200 % (zoom non modifié)' : `${width} px`;
      const longRecipeName = 'IPA du verger — brassin de dégustation à fermentation froide';
      await page.locator('.recipe-wizard #wz-title').fill(longRecipeName);
      await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]', `Voir le titre long dans la fiche (${viewportLabel})`);
      await page.waitForFunction(name => document.querySelector('.recipe-wizard')?.innerText.includes(name), {}, longRecipeName);
      if (zoomEquivalent) await page.setViewport({ width: testWidth, height, isMobile: false, hasTouch: false });
      await page.waitForFunction(() => document.documentElement.clientWidth === innerWidth);
      assert.equal(await page.evaluate(() => innerWidth), testWidth, zoomEquivalent
        ? 'The reflow probe uses a 640 px CSS viewport equivalent to 200% at 1280 px; browser zoom itself remains unchanged'
        : `The long-label control keeps its native ${width} px viewport`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `The recipe summary has no page-level horizontal overflow at ${viewportLabel}`);
      routes.push({ step: `Récapitulatif · ${viewportLabel}`, cssWidth: testWidth, recipeName: longRecipeName });
      await capture(`journey-${width}-${zoomEquivalent ? 'css640-equivalent' : 'libelle'}-recette-longue`, '.recipe-wizard');

      await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Houblons"]', `Ouvrir Houblons (${viewportLabel})`);
      const longHopName = 'Houblon du jardin botanique — récolte expérimentale 2026';
      const longHopPicker = '.recipe-wizard [aria-label^="Ajouter un houblon"]';
      await page.waitForSelector(longHopPicker, { visible: true });
      const longHopReadOnly = await page.$eval(longHopPicker, element => element.readOnly);
      if (longHopReadOnly) { const field = page.locator(longHopPicker); await field.click(); await field.click(); }
      await page.locator(longHopPicker).fill(longHopName);
      const longCreateLabel = `Créer « ${longHopName} » (stock à zéro)`;
      await page.waitForFunction(label => [...document.querySelectorAll('li[role="option"]')].some(option => option.textContent.replace(/\s+/g, ' ').trim() === label), {}, longCreateLabel);
      await clickTextContains('li[role="option"]', longCreateLabel, 'Créer un ingrédient libre au nom long');
      await page.waitForSelector('.recipe-wizard #wz-hop-0', { visible: true });
      const longHopLayout = await page.$eval('.recipe-wizard li.panel span.font-semibold', element => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent.trim(), left: rect.left, right: rect.right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      });
      assert.equal(longHopLayout.text, longHopName, 'The custom hop name remains complete in the recipe row');
      assert(longHopLayout.left >= 0 && longHopLayout.right <= testWidth + 1 && longHopLayout.scrollWidth <= longHopLayout.clientWidth + 1,
        `The long custom hop wraps within the viewport at ${testWidth} CSS px: ${JSON.stringify(longHopLayout)}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `A long custom hop name does not create page-level horizontal overflow at ${viewportLabel}`);
      routes.push({ step: `Houblons · ingrédient libre long · ${viewportLabel}`, cssWidth: testWidth, longHopLayout });
      await capture(`journey-${width}-${zoomEquivalent ? 'css640-equivalent' : 'libelle'}-houblon-long`, '.recipe-wizard li.panel');
      await clickUnique(`.recipe-wizard button[aria-label="Retirer ${longHopName}"]`, 'Retirer l’ajout libre temporaire du contrôle zoom');
      if (zoomEquivalent) await page.setViewport({ width, height, isMobile: false, hasTouch: false });
      await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Identité"]', 'Revenir à Identité après le contrôle zoom');
      await page.locator('.recipe-wizard #wz-title').fill('');
    }
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Houblons"]', 'Ouvrir Houblons vierges');
    const blankHopPicker = '.recipe-wizard [aria-label^="Ajouter un houblon"]';
    await page.waitForSelector(blankHopPicker, { visible: true });
    const hopContextLoadingText = 'Chargement des repères levure…';
    const hopContextWasLoading = await page.evaluate(text => [...document.querySelectorAll('.recipe-wizard [role="status"]')]
      .some(status => status.getClientRects().length && status.innerText.includes(text)), hopContextLoadingText);
    if (hopContextWasLoading) {
      await page.evaluate(text => [...document.querySelectorAll('.recipe-wizard [role="status"]')]
        .find(status => status.getClientRects().length && status.innerText.includes(text))?.scrollIntoView({ block: 'center' }), hopContextLoadingText);
      await capture(`journey-${width}-houblons-loading-context`, undefined);
    }
    await page.waitForFunction(text => {
      const wizard = document.querySelector('.recipe-wizard');
      const pending = [...(wizard?.querySelectorAll('[role="status"]') ?? [])]
        .some(status => status.getClientRects().length && status.innerText.includes(text));
      return !!wizard?.querySelector('[aria-label^="Ajouter un houblon"]') && !pending;
    }, { timeout: 12000 }, hopContextLoadingText);
    routes.push({ step: 'Houblons · repères levure résolus', loadingObserved: hopContextWasLoading });
    await capture(`journey-${width}-houblons-vierges`, '.recipe-wizard [aria-label^="Ajouter un houblon"]');
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Levure"]', 'Ouvrir Levure vierge');
    await page.waitForSelector('.recipe-wizard [aria-label="Rechercher une levure"]', { visible: true });
    await capture(`journey-${width}-levure-vierge`, '.recipe-wizard [aria-label="Rechercher une levure"]');
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Identité"]', 'Revenir à Identité vierge');
    if (runPerformance) await installJourneyMetrics();
    const navigationSetup = [];

    const measureInputSeries = async (step, selector, values, label) => {
      const navigationStart = runPerformance ? await page.evaluate(() => window.__recipeJourneyMetrics.navigation.length) : null;
      await clickUnique(`.recipe-wizard nav[aria-label="Étapes"] button[aria-label="${step}"]`, `Ouvrir ${step} pour mesurer`);
      await page.waitForFunction(expected => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === expected, {}, step);
      if (runPerformance) {
        await page.waitForFunction(start => window.__recipeJourneyMetrics.navigation.length > start, {}, navigationStart);
        const samples = await page.evaluate(start => window.__recipeJourneyMetrics.navigation.slice(start), navigationStart);
        navigationSetup.push(...samples.map(durationMs => ({ phase: 'setup', step, durationMs: Number(durationMs.toFixed(1)) })));
      }
      await page.waitForSelector(selector, { visible: true });
      if (!runPerformance) return;
      const readOnly = await page.$eval(selector, element => 'readOnly' in element && element.readOnly);
      if (readOnly) {
        const field = page.locator(selector);
        await field.click(); await field.click();
        await page.waitForFunction(selector => { const element = document.querySelector(selector); return element && 'readOnly' in element && !element.readOnly; }, {}, selector);
      }
      const firstIndex = await page.evaluate(() => window.__recipeJourneyMetrics.inputs.length);
      for (const value of values) {
        const count = await page.evaluate(() => window.__recipeJourneyMetrics.inputs.length);
        await page.locator(selector).fill(value);
        await page.waitForFunction(count => window.__recipeJourneyMetrics.inputs.length > count, {}, count);
      }
      const valuesMs = await page.evaluate(index => window.__recipeJourneyMetrics.inputs.slice(index), firstIndex);
      assert(valuesMs.length >= values.length, `${label} emitted a paint sample for every trusted input`);
      inputGroups.push({ label, samples: valuesMs.length, p95Ms: inputP95(valuesMs), valuesMs: valuesMs.map(value => Number(value.toFixed(1))) });
    };

    await measureInputSeries('Identité', '.recipe-wizard #wz-title', ['QA bière A','QA bière B','QA bière C','QA bière D','QA bière E','QA bière F','QA bière G','QA bière H'], 'Nom de recette');
    const recipeName = `QA parcours ${width}`;
    await page.locator('.recipe-wizard #wz-title').fill(recipeName);
    const styleSelector = '.recipe-wizard [aria-label="Style de la bière"]';
    await page.waitForSelector(styleSelector, { visible: true });
    const styleValue = await page.$eval(styleSelector, element => element.value);
    if (styleValue !== 'American IPA') {
      const styleReadOnly = await page.$eval(styleSelector, element => element.readOnly);
      if (styleReadOnly) { const field = page.locator(styleSelector); await field.click(); await field.click(); }
      await page.locator(styleSelector).fill('American IPA');
      const styleChoices = await page.$$('li[role="option"]');
      const exactStyles = [];
      for (const choice of styleChoices) if (await choice.evaluate(e => e.querySelector('span span')?.textContent?.trim() === 'American IPA')) exactStyles.push(choice);
      assert.equal(exactStyles.length, 1, `One exact American IPA style choice at ${width}px`);
      await exactStyles[0].click();
      await page.waitForFunction(selector => document.querySelector(selector)?.value === 'American IPA', {}, styleSelector);
    }

    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Fermentescibles"]', 'Ouvrir Fermentescibles');
    const maltPicker = '.recipe-wizard [aria-label="Ajouter un fermentescible de la famille Grain"]';
    await page.waitForSelector(maltPicker, { visible: true });
    const maltReadOnly = await page.$eval(maltPicker, element => element.readOnly);
    if (maltReadOnly) { const field = page.locator(maltPicker); await field.click(); await field.click(); }
    await page.locator(maltPicker).fill('Malt pâle QA');
    const maltChoices = await page.$$('li[role="option"]');
    const exactMalts = [];
    for (const choice of maltChoices) if (await choice.evaluate(e => e.querySelector('span span')?.textContent?.trim() === 'Malt pâle QA')) exactMalts.push(choice);
    assert.equal(exactMalts.length, 1, `One exact synthetic malt stock entry at ${width}px`);
    await exactMalts[0].click();
    await page.waitForSelector('.recipe-wizard #wz-fermentable-0', { visible: true });
    await page.locator('.recipe-wizard #wz-fermentable-0').fill('5');
    assert.equal(await page.$eval('.recipe-wizard #wz-fermentable-0', element => element.value), '5');
    await capture(`journey-${width}-fermentescibles`, '.recipe-wizard #wz-fermentable-0');

    await measureInputSeries('Houblons', '.recipe-wizard [aria-label^="Ajouter un houblon"]', ['Cascade','Citra','Saaz','Hallertau','Centennial','Mosaic','Amarillo','Cascade'], 'Recherche de houblon');
    const hopPicker = '.recipe-wizard [aria-label^="Ajouter un houblon"]';
    const openPicker = async () => {
      const field = page.locator(hopPicker);
      const readOnly = await page.$eval(hopPicker, element => element.readOnly);
      if (readOnly) {
        await field.click(); await field.click();
        await page.waitForFunction(selector => { const element = document.querySelector(selector); return element && !element.readOnly; }, {}, hopPicker);
      } else {
        await field.click();
      }
      await field.fill('Cascade');
    };
    const matchingOptions = async name => {
      const options = await page.$$('li[role="option"]'), matches = [];
      for (const option of options) if (await option.evaluate((e, expected) => e.querySelector('span span')?.textContent?.trim() === expected, name)) matches.push(option);
      return matches;
    };
    await openPicker();
    await page.waitForSelector('li[role="option"]', { visible: true });
    const hopHomonyms = await matchingOptions('Cascade');
    assert.equal(hopHomonyms.length, 2, `The synthetic QA stock and public Cascade reference stay distinct at ${width}px`);
    assert.equal(await page.$$eval('.recipe-wizard .hop-stage-tabs [role="radio"][aria-checked="true"]', nodes => nodes.length), 1, 'Exactly one hot-side stage is selected');
    assert.equal(await page.$$eval('.recipe-wizard li.panel', nodes => nodes.length), 0, 'Typing a hop name does not add it without explicit selection');
    const readActiveHopOption = async () => page.evaluate(selector => {
      const field = document.querySelector(selector), id = field?.getAttribute('aria-activedescendant');
      return id ? document.getElementById(id)?.getAttribute('aria-label') : null;
    }, hopPicker);
    let activeHopOption = await readActiveHopOption();
    for (let index = 0; index < hopHomonyms.length && !activeHopOption?.includes('Mes articles'); index++) {
      await page.keyboard.press('ArrowDown');
      activeHopOption = await readActiveHopOption();
    }
    assert.match(activeHopOption ?? '', /Cascade · Mes articles ·/u, `Keyboard focus identifies the stock homonym: ${activeHopOption}`);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.recipe-wizard #wz-hop-0', { visible: true });
    await page.locator('.recipe-wizard #wz-hop-0').fill('40');
    assert.equal(await page.$eval('.recipe-wizard li.panel span.font-semibold', element => element.textContent.trim()), 'Cascade');

    await clickExactLabel('.recipe-wizard .hop-stage-tabs button', 'À cru', 'Choisir la phase à cru');
    await openPicker();
    await page.waitForFunction(() => [...document.querySelectorAll('li[role="option"]')].filter(option => option.querySelector('span span')?.textContent?.trim() === 'Cascade').length === 2);
    const catalogueOptions = await page.$$('li[role="option"]');
    const publicCascade = [];
    for (const option of catalogueOptions) if (await option.evaluate(e => e.querySelector('span span')?.textContent?.trim() === 'Cascade' && !e.getAttribute('aria-label')?.includes('Mes articles'))) publicCascade.push(option);
    assert.equal(publicCascade.length, 1, `One explicit Cascade catalogue reference despite a stock homonym at ${width}px`);
    await publicCascade[0].click();
    await page.waitForSelector('.recipe-wizard #wz-hop-1', { visible: true });
    await page.locator('.recipe-wizard #wz-hop-1').fill('40');
    await page.waitForFunction(() => document.querySelectorAll('.recipe-wizard li.panel').length === 2);
    const hopVisuals = await page.$eval('.recipe-wizard .recipe-hop-tools', element => !!element);
    assert(hopVisuals, 'The local hop comparison and simulation panel is mounted');
    await clickTextContains('.recipe-wizard .recipe-hop-tools summary', 'Comparer et simuler les houblons');
    await page.waitForSelector('.recipe-wizard .recipe-hop-tools[open] [role="tablist"][aria-label="Outils de houblonnage"]', { visible: true });
    await clickExactLabel('.recipe-wizard .recipe-hop-tools [role="tab"]', 'Simuler', 'Ouvrir la simulation des houblons');
    await page.waitForSelector('.recipe-wizard .recipe-hop-tools fieldset[aria-label="Simulation de houblonnage"]', { visible: true });
    await clickTextContains('.recipe-wizard details > summary', 'Recherche avancée · arômes, essais et analyses', 'Ouvrir l’atelier aromatique');
    await page.waitForFunction(() => !document.body.innerText.includes('Chargement de l’atelier aromatique…'), { timeout: 12000 });
    await page.waitForSelector('.recipe-wizard [aria-label="Étapes de l’atelier aromatique"] button[aria-current="page"]', { visible: true });
    assert.equal(await page.$eval('.recipe-wizard [aria-label="Étapes de l’atelier aromatique"] button[aria-current="page"]', element => element.textContent.trim()), 'Simuler mes ajouts', 'The hop workshop opens on its explicit local simulation view');
    await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard details > summary')].some(summary => summary.getClientRects().length && summary.textContent.replace(/\s+/g, ' ').includes('Lots, COA et conditions de contact')), { timeout: 12000 });
    const lotSummaries = await page.$$('.recipe-wizard summary');
    const lotSummary = [];
    for (const summary of lotSummaries) if (await summary.evaluate(e => e.getClientRects().length && e.textContent.replace(/\s+/g, ' ').includes('Lots, COA et conditions de contact'))) lotSummary.push(summary);
    assert.equal(lotSummary.length, 1, 'The hop batch/COA editor stays reachable');
    await lotSummary[0].click();
    await page.waitForSelector('.recipe-wizard [aria-label="Étapes de l’atelier aromatique"] button[aria-current="page"]', { visible: true });
    await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard label')].some(label =>
      label.textContent.replace(/\s+/g, ' ').trim() === 'Référence documentaire de l’ajout 2' && label.getClientRects().length));
    const sourceReview = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.recipe-wizard label')].filter(label => label.textContent.replace(/\s+/g, ' ').trim() === 'Référence documentaire de l’ajout 2');
      return {
        count: labels.length,
        fields: labels.map(label => {
          const select = document.getElementById(label.htmlFor);
          return {
            id: select?.id,
            visible: !!select?.getClientRects().length && getComputedStyle(select).visibility !== 'hidden',
            value: select?.value,
            selectedLabel: select?.selectedOptions[0]?.textContent?.replace(/\s+/g, ' ').trim(),
          };
        }),
      };
    });
    assert.equal(sourceReview.count, 1, 'The second hop addition has one documentary-reference review control');
    assert(sourceReview.fields[0].visible, 'The selected hop source is visibly reviewable from the lot/COA editor');
    assert.equal(sourceReview.fields[0].value, 'hopsteiner-cas', 'The dry-hop row keeps its exact public Cascade reference');
    assert.equal(sourceReview.fields[0].selectedLabel, 'Cascade · Hopsteiner', 'The source author is exposed in the selected Cascade reference label');
    await capture(`journey-${width}-houblons-source-reference`, `[id="${sourceReview.fields[0].id}"]`);
    const phaseControls = await page.$$('.recipe-wizard select'), matchingPhaseControls = [];
    for (const control of phaseControls) if (await control.evaluate(element => element.getClientRects().length && element.closest('label')?.innerText.replace(/\s+/g, ' ').includes('Phase de Cascade'))) matchingPhaseControls.push(control);
    assert.equal(matchingPhaseControls.length, 1, 'The dry-hop phase belongs to the visible Cascade row');
    await matchingPhaseControls[0].select('postFermentation');
    await page.locator('.recipe-wizard #wz-hop-contact-1').fill('48');
    await page.locator('.recipe-wizard [aria-label="Température à cru de Cascade"]').fill('18');
    assert.equal(await matchingPhaseControls[0].evaluate(element => element.value), 'postFermentation');
    assert.equal(await page.$eval('.recipe-wizard #wz-hop-contact-1', element => element.value), '48');
    assert.equal(await page.$eval('.recipe-wizard [aria-label="Température à cru de Cascade"]', element => element.value), '18');
    const dryHopAlpha = '.recipe-wizard #wz-hop-alpha-1';
    await page.locator(dryHopAlpha).fill('');
    await page.keyboard.press('Tab');
    await page.waitForFunction(selector => document.querySelector(selector)?.value === '', {}, dryHopAlpha);
    assert.notEqual(await page.$eval(dryHopAlpha, element => element.getAttribute('aria-invalid')), 'true', 'Missing dry-hop alpha remains optional');
    const hotIbuText = await page.$eval('.recipe-wizard .hop-recipe-snapshot .hop-ibu-range strong', element => element.textContent.trim());
    const hotIbuStatus = await page.$eval('.recipe-wizard .hop-recipe-snapshot', element => element.innerText);
    assert.match(hotIbuText, /^\d+(?:,\d+)?$/u, `Boil IBU remains numeric with missing dry-hop alpha: ${hotIbuText}`);
    assert.doesNotMatch(hotIbuStatus, /IBU incomplets/u, 'Dry-hop alpha does not make the hot IBU result incomplete');
    await capture(`journey-${width}-houblons`, '.recipe-wizard #recipe-hop-additions');

    await measureInputSeries('Levure', '.recipe-wizard [aria-label="Rechercher une levure"]', ['SafAle','US-05','Diamond','Verdant','WLP095','SafAle US-05','Lallemand','Verdant IPA'], 'Recherche de levure');
    const yeastHeadingBefore = await page.$eval('.recipe-wizard .yc-current h3', element => element.textContent.trim());
    assert.equal(yeastHeadingBefore, 'Choisir une levure', 'Typing searches the yeast catalogue without automatically changing the recipe');
    const yeastStyle = '.recipe-wizard .yc-catalogue [aria-label="Filtrer les levures par style"]';
    await page.waitForSelector(yeastStyle, { visible: true });
    await selectNativeOptionByKeyboard(yeastStyle, 'lager', 'Lager family filter');
    await page.locator('.recipe-wizard .yeast-picker-search').fill('Diamond Lager');
    await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard .yc-list li')].some(row => row.querySelector('.yc-identity strong')?.textContent.trim() === 'Diamond Lager'), { timeout: 10000 });
    assert.equal(await page.$eval('.recipe-wizard .yc-current h3', element => element.textContent.trim()), 'Choisir une levure', 'Changing the Lager family and search query does not select a product');
    const diamondChoice = '.recipe-wizard .yc-list button[aria-label="Choisir Diamond Lager dans la recette"]';
    await page.waitForSelector(diamondChoice, { visible: true });
    await clickUnique(diamondChoice, 'Choisir explicitement Diamond Lager pour l’essai Lager');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard .yc-current h3')?.textContent.trim() === 'Diamond Lager');
    const lagerGoal = '.recipe-wizard .yc-plan .yc-goal-row select';
    await page.waitForSelector(lagerGoal, { visible: true });
    const goalOptions = await page.$$eval(`${lagerGoal} option`, options => options.map(option => ({ value: option.value, label: option.textContent.trim() })));
    assert(goalOptions.some(option => option.value === 'low-sulfur' && option.label === 'Soufre en retrait'), 'The Lager yeast plan exposes its explicit low-sulfur profile');
    await selectNativeOptionByKeyboard(lagerGoal, 'low-sulfur', 'Lager low-sulfur goal');
    assert(await page.$eval('.recipe-wizard .yc-plan .yc-proposal', element => element.hidden), 'Selecting a profile by keyboard does not propose or apply a fermentation plan by itself');
    await clickExactLabel('.recipe-wizard .yc-plan .yc-goal-row button', 'Proposer une conduite', 'Proposer explicitement un essai de conduite Lager');
    await page.waitForFunction(() => { const proposal = document.querySelector('.recipe-wizard .yc-plan .yc-proposal'); return proposal && !proposal.hidden; });
    assert.match(await page.$eval('.recipe-wizard .yc-plan .yc-proposal', element => element.innerText), /Non appliqué/u, 'The explicit Lager proposal is labelled as an unapplied trial');
    await capture(`journey-${width}-lager-essai`, '.recipe-wizard .yc-plan .yc-proposal');

    await clickExactLabel('.recipe-wizard .yc-current .yc-actions button', 'Changer / comparer', 'Revenir aux références après l’essai Lager');
    await page.waitForSelector(yeastStyle, { visible: true });
    await page.select(yeastStyle, 'clean-ale');
    assert.equal(await page.$eval(yeastStyle, element => element.value), 'clean-ale', 'Restore the recipe-aligned American Ale family before searching the Wyeast reference');
    const yeastSearch = '.recipe-wizard [aria-label="Rechercher une levure"]';
    const yeastReadOnly = await page.$eval(yeastSearch, element => element.readOnly);
    if (yeastReadOnly) { const field = page.locator(yeastSearch); await field.click(); await field.click(); }
    await page.locator(yeastSearch).fill('Wyeast 1056');
    const exactYeastChoice = '.recipe-wizard button[aria-label="Choisir 1056 American Ale® dans la recette"]';
    await page.waitForFunction(() => document.querySelector('button[aria-label="Choisir 1056 American Ale® dans la recette"]') || [...document.querySelectorAll('.yeast-picker button')].some(button => button.textContent.trim() === 'Chercher dans tout le catalogue'), { timeout: 7000 });
    if (!(await page.$(exactYeastChoice))) {
      const catalogueSearch = await page.$$('.yeast-picker button');
      const expandSearch = [];
      for (const button of catalogueSearch) if (await button.evaluate(element => element.getClientRects().length && element.textContent.trim() === 'Chercher dans tout le catalogue')) expandSearch.push(button);
      assert.equal(expandSearch.length, 1, 'A single explicit whole-catalogue action is offered for Wyeast 1056');
      await expandSearch[0].click();
    }
    await page.waitForSelector(exactYeastChoice, { visible: true });
    assert.equal(await page.$eval('.recipe-wizard .yc-current h3', element => element.textContent.trim()), 'Diamond Lager', 'Searching the whole catalogue does not replace the existing yeast without an explicit choice');
    assert.equal(await page.$eval('.recipe-wizard .yc-list li strong', element => element.textContent.trim()), '1056 American Ale®', 'The searched catalogue result is the exact printed Wyeast product');
    const candidateEvidence = await page.$eval(exactYeastChoice, element => element.closest('li')?.innerText ?? element.innerText);
    assert.match(candidateEvidence, /16\s*–\s*22\s*°C/u, 'The Wyeast 1056 candidate shows its manufacturer temperature before selection');
    assert.match(candidateEvidence, /73\s*–\s*77\s*%/u, 'The Wyeast 1056 candidate shows its manufacturer attenuation before selection');
    await capture(`journey-${width}-levure-1056-candidate`, '.recipe-wizard .yc-list li');
    await clickUnique(exactYeastChoice, 'Choisir Wyeast 1056');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard .yc-current h3')?.textContent.trim() === '1056 American Ale®');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard .yc-evidence-values')?.textContent.includes('16–22') && document.querySelector('.recipe-wizard .yc-evidence-values')?.textContent.includes('73–77'));
    const yeastEvidence = await page.$eval('.recipe-wizard .yc-evidence-values', element => element.innerText);
    assert.match(yeastEvidence, /16\s*–\s*22\s*°C/u, 'Selected Wyeast 1056 temperature evidence is visible');
    assert.match(yeastEvidence, /73\s*–\s*77\s*%/u, 'Selected Wyeast 1056 attenuation evidence is visible');
    await capture(`journey-${width}-levure-1056`, '.recipe-wizard .yc-current');
    await clickExactLabel('.recipe-wizard .yc-dossier > summary', 'Fiche, sources et données de la souche', 'Ouvrir le dossier Wyeast 1056');
    await page.waitForSelector('.recipe-wizard .yeast-strain-details[data-yeast-information="wyeast-1056"]', { visible: true });
    await clickExactLabel('.recipe-wizard .yeast-strain-details > summary', 'Fiche de la souche · repères pratiques', 'Ouvrir la fiche pratique Wyeast 1056');
    const manufacturerFacts = await page.$eval('.recipe-wizard .yeast-strain-details[data-yeast-information="wyeast-1056"]', element => element.innerText);
    assert.match(manufacturerFacts, /1056 American Ale®/u, 'The strain dossier matches the selected product');
    assert.match(manufacturerFacts, /73\s*–\s*77\s*%/u, 'The dossier exposes Wyeast 1056 manufacturer attenuation');
    assert.match(manufacturerFacts, /16\s*–\s*22\s*°C/u, 'The dossier exposes Wyeast 1056 manufacturer temperature');
    await clickExactLabel('.recipe-wizard .yeast-strain-details details > summary', 'Conditions et sources des repères', 'Ouvrir les sources du dossier');
    await capture(`journey-${width}-levure-1056-dossier`, '.recipe-wizard .yeast-strain-details');
    const pitchDetails = '.recipe-wizard details.yc-pitch';
    if (!(await page.$eval(pitchDetails, element => element.open))) await clickUnique(`${pitchDetails} > summary`, 'Ouvrir la dose de levure');
    await page.waitForSelector('.recipe-wizard #wz-yeast-qty', { visible: true });
    await page.locator('.recipe-wizard #wz-yeast-qty').fill('100');
    const yeastUnit = '.recipe-wizard #wz-yeast-unit';
    const unitOptions = await page.$$eval(`${yeastUnit} option`, nodes => nodes.map(option => option.value || option.textContent.trim()));
    assert(unitOptions.includes('mL'), 'A millilitre yeast-dose unit is available for the liquid reference');
    await page.select(yeastUnit, 'mL');
    await clickExactLabel('.recipe-wizard .yc-plan button', 'Régler / simuler', 'Ouvrir la simulation de fermentation');
    await page.waitForSelector('.recipe-wizard .yc-proposal[aria-label="Scénario de levure"]', { visible: true });
    const adjustmentsSummary = '.recipe-wizard .yc-adjustments > summary';
    const adjustmentsOpen = await page.$eval('.recipe-wizard .yc-adjustments', element => element.open);
    if (!adjustmentsOpen) await clickTextContains(adjustmentsSummary, 'Hypothèses et réglages complémentaires');
    await page.waitForSelector('.recipe-wizard [aria-label="Atténuation retenue pour le scénario"]', { visible: true });
    await page.locator('.recipe-wizard [aria-label="Atténuation retenue pour le scénario"]').fill('78');
    await page.locator('.recipe-wizard [aria-label="Température principale du scénario"]').fill('20');
    await page.waitForFunction(() => {
      const figures = [...document.querySelectorAll('.recipe-wizard .yc-preview-pair figure.yeast-range-comparison')];
      return figures.length === 2 && figures.some(figure => figure.getAttribute('aria-label') === 'Densité finale') &&
        figures.some(figure => figure.getAttribute('aria-label') === 'Alcool estimé') &&
        figures.every(figure => figure.querySelectorAll('.yeast-range-track').length === 2 &&
          [...figure.querySelectorAll('output')].length === 2 && [...figure.querySelectorAll('output')].every(output => !output.textContent.includes('À renseigner')));
    });
    const yeastPreview = await page.$eval('.recipe-wizard .yc-preview-pair', element => element.innerText);
    assert.match(yeastPreview, /Densité finale/u);
    assert.match(yeastPreview, /Alcool estimé/u);
    assert(!/À préciser/u.test(yeastPreview), 'A complete malt bill makes the yeast scenario projection numerical');
    routes.push({ step: 'Levure', evidence: yeastEvidence, manufacturerFacts: manufacturerFacts.slice(0, 1200), preview: yeastPreview });
    await capture(`journey-${width}-levure-simulation`, '.recipe-wizard .yc-proposal');

    if (captureOnly) {
      const widthErrors = errors.slice(errorStart), widthResponses = responses.slice(responseStart), widthRemote = remote.slice(remoteStart), widthBlocked = blocked.slice(blockedStart);
      assert.deepEqual(widthRemote, [], `No remote request was attempted at ${width}px: ${JSON.stringify(widthRemote)}`);
      assert.deepEqual(widthBlocked, [], `No blocked remote request occurred at ${width}px: ${JSON.stringify(widthBlocked)}`);
      assert.deepEqual(widthResponses, [], `The local QA server returned no failing responses at ${width}px`);
      assert.deepEqual(widthErrors, [], `The browser emitted no console or runtime errors at ${width}px: ${JSON.stringify(widthErrors)}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal viewport overflow at ${width}px`);
      errorsByWidth.push({ width, errors: widthErrors, failedResponses: widthResponses, remoteRequests: widthRemote, blockedRequests: widthBlocked });
      reports.push({ width, height, viewport: mobile ? 'mobile/touch' : 'desktop/pointer', railCount,
        states: { yeastEvidence, manufacturerFacts, preview: yeastPreview, dryHop: { phase: 'postFermentation', contactHours: 48, temperatureC: 18 } },
        browser: errorsByWidth.at(-1) });
      console.log(JSON.stringify({ width, captureOnly, errors: widthErrors, remote: widthRemote, captures: `journey-${width}-*.png` }, null, 2));
      continue;
    }

    let latency = null;
    if (runPerformance) {
      const navFirst = await page.evaluate(() => window.__recipeJourneyMetrics.navigation.length);
      for (let index = 0; index < 12; index++) {
        const step = index % 2 ? 'Levure' : 'Houblons';
        await clickUnique(`.recipe-wizard nav[aria-label="Étapes"] button[aria-label="${step}"]`, `Navigation locale vers ${step}`);
        await page.waitForFunction(expected => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === expected, {}, step);
        await page.waitForFunction(count => window.__recipeJourneyMetrics.navigation.length > count, {}, navFirst + index);
      }
      const navigationEnd = await page.evaluate(() => window.__recipeJourneyMetrics.navigation.length);
      const warmSamples = await page.evaluate((start, end) => window.__recipeJourneyMetrics.navigation.slice(start, end), navFirst, navigationEnd);
      const warmNavigation = warmSamples.map((durationMs, index) => ({
        phase: 'warmed',
        iteration: index + 1,
        step: index % 2 ? 'Levure' : 'Houblons',
        durationMs: Number(durationMs.toFixed(1)),
      }));
      const measuredNavigationEvents = [...navigationSetup, ...warmNavigation];
      const measuredNavigation = measuredNavigationEvents.map(event => event.durationMs);
      assert.equal(navigationSetup.length, 3, 'Three setup transitions match the baseline input-series protocol');
      assert.equal(warmNavigation.length, 12, 'Twelve warmed transitions match the baseline repeated-navigation protocol');
      assert.equal(measuredNavigation.length, 15, 'Navigation p95 aggregates the same 15 transitions as the baseline');
      const measuredInputs = inputGroups.flatMap(group => group.valuesMs);
      const summarize = values => {
        const sorted = [...values].sort((a, b) => a - b), percentile = p => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)].toFixed(1)) : null;
        return { count: sorted.length, p50: percentile(.5), p95: percentile(.95), max: percentile(1) };
      };
      latency = {
        unit: 'ms',
        inputEventToFrameAfterPaint: summarize(measuredInputs),
        stepNavigationToFrameAfterPaint: summarize(measuredNavigation),
        stepNavigationPhases: {
          setup: summarize(navigationSetup.map(event => event.durationMs)),
          warmed: summarize(warmNavigation.map(event => event.durationMs)),
        },
        navigationEvents: { setup: navigationSetup, warmed: warmNavigation },
        slowestNavigationEvent: measuredNavigationEvents.reduce((slowest, event) => !slowest || event.durationMs > slowest.durationMs ? event : slowest, null),
      };
      if (latency.inputEventToFrameAfterPaint.p95 >= 200) {
        performanceFailures.push({ width, metric: 'input p95', p95Ms: latency.inputEventToFrameAfterPaint.p95, count: latency.inputEventToFrameAfterPaint.count, limitMs: 200 });
      }
      if (latency.stepNavigationToFrameAfterPaint.p95 >= 200) {
        performanceFailures.push({
          width, metric: 'step navigation p95', p95Ms: latency.stepNavigationToFrameAfterPaint.p95,
          count: latency.stepNavigationToFrameAfterPaint.count, limitMs: 200,
          slowestEvent: latency.slowestNavigationEvent,
          phases: latency.stepNavigationPhases,
        });
      }
    }
    const perfGroups = inputGroups.map(({ label, samples, p95Ms }) => ({ label, samples, p95Ms }));
    const widthPerformanceFailures = performanceFailures.filter(failure => failure.width === width);
    const performanceGate = !runPerformance ? 'SKIPPED' : widthPerformanceFailures.length ? 'FAIL' : 'PASS';
    if (runPerformance) {
      await writeFile(resolve(out, `journey-${width}-performance.json`), JSON.stringify({
        width, height, generatedAt: new Date().toISOString(), performanceGate,
        limitMs: 200,
        method: 'Trusted Puppeteer input/click event timestamp through two requestAnimationFrame callbacks; setup n=3 and warmed n=12, aggregate n=15.',
        latency,
        inputGroups,
        failures: widthPerformanceFailures,
      }, null, 2));
    }

    for (const step of journeyStepNames) {
      await clickUnique(`.recipe-wizard nav[aria-label="Étapes"] button[aria-label="${step}"]`, `Visiter l’étape ${step}`);
      await page.waitForFunction(expected => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === expected, {}, step);
      const visibleStep = await page.$eval('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]', element => element.getAttribute('aria-label'));
      routes.push({ step: visibleStep });
      if (step === 'Identité') await capture(`journey-${width}-identite`, '.recipe-wizard #wz-title');
      if (step === 'Eau et sels') {
        const waterText = await page.evaluate(() => {
          const wizard = document.querySelector('.recipe-wizard');
          return [wizard?.innerText ?? '', ...[...(wizard?.querySelectorAll('input') ?? [])].map(input => input.value)].join('\n');
        });
        assert.doesNotMatch(waterText, /4[,.]199999999/u, 'Water volumes do not expose binary addition residue for 4.2 L');
        await capture(`journey-${width}-eau`, '.recipe-wizard');
      }
      if (step === 'Récapitulatif') {
        const status = await page.$eval('.recipe-wizard [aria-label="État de la recette"]', element => element.innerText);
        assert.match(status, /prête|prêts|enregistrement possible/i, `Complete recipe has a ready/savable status at ${width}px: ${status}`);
        const beforeSave = await page.evaluate(name => window.__hopQa.storage.getRecipes().filter(recipe => recipe.name === name).length, recipeName);
        assert.equal(beforeSave, 0, 'A new recipe is absent from persisted QA storage before saving');
        await capture(`journey-${width}-recap`, '.recipe-wizard [aria-label="État de la recette"]');
      }
    }
    await clickExactLabel('.recipe-wizard footer button', 'Enregistrer la recette', 'Enregistrer la nouvelle recette');
    await page.waitForSelector(`button[aria-label="Ouvrir la recette ${recipeName}"]`, { visible: true, timeout: 12000 });
    const saved = await page.evaluate(name => {
      const rows = window.__hopQa.storage.getRecipes().filter(recipe => recipe.name === name);
      return { rows, qaMetrics: { ...window.__hopQa.metrics } };
    }, recipeName);
    assert.equal(saved.rows.length, 1, 'The recipe is written once through the QA storage adapter');
    const savedRecipe = saved.rows[0];
    assert(savedRecipe.id, 'Saved recipe has a stable ID');
    assert.equal(savedRecipe.fermentables?.length, 1);
    assert.equal(savedRecipe.fermentables[0].weightKg, 5);
    assert.equal(savedRecipe.hops?.length, 2);
    assert.deepEqual(savedRecipe.hops.map(hop => hop.stage), ['boil', 'dryHop']);
    assert.equal(savedRecipe.hops[0].stockItemRef, 'qa-cascade-stock', 'The chosen hot-side Cascade is the synthetic stock item');
    assert.equal(savedRecipe.hops[1].hopVarietyId, 'hopsteiner-cas', 'The dry-hop Cascade remains linked to the exact public variety reference');
    assert.equal(savedRecipe.yeast.hopIndexId, 'wyeast-1056', 'The chosen yeast remains linked to the exact Wyeast 1056 reference');
    assert.equal(savedRecipe.yeast.qty, 100);
    assert.equal(savedRecipe.yeast.unit, 'mL');
    routes.push({ step: 'Enregistrée', recipe: savedRecipe });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`button[aria-label="Ouvrir la recette ${recipeName}"]`, { visible: true, timeout: 12000 });
    await clickUnique(`button[aria-label="Ouvrir la recette ${recipeName}"]`, 'Réouvrir la recette enregistrée');
    await page.waitForSelector('button[aria-label="Modifier la recette"]', { visible: true });
    await capture(`journey-${width}-reopened`, 'button[aria-label="Modifier la recette"]');
    await clickUnique('button[aria-label="Modifier la recette"]', 'Modifier la recette réouverte');
    await page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
    assert.equal(await page.$eval('.recipe-wizard #wz-title', element => element.value), recipeName, 'Reopened editor restores the saved name');
    const changedName = `${recipeName} modifiée`;
    await page.locator('.recipe-wizard #wz-title').fill(changedName);
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]', 'Revenir au récapitulatif avant la modification');
    await page.waitForSelector('.recipe-wizard [aria-label="État de la recette"]', { visible: true });
    await clickExactLabel('.recipe-wizard footer button', 'Enregistrer la recette', 'Enregistrer la modification');
    await page.waitForSelector(`button[aria-label="Ouvrir la recette ${changedName}"]`, { visible: true, timeout: 12000 });
    const updated = await page.evaluate((name, oldId) => ({
      rows: window.__hopQa.storage.getRecipes().filter(recipe => recipe.name === name),
      oldRows: window.__hopQa.storage.getRecipes().filter(recipe => recipe.id === oldId),
    }), changedName, savedRecipe.id);
    assert.equal(updated.rows.length, 1, 'Edited recipe is visible after saving');
    assert.equal(updated.rows[0].id, savedRecipe.id, 'Editing updates the same recipe record');
    assert.equal(updated.rows[0].hops.length, 2, 'Hop rows survive the reopen/edit/save loop');
    assert.equal(updated.rows[0].yeast.hopIndexId, 'wyeast-1056', 'Yeast identity survives the reopen/edit/save loop');
    assert.equal(updated.oldRows.length, 1);
    await capture(`journey-${width}-modified`, `button[aria-label="Ouvrir la recette ${changedName}"]`);

    await clickUnique('.floating-actions button[aria-label="Actions rapides"]', 'Ouvrir les actions rapides pour une recette incomplète');
    await clickExactLabel('[role="menuitem"]', 'Créer une recette', 'Choisir Créer une recette pour le test incomplet');
    await page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
    const incompleteName = `QA incomplète ${width}`;
    await page.locator('.recipe-wizard #wz-title').fill(incompleteName);
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Houblons"]', 'Ouvrir Houblons pour le test incomplet');
    const partialPicker = '.recipe-wizard [aria-label^="Ajouter un houblon"]';
    const partialReadOnly = await page.$eval(partialPicker, element => element.readOnly);
    if (partialReadOnly) { const field = page.locator(partialPicker); await field.click(); await field.click(); }
    await page.locator(partialPicker).fill('Ariana');
    await page.waitForFunction(() => [...document.querySelectorAll('li[role="option"]')].some(option => option.querySelector('span span')?.textContent?.trim() === 'Ariana'));
    const partialArianaOptions = await matchingOptions('Ariana'), partialArianaPublic = [];
    for (const option of partialArianaOptions) if (!(await option.evaluate(element => element.getAttribute('aria-label')?.includes('Mes articles')))) partialArianaPublic.push(option);
    assert.equal(partialArianaPublic.length, 1, 'Incomplete recipe selects the exact public Ariana reference for its local AI-retry fixture');
    await partialArianaPublic[0].click();
    await page.waitForSelector('.recipe-wizard #wz-hop-0', { visible: true });
    assert.equal(await page.$eval('.recipe-wizard #wz-hop-0', element => element.value), '0', 'New hop dose begins at zero rather than a plausible invented value');
    const partialHopAlpha = '.recipe-wizard #wz-hop-alpha-0';
    await page.locator(partialHopAlpha).fill('');
    await page.keyboard.press('Tab');
    await page.waitForFunction(selector => document.querySelector(selector)?.value === '', {}, partialHopAlpha);
    const aiCallsBefore = await page.evaluate(() => window.__hopQa.calls.filter(name => name === 'aiTask').length);
    await clickExactLabel('.recipe-wizard [aria-label="Autocomplétion des ingrédients"] button', 'Compléter les données manquantes avec l’IA', 'Lancer la complétion locale pour la fiche incomplète');
    const localAiErrorSelector = '.recipe-wizard [aria-label="Autocomplétion des ingrédients"] [role="alert"]';
    await page.waitForSelector(localAiErrorSelector, { visible: true, timeout: 12000 });
    const localAiError = await page.$eval(localAiErrorSelector, element => element.innerText);
    assert.match(localAiError, /Appel distant exclu du banc QA.*aiTask/u, `The QA adapter shows its local refusal as a recoverable error: ${localAiError}`);
    assert.equal(await page.$$eval('.recipe-wizard [aria-label="Autocomplétion des ingrédients"] button', buttons => buttons.filter(button => button.innerText.trim() === 'Reprendre ces valeurs').length), 0, 'A failed lookup offers no values to apply');
    if (width === 375) await capture(`journey-${width}-ia-erreur-reprise`, '.recipe-wizard [aria-label="Autocomplétion des ingrédients"]');
    await page.evaluate(() => window.__hopQa.nolo.mockHop());
    await clickExactLabel('.recipe-wizard [aria-label="Autocomplétion des ingrédients"] button', 'Compléter les données manquantes avec l’IA', 'Relancer explicitement la complétion locale');
    await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard [aria-label="Autocomplétion des ingrédients"] button')].some(button => button.getClientRects().length && button.innerText.trim() === 'Reprendre ces valeurs'), { timeout: 12000 });
    const localAiProposal = await page.$eval('.recipe-wizard [aria-label="Autocomplétion des ingrédients"]', element => element.innerText);
    assert.match(localAiProposal, /12 % AA/u);
    assert.match(localAiProposal, /Fixture QA synthétique/u);
    assert.equal(await page.$eval(partialHopAlpha, element => element.value), '', 'Retry results are reviewed before changing the recipe');
    await clickExactLabel('.recipe-wizard [aria-label="Autocomplétion des ingrédients"] button', 'Reprendre ces valeurs', 'Appliquer explicitement la fiche synthétique après reprise');
    await page.waitForFunction(selector => document.querySelector(selector)?.value === '12', {}, partialHopAlpha);
    const aiCallsAfter = await page.evaluate(() => window.__hopQa.calls.filter(name => name === 'aiTask').length);
    assert.equal(aiCallsAfter - aiCallsBefore, 2, 'The local lookup ran once for failure and once for fixture-backed retry');
    const aiRetryState = { initialError: localAiError, proposal: localAiProposal, appliedAlphaPct: await page.$eval(partialHopAlpha, element => element.value), calls: aiCallsAfter - aiCallsBefore };
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Levure"]', 'Ouvrir Levure pour le test incomplet');
    const partialYeastSearch = '.recipe-wizard [aria-label="Rechercher une levure"]';
    await page.waitForSelector(partialYeastSearch, { visible: true, timeout: 12000 });
    const partialYeastReadOnly = await page.$eval(partialYeastSearch, element => element.readOnly);
    if (partialYeastReadOnly) { const field = page.locator(partialYeastSearch); await field.click(); await field.click(); }
    await page.locator(partialYeastSearch).fill('Wyeast 1056');
    const partialYeastChoice = '.recipe-wizard button[aria-label="Choisir 1056 American Ale® dans la recette"]';
    await page.waitForFunction(() => document.querySelector('button[aria-label="Choisir 1056 American Ale® dans la recette"]') || [...document.querySelectorAll('.yeast-picker button')].some(button => button.textContent.trim() === 'Chercher dans tout le catalogue'), { timeout: 7000 });
    if (!(await page.$(partialYeastChoice))) {
      const catalogueSearch = await page.$$('.yeast-picker button');
      const expandSearch = [];
      for (const button of catalogueSearch) if (await button.evaluate(element => element.getClientRects().length && element.textContent.trim() === 'Chercher dans tout le catalogue')) expandSearch.push(button);
      assert.equal(expandSearch.length, 1, 'A single explicit whole-catalogue action is offered for the incomplete Wyeast choice');
      await expandSearch[0].click();
    }
    await page.waitForSelector(partialYeastChoice, { visible: true });
    await clickUnique(partialYeastChoice, 'Choisir Wyeast 1056 pour la recette incomplète');
    await page.waitForFunction(() => document.querySelector('.recipe-wizard .yc-current h3')?.textContent.trim() === '1056 American Ale®');
    const partialPitchDetails = '.recipe-wizard details.yc-pitch';
    if (!(await page.$eval(partialPitchDetails, element => element.open))) await clickUnique(`${partialPitchDetails} > summary`, 'Ouvrir la dose de levure');
    await page.waitForSelector('.recipe-wizard #wz-yeast-qty', { visible: true });
    await page.locator('.recipe-wizard #wz-yeast-qty').fill('0');
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]', 'Ouvrir le récapitulatif incomplet');
    await page.waitForSelector('.recipe-wizard [aria-label="État de la recette"]', { visible: true });
    const incompleteStatus = await page.$eval('.recipe-wizard [aria-label="État de la recette"]', element => element.innerText);
    assert.match(incompleteStatus, /À compléter/u, `The partial recipe is marked incomplete: ${incompleteStatus}`);
    assert.match(incompleteStatus, /enregistrement possible|sauvegarde possible/i, `The partial recipe remains savable: ${incompleteStatus}`);
    await capture(`journey-${width}-incomplete-status`, '.recipe-wizard [aria-label="État de la recette"]');
    await clickExactLabel('.recipe-wizard footer button', 'Enregistrer et préparer un brassin', 'Tenter de préparer un brassin à partir de la recette incomplète');
    await page.waitForSelector('.recipe-wizard #wz-validation[role="alert"]', { visible: true });
    const rejectedBrew = await page.evaluate(name => ({
      stored: window.__hopQa.storage.getRecipes().filter(recipe => recipe.name === name).length,
      errors: document.querySelector('.recipe-wizard #wz-validation')?.innerText,
      currentStep: document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label'),
    }), incompleteName);
    assert.equal(rejectedBrew.stored, 0, 'Starting a brew from an incomplete recipe does not persist it');
    assert.match(rejectedBrew.errors, /à compléter|ajoute|choisis|quantité/iu, 'The brew gate names missing recipe values');
    await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Récapitulatif"]', 'Revenir au récapitulatif après le blocage du brassin');
    await page.waitForSelector('.recipe-wizard [aria-label="État de la recette"]', { visible: true });
    await capture(`journey-${width}-incomplete-brew-blocked`, '.recipe-wizard [aria-label="État de la recette"]');
    await clickExactLabel('.recipe-wizard footer button', 'Enregistrer la recette', 'Enregistrer la recette incomplète sans lancer de brassin');
    await page.waitForSelector(`button[aria-label="Ouvrir la recette ${incompleteName}"]`, { visible: true, timeout: 12000 });
    const partialSaved = await page.evaluate(name => window.__hopQa.storage.getRecipes().filter(recipe => recipe.name === name), incompleteName);
    assert.equal(partialSaved.length, 1, 'The same incomplete recipe can be saved through the normal save action');
    assert.equal(partialSaved[0].hops.length, 1);
    assert.equal(partialSaved[0].hops[0].name, 'Ariana');
    assert.equal(partialSaved[0].hops[0].alpha, 12);
    assert.equal(partialSaved[0].hops[0].weightG, 0);
    assert.equal(partialSaved[0].yeast.hopIndexId, 'wyeast-1056');
    assert.equal(partialSaved[0].yeast.qty, 0);
    await capture(`journey-${width}-incomplete-saved`, `button[aria-label="Ouvrir la recette ${incompleteName}"]`);

    const widthErrors = errors.slice(errorStart), widthResponses = responses.slice(responseStart), widthRemote = remote.slice(remoteStart), widthBlocked = blocked.slice(blockedStart);
    assert.deepEqual(widthRemote, [], `No remote request was attempted at ${width}px: ${JSON.stringify(widthRemote)}`);
    assert.deepEqual(widthBlocked, [], `No blocked remote request occurred at ${width}px: ${JSON.stringify(widthBlocked)}`);
    assert.deepEqual(widthResponses, [], `The local QA server returned no failing responses at ${width}px`);
    assert.deepEqual(widthErrors, [], `The browser emitted no console or runtime errors at ${width}px: ${JSON.stringify(widthErrors)}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal viewport overflow at ${width}px`);
    errorsByWidth.push({ width, errors: widthErrors, failedResponses: widthResponses, remoteRequests: widthRemote, blockedRequests: widthBlocked });
    reports.push({
      width, height, viewport: mobile ? 'mobile/touch' : 'desktop/pointer', railCount,
      latency, inputGroups: perfGroups, performanceGate,
      syntheticSeed: ['qa-cascade-stock', 'qa-pale-malt'],
      states: { saved: savedRecipe, modified: updated.rows[0], incompleteStatus, blockedBrew: rejectedBrew, incompleteSaved: partialSaved[0], aiRetry: aiRetryState },
      routes, browser: errorsByWidth.at(-1),
    });
    console.log(JSON.stringify({ width, latency, inputGroups: perfGroups, performanceGate, performanceFailures: widthPerformanceFailures, errors: widthErrors, remote: widthRemote, captures: `journey-${width}-*.png` }, null, 2));
  }

  const performanceGate = !runPerformance ? { limitMs: 200, status: 'SKIPPED', failures: [] }
    : { limitMs: 200, status: performanceFailures.length ? 'FAIL' : 'PASS', failures: performanceFailures };
  await writeFile(resolve(out, 'journey-report.json'), JSON.stringify({
    mode, buildDir, out, generatedAt: new Date().toISOString(),
    performanceMeasured: runPerformance,
    performanceGate,
    measurement: runPerformance ? 'Same trusted Puppeteer input/click protocol as baseline: event timestamp through two requestAnimationFrame callbacks (frame after next paint). Eight input values per field; navigation p95 aggregates the same 3 setup and 12 warmed transitions as baseline, with setup/warmed distributions also recorded.' : 'Performance measurements skipped by RECIPE_QA_PERF=0; run smoke only.',
    qaBundleStats,
    productionBundle: 'Measured separately from this QA artifact; fixture/static-test weight is not production bundle weight.',
    execution: {
      command: 'node scripts/check-recipe-journey-ui.mjs',
      environment: {
        HOP_QA_BUILD_DIR: buildDir,
        HOP_QA_OUTPUT: out,
        HOP_QA_SKIP_BUILD: process.env.HOP_QA_SKIP_BUILD === '1' ? '1' : '0',
        RECIPE_QA_MODE: mode,
        RECIPE_QA_CAPTURE_ONLY: captureOnly ? '1' : '0',
        RECIPE_QA_PERF: runPerformance ? '1' : '0',
        RECIPE_QA_WIDTHS: widths.join(','),
      },
    },
    limits: [
      'Production UI against synthetic/local QA adapters only; no Firebase or external services.',
      'The 640 px CSS viewport at a 1280 px reference width checks 200%-equivalent reflow; browser zoom itself is unchanged.',
      'Bundle size is measured separately from this QA artifact; QA fixture and adapter weight is not production weight.',
    ],
    viewportWidths: reports.map(({ width, height }) => ({ width, height })), reports, errorsByWidth,
  }, null, 2));
  const reportRows = reports.map(report => {
    const latency = report.latency;
    const browser = report.browser;
    const status = browser.errors.length || browser.failedResponses.length || browser.remoteRequests.length || browser.blockedRequests.length ? 'Fail' : 'Pass';
    const phases = latency?.stepNavigationPhases;
    const setup = phases ? `${phases.setup.count} / ${phases.setup.p95}` : '—';
    const warmed = phases ? `${phases.warmed.count} / ${phases.warmed.p95}` : '—';
    const slowest = latency?.slowestNavigationEvent;
    const slowestLabel = slowest ? `${slowest.step} (${slowest.phase}, ${slowest.durationMs} ms)` : '—';
    return `| ${report.width} × ${report.height} | ${status} | ${report.performanceGate ?? 'SKIPPED'} | ${latency?.inputEventToFrameAfterPaint.count ?? 0} / ${latency?.inputEventToFrameAfterPaint.p95 ?? '—'} ms | ${latency?.stepNavigationToFrameAfterPaint.count ?? 0} / ${latency?.stepNavigationToFrameAfterPaint.p95 ?? '—'} ms | ${setup} | ${warmed} | ${slowestLabel} | ${browser.errors.length} | ${browser.failedResponses.length} | ${browser.remoteRequests.length} / ${browser.blockedRequests.length} |`;
  }).join('\n');
  const commandInfo = {
    command: 'node scripts/check-recipe-journey-ui.mjs',
    environment: {
      HOP_QA_BUILD_DIR: buildDir,
      HOP_QA_OUTPUT: out,
      HOP_QA_SKIP_BUILD: process.env.HOP_QA_SKIP_BUILD === '1' ? '1' : '0',
      RECIPE_QA_MODE: mode,
      RECIPE_QA_CAPTURE_ONLY: captureOnly ? '1' : '0',
      RECIPE_QA_PERF: runPerformance ? '1' : '0',
      RECIPE_QA_WIDTHS: widths.join(','),
    },
  };
  await writeFile(resolve(out, 'journey-report.md'), [
    '# QA du parcours Recettes',
    '',
    `- Résultat : smoke terminé ; porte performance ${performanceGate.status}${runPerformance ? ` (seuil p95 < 200 ms ; ${performanceFailures.length} métrique(s) hors seuil)` : ' (mesures ignorées)'}.`,
    `- Build QA : \`${buildDir}\` ; captures et résultats : \`${out}\`.`,
    `- Poids du build QA (fixtures/adaptateurs inclus) : ${qaBundleStats.rawBytes.toLocaleString('fr-CH')} B / ${qaBundleStats.gzipBytes.toLocaleString('fr-CH')} B gzip ; entrée \`${qaBundleStats.entry}\` : ${qaBundleStats.entryRawBytes.toLocaleString('fr-CH')} B / ${qaBundleStats.entryGzipBytes.toLocaleString('fr-CH')} B gzip. Ce n’est pas le poids production.`,
    '- Commandes : `node scripts/build-hop-recipe-qa.mjs`, puis `node scripts/check-recipe-journey-ui.mjs` avec les variables ci-dessous.',
    `- Entrée : Recettes → Actions rapides → Créer une recette. Largeurs : ${widths.join(', ')} px.`,
    captureOnly
      ? '- États capturés : recette vierge, Houblons, Levure Wyeast 1056, dossier, essai Lager et simulation.'
    : '- États : sept étapes, recette vierge, source Cascade/Hopsteiner visible dans l’éditeur lots/COA, faits fabricant Wyeast 1056 avant/après sélection et dans le dossier, simulation, sauvegarde/réouverture/modification, recette incomplète enregistrable et préparation du brassin bloquée.',
    captureOnly ? '- Reprise locale et sauvegarde incomplète : non couvertes en mode capture seule.' : '- Reprise locale : refus IA du banc sans réseau, nouvel essai avec Ariana synthétique, proposition examinée avant application.',
    captureOnly
      ? '- Libellés longs et reflow CSS 640 px : non couverts en mode capture seule.'
      : '- Libellés longs : titre et ingrédient libre à 320/375 px. Reflow ordinateur : viewport CSS 640 px à partir de 1280 px (équivalent de mise en page à 200 % ; zoom du navigateur inchangé).',
    '',
    '| Viewport | Smoke | Perf | saisie n / p95 → frame suivant | navigation n / p95 → frame suivant | démarrage n / p95 | à chaud n / p95 | transition la plus lente | console/runtime | HTTP en échec | distantes / bloquées |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |',
    reportRows,
    '',
    'Navigation agrégée = 3 transitions de mise en route + 12 répétées à chaud (15 au total), alignée sur la mesure de référence. Le JSON conserve chaque valeur nommée avec sa phase, ainsi que la transition la plus lente. Le smoke continue après une violation du seuil et le processus termine avec un code non nul après écriture des rapports.',
    '',
    '```json',
    JSON.stringify(commandInfo, null, 2),
    '```',
    '',
    'Limites : composants réels contre adaptateurs QA et fixtures synthétiques ; requêtes externes bloquées. Le rapport ne tire pas de conclusion sur le poids production, mesuré séparément.',
  ].join('\n') + '\n');
  if (runPerformance && performanceFailures.length) {
    console.error(`Performance gate FAIL after all viewports: ${JSON.stringify(performanceFailures)}`);
    process.exitCode = 1;
  }
}

try {
  if (mode === 'journey') {
    await runJourney();
  } else if (mode === 'baseline') {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  const diagnostics = await page.evaluate(() => ({ title: document.title, body: document.body.innerText.slice(0, 3000), qa: Boolean(window.__hopQa), root: document.querySelector('#root')?.innerHTML.slice(0, 1500), scripts: [...document.scripts].map(s => s.src) }));
  await writeFile(resolve(out, 'startup-debug.json'), JSON.stringify({ diagnostics, requests, responses, blocked, remote, errors }, null, 2));
  console.log(JSON.stringify({ startup: diagnostics, requests, responses, blocked, remote, errors }, null, 2));
  await page.waitForFunction(() => window.__hopQa?.ready(), { timeout: 7000 });
  assert((await page.title()).includes('banc QA'));
  const setup = await page.evaluate(() => {
    const recipe = window.__hopQa.recipe();
    recipe.id = 'qa-recipe-journey-existing';
    recipe.name = 'Recette QA existante';
    recipe.style = 'American IPA';
    recipe.yeast = { name: 'Wyeast 1056', lab: 'Wyeast', strain: '1056', hopIndexId: 'wyeast-1056', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 };
    window.__hopQa.seedRecipe(recipe);
    return { recipe: window.__hopQa.storage.getRecipes().find(r => r.id === recipe.id), marker: localStorage.getItem(window.__hopQa.marker) };
  });
  assert(setup.recipe, 'Synthetic existing recipe seeded through local QA adapter');
  await page.waitForFunction(() => document.body.innerText.includes('Recettes'));
  const routes = [await snapshot('catalogue-initial')];
  await capture('baseline-carnet-375');
  await clickUnique('button[aria-label="Ouvrir la recette Recette QA existante"]', 'Ouvrir la recette synthétique existante');
  await page.waitForSelector('button[aria-label="Modifier la recette"]', { visible: true });
  routes.push(await snapshot('fiche-existante'));
  await capture('baseline-fiche-existante-375');
  await clickUnique('button[aria-label="Modifier la recette"]', 'Modifier la recette existante');
  await page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
  await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Levure"]', 'Ouvrir Levure sur Wyeast 1056');
  await page.waitForSelector('.recipe-wizard [aria-label="Choisir la levure de la recette"]', { visible: true });
  assert.match(await page.$eval('.recipe-wizard [aria-label="Choisir la levure de la recette"]', e => e.textContent), /Wyeast 1056/);
  routes.push(await snapshot('recette-existante-wyeast-1056'));
  await capture('baseline-wyeast-1056-levure-375', '.recipe-wizard .yc-current');
  await clickExactLabel('.recipe-wizard .yc-dossier summary', 'Fiche, sources et données de la souche', 'Déplier le dossier Wyeast 1056');
  await page.waitForFunction(() => document.querySelector('.recipe-wizard .yc-dossier')?.open);
  routes.push(await snapshot('recette-existante-wyeast-1056-dossier'));
  await capture('baseline-wyeast-1056-dossier-375', '.recipe-wizard .yc-dossier');
  await clickUnique('.recipe-wizard button[aria-label="Fermer"]', 'Fermer l’édition sans enregistrer');
  await page.waitForSelector('button[aria-label="Actions rapides"]', { visible: true });
  await clickUnique('.floating-actions button[aria-label="Actions rapides"]', 'Ouvrir les actions rapides');
  await clickExactLabel('[role="menuitem"]', 'Créer une recette', 'Choisir le menu Créer une recette');
  await page.waitForSelector('.recipe-wizard #wz-title', { visible: true });
  routes.push(await snapshot('creation-vierge-identite'));
  await capture('baseline-creation-identite-375', '.recipe-wizard #wz-title');
  await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Houblons"]', 'Ouvrir l’étape Houblons');
  await page.waitForFunction(() => document.querySelector('.recipe-wizard [aria-label^="Ajouter un houblon"]'));
  routes.push(await snapshot('creation-vierge-houblons'));
  await capture('baseline-creation-houblons-375', '.recipe-wizard [aria-label^="Ajouter un houblon"]');
  await clickUnique('.recipe-wizard nav[aria-label="Étapes"] button[aria-label="Levure"]', 'Ouvrir l’étape Levure');
  await page.waitForFunction(() => document.querySelector('.recipe-wizard [aria-label="Rechercher une levure"]'));
  routes.push(await snapshot('creation-vierge-levure'));
  await capture('baseline-creation-levure-375', '.recipe-wizard [aria-label="Rechercher une levure"]');
  await installJourneyMetrics();
  const inputGroups = [], setupNavigation = [];
  const measureSeries = async (step, selector, values, label) => {
    const navigationStart = await page.evaluate(() => window.__recipeJourneyMetrics.navigation.length);
    await clickUnique(`.recipe-wizard nav[aria-label="Étapes"] button[aria-label="${step}"]`, `Ouvrir l’étape ${step} pour la mesure`);
    await page.waitForFunction(expected => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === expected, {}, step);
    await page.waitForFunction(start => window.__recipeJourneyMetrics.navigation.length > start, {}, navigationStart);
    const navigationSample = await page.evaluate(start => window.__recipeJourneyMetrics.navigation[start], navigationStart);
    setupNavigation.push({ phase: 'setup', step, durationMs: Number(navigationSample.toFixed(1)) });
    await page.waitForSelector(selector, { visible: true });
    const readOnly = await page.$eval(selector, element => 'readOnly' in element && element.readOnly);
    if (readOnly) {
      const field = page.locator(selector);
      await field.click(); await field.click();
      await page.waitForFunction(selector => { const element = document.querySelector(selector); return element && 'readOnly' in element && !element.readOnly; }, {}, selector);
    }
    const firstIndex = await page.evaluate(() => window.__recipeJourneyMetrics.inputs.length);
    for (const value of values) {
      const count = await page.evaluate(() => window.__recipeJourneyMetrics.inputs.length);
      await page.locator(selector).fill(value);
      await page.waitForFunction(count => window.__recipeJourneyMetrics.inputs.length > count, {}, count);
    }
    const valuesMs = await page.evaluate(index => window.__recipeJourneyMetrics.inputs.slice(index), firstIndex);
    inputGroups.push({ label, samples: valuesMs.length, p95Ms: Number([...valuesMs].sort((a,b)=>a-b)[Math.ceil(valuesMs.length*.95)-1].toFixed(1)), valuesMs: valuesMs.map(v => Number(v.toFixed(1))) });
  };
  await measureSeries('Identité', '.recipe-wizard #wz-title', ['QA bière A','QA bière B','QA bière C','QA bière D','QA bière E','QA bière F','QA bière G','QA bière H'], 'Nom de recette');
  await measureSeries('Houblons', '.recipe-wizard [aria-label^="Ajouter un houblon"]', ['Cascade','Citra','Saaz','Hallertau','Centennial','Mosaic','Amarillo','Cascade'], 'Recherche de houblon');
  await measureSeries('Levure', '.recipe-wizard [aria-label="Rechercher une levure"]', ['SafAle','US-05','Diamond','Verdant','WLP095','SafAle US-05','Lallemand','Verdant IPA'], 'Recherche de levure');
  const navFirst = await page.evaluate(() => window.__recipeJourneyMetrics.navigation.length);
  const warmNavigation = [];
  for (let i=0; i<12; i++) {
    const step = i % 2 ? 'Levure' : 'Houblons';
    await clickUnique(`.recipe-wizard nav[aria-label="Étapes"] button[aria-label="${step}"]`, `Navigation locale vers ${step}`);
    await page.waitForFunction(expected => document.querySelector('.recipe-wizard nav[aria-label="Étapes"] [aria-current="step"]')?.getAttribute('aria-label') === expected, {}, step);
    await page.waitForFunction(count => window.__recipeJourneyMetrics.navigation.length > count, {}, navFirst + i);
    const navigationSample = await page.evaluate(index => window.__recipeJourneyMetrics.navigation[index], navFirst + i);
    warmNavigation.push({ phase: 'warmed', iteration: i + 1, step, durationMs: Number(navigationSample.toFixed(1)) });
  }
  assert.equal(setupNavigation.length, 3, 'Blank-recipe baseline records the same three setup transitions as the journey run');
  assert.equal(warmNavigation.length, 12, 'Blank-recipe baseline records the same twelve warmed transitions as the journey run');
  const latency = await metricSummary();
  assert.equal(latency.stepNavigationToFrameAfterPaint.count, 15, 'Blank-recipe baseline aggregates the same fifteen transitions as the journey run');
  const summarize = values => {
    const sorted = [...values].sort((a, b) => a - b), percentile = p => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)].toFixed(1)) : null;
    return { count: sorted.length, p50: percentile(.5), p95: percentile(.95), max: percentile(1) };
  };
  latency.stepNavigationPhases = {
    setup: summarize(setupNavigation.map(event => event.durationMs)),
    warmed: summarize(warmNavigation.map(event => event.durationMs)),
  };
  latency.navigationEvents = { setup: setupNavigation, warmed: warmNavigation };
  latency.slowestNavigationEvent = [...setupNavigation, ...warmNavigation].reduce((slowest, event) => !slowest || event.durationMs > slowest.durationMs ? event : slowest, null);
  await writeFile(resolve(out, 'baseline-latency-375.json'), JSON.stringify({ method: 'trusted Puppeteer input/click events; input/navigation event timestamp through two requestAnimationFrame callbacks (frame after next paint), same Chrome protocol for after run', width: 375, height: 812, latency, inputGroups }, null, 2));
  await writeFile(resolve(out, 'baseline-views.json'), JSON.stringify({ width: 375, height: 812, routes, setup, latency, inputGroups, remote, blocked, errors }, null, 2));
  console.log(JSON.stringify({ mode, out, captures: ['baseline-carnet-375.png','baseline-fiche-existante-375.png','baseline-wyeast-1056-levure-375.png','baseline-wyeast-1056-dossier-375.png','baseline-creation-identite-375.png','baseline-creation-houblons-375.png','baseline-creation-levure-375.png'], latency, inputGroups: inputGroups.map(({label,samples,p95Ms})=>({label,samples,p95Ms})), remote, blocked, errors }, null, 2));
  } else {
    throw Error(`Unknown RECIPE_QA_MODE: ${mode}`);
  }
} catch (error) {
  const failureState = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, url: location.href, title: document.title,
    body: document.body.innerText.slice(0, 12000),
    buttons: [...document.querySelectorAll('button')].filter(element => element.getClientRects().length).map(element => ({ text: element.innerText.trim(), label: element.getAttribute('aria-label'), disabled: element.disabled })),
    inputs: [...document.querySelectorAll('input,textarea,select')].filter(element => element.getClientRects().length).map(element => ({ id: element.id, label: element.getAttribute('aria-label'), placeholder: element.getAttribute('placeholder'), value: element.value })),
  })).catch(() => ({ url: page.url() }));
  await writeFile(resolve(out, 'failure-state.json'), JSON.stringify({ error: error instanceof Error ? error.stack : String(error), failureState, requests, responses, blocked, remote, errors }, null, 2));
  if (failureState.url) await page.screenshot({ path: resolve(out, 'failure-state.png'), fullPage: false }).catch(() => {});
  if (mode === 'journey') {
    const message = error instanceof Error ? error.message.replace(/\s+/g, ' ').trim() : String(error).replace(/\s+/g, ' ').trim();
    const commandInfo = {
      command: 'node scripts/check-recipe-journey-ui.mjs',
      environment: {
        HOP_QA_BUILD_DIR: buildDir,
        HOP_QA_OUTPUT: out,
        HOP_QA_SKIP_BUILD: process.env.HOP_QA_SKIP_BUILD === '1' ? '1' : '0',
        RECIPE_QA_MODE: mode,
        RECIPE_QA_CAPTURE_ONLY: captureOnly ? '1' : '0',
        RECIPE_QA_PERF: runPerformance ? '1' : '0',
        RECIPE_QA_WIDTHS: process.env.RECIPE_QA_WIDTHS || '320,375,430,1280',
      },
    };
    await writeFile(resolve(out, 'journey-report.md'), [
      '# QA du parcours Recettes',
      '',
      '- Résultat : échec ; le smoke s’est arrêté à la première assertion ou erreur de navigateur.',
      `- Erreur : ${message}`,
      `- Dernier viewport : ${failureState.width ?? 'indisponible'} × ${failureState.height ?? 'indisponible'} ; evidence : \`${out}\`.`,
      `- Console/runtime : ${errors.length} ; HTTP en échec : ${responses.length} ; requêtes distantes : ${remote.length} ; bloquées : ${blocked.length}.`,
      '- Captures de panne : `failure-state.png` et `failure-state.json`.',
      '- Limites : production UI contre adaptateurs QA/fixtures synthétiques ; aucun accès Firebase. Le bundle production est mesuré séparément du build QA.',
      '',
      '```json',
      JSON.stringify(commandInfo, null, 2),
      '```',
    ].join('\n') + '\n');
  }
  throw error;
} finally {
  await browser.close();
  if (keepServer) console.log(`QA_REVIEW_URL=${base}/tests/qa/hop-recipe/index.html`);
  else await new Promise(r => server.close(r));
}
if (keepServer) await new Promise(() => {});
