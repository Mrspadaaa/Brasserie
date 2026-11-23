// Capture and serve the real Wizard Levure against the isolated hop-recipe QA
// fixture. No production Firebase, AI, deployment or external network is used.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const phase = process.argv.includes('--after') ? 'after' : 'before';
const focusClaude02 = process.argv.includes('--claude02-focus');
const focusClaude03Packs = process.argv.includes('--claude03-pack-focus');
const focusPreJ0 = process.argv.includes('--prej0-focus');
const focusPreJ0Late = process.argv.includes('--prej0-late-focus');
const focusCompareS1 = process.argv.includes('--compare-s1-focus');
const focusOfferContext = process.argv.includes('--offer-product-context-focus');
const focusManualSupply = process.argv.includes('--manual-supply-focus');
const focusM20Source = process.argv.includes('--m20-source-focus');
const focusWortIdentity = process.argv.includes('--wort-identity-focus');
const focusStarterNotice = process.argv.includes('--starter-notice-focus');
const focusFreeLocalWort = process.argv.includes('--free-local-wort-focus');
const focusFlocculationProvenance = process.argv.includes('--flocculation-provenance-focus');
const focusPerformanceIntegration = process.argv.includes('--performance-integration-focus');
const buildDir = resolve(process.env.YEAST_REFACTOR_QA_BUILD_DIR ?? resolve(tmpdir(), `laffinee-hop-qa-yeast-refonte${phase === 'after' ? '-after' : ''}`));
const defaultEvidenceRoot = focusPerformanceIntegration
  ? resolve(root, 'work/levure-refonte-realisation-2026-09-27/performance-integration-2026-09-28')
  : resolve(root, 'work/levure-refonte-realisation-2026-09-27/qa');
const evidenceRoot = resolve(process.env.YEAST_REFACTOR_QA_OUTPUT ?? defaultEvidenceRoot);
const serving = process.argv.includes('--serve');
const reuseBuild = process.argv.includes('--reuse-build');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceDir = resolve(evidenceRoot, phase, phase === 'after' && !serving ? `run-${runId}` : '.');
const conceptsFile = resolve(root, 'work/levure-refonte-realisation-2026-09-27/concepts.html');
const yeastSupplyQa = JSON.parse(await readFile(resolve(root, 'src/data/yeastSupplyBootstrap.json'), 'utf8'));
const qaLateActivatorProduct = yeastSupplyQa.products.find(product => product.id === 'wyeast-1056-activator-125ml');
if (!qaLateActivatorProduct?.starter) throw new Error('La fiche Activator et son protocole bootstrap manquent pour la relecture pré-J0 tardive.');
const qaStarterEntryProduct = yeastSupplyQa.products.find(product => product.id === 'wyeast-1007-xl-unspecified');
if (!qaStarterEntryProduct || qaStarterEntryProduct.form === 'sèche' || qaStarterEntryProduct.starter)
  throw new Error('La fixture bootstrap QA doit être un produit liquide exact sans notice de starter.');

if (!reuseBuild) await buildHopRecipeQa(buildDir);
await access(resolve(buildDir, 'tests/qa/hop-recipe/index.html'));
await mkdir(evidenceDir, { recursive: true });

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = pathname === '/concepts.html' ? conceptsFile
      : resolve(buildDir, pathname === '/' ? 'tests/qa/hop-recipe/index.html' : `.${pathname}`);
    if (pathname !== '/concepts.html' && !file.startsWith(buildDir + sep)) { res.writeHead(403); res.end('forbidden'); return; }
    const body = await readFile(file);
    res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    // The review server deliberately cannot load a remote API or asset.
    res.setHeader('Content-Security-Policy', "default-src 'self' data: blob:; connect-src 'self' data:; img-src 'self' data: blob:; font-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:");
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(serving ? Number(process.env.YEAST_REFACTOR_QA_PORT ?? (phase === 'after' ? 4181 : 4178)) : 0, '127.0.0.1', resolveListen);
});
const base = `http://127.0.0.1:${server.address().port}`;

if (serving) {
  console.log(`Banc QA local prêt : ${base}/?ux-poc=reset`);
  console.log(`Concepts A/B : ${base}/concepts.html`);
  console.log(`Build isolé : ${buildDir}`);
  console.log('Arrêter le service avec Ctrl+C. L’URL reset recharge uniquement les fixtures QA locales.');
  await new Promise(() => {});
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio'],
});

const labels = ['mobile-390x844', 'desktop-1280x900'];
const targetRecipe = 'Weissbier de contrôle';
const manifest = {
  capturedAt: new Date().toISOString(),
  kind: phase,
  flow: phase === 'before' ? `banc QA hop-recipe → fixture yeastFlowRecipe « ${targetRecipe} » → Modifier → étape Levure`
    : focusPreJ0Late ? 'Rejeu ciblé de la limite de démarrage pré-J0 et de la conservation d’une exécution commencée.'
      : focusPreJ0 ? 'Qualification ciblée du vrai panneau Activator pré-J0 : plan manuel sourcé → brassin planifié figé → préparation et stock comptés → transfert de culture.'
      : focusClaude03Packs ? 'Qualification Claude03 ciblée : choix direct → adoption 3 packs au-delà du repère, Undo → 2 packs dans les repères.'
    : focusOfferContext ? 'Rejeu ciblé des offres mobiles : deux produits du même vendeur gardent leur identité exacte dans le résumé à droite.'
      : focusM20Source ? 'Rejeu ciblé M20 : observations de température homonymes, titres/contexte distincts et citation unique du document commun.'
      : focusManualSupply ? 'Qualification générique produit/offre : définition locale, sauvegarde hors ligne, comparaison de copies, propositions locales, reçus et refus CAS.'
      : focusWortIdentity ? 'Point 4 Astra : moût mesuré au clavier, identité stock/libre liée à une fiche locale, effacement et Undo/Redo sans résurrection.'
      : focusPerformanceIntegration ? 'Tranche combinée : première fiche/rapport → Ctrl+K recette A→B, retour et focus → édition du moût avec ownership documentaire et Undo/Redo → sauvegarde, réouverture et snapshot inchangé.'
      : focusStarterNotice ? 'Notice starter : source saisie, revue serveur locale, reçu sans adoption automatique, adoption volontaire, plan pré-J0 et snapshot.'
      : focusFreeLocalWort ? 'Point 4 Astra ciblé : identité libre documentée sans ref, édition/qualification/effacement du moût et persistance exacte de la fiche.'
      : focusFlocculationProvenance ? 'Point 2 Astra ciblé : floculation Low avec compagnon IA accepté, champ choisi sourcé après stock puis contre-exemple historique.'
      : focusCompareS1 ? 'Qualification S1 : comparaison volontaire avec même moût mesuré, sources/offres et maintien de la référence.'
      : focusClaude02 ? 'Qualification copies Claude02 : recherche/choix avant offre → masse/format et adoption de packs → observations sourcées par mock existant → sauvegarde/réouverture locale.'
  : 'Wizard Levure réel → référence Wyeast1007 XL hors stock → choix direct → packs 3 au-delà du repère puis 2 dans le repère → sauvegarde/réouverture → starter Activator planifié et exécuté avant J0',
  sourceFixture: focusPerformanceIntegration
    ? 'tests/fixtures/fruty.ts via window.__hopQa.nolo.fruty(), complétée dans le stockage QA local; ?ux-poc=reset'
    : 'tests/fixtures/yeastRecipeFlow.ts, injectée dans tests/qa/hop-recipe/main.tsx via ?ux-poc=reset',
  browser: 'Puppeteer Core avec Chrome local ; Browser plugin indisponible dans cette session',
  environmentLimit: '390 px est une émulation de viewport Chrome desktop, pas un appareil Android.',
  runCommand: `node scripts/check-yeast-refonte-ui.mjs ${process.argv.slice(2).join(' ')}`,
  reviewUrl: focusPerformanceIntegration ? `${base}/?ux-poc=reset`
    : phase === 'before' ? 'http://127.0.0.1:4178/?ux-poc=reset' : 'http://127.0.0.1:4181/?ux-poc=reset',
  reviewServerLifetime: focusPerformanceIntegration ? 'Serveur localhost éphémère, fermé après les captures.' : undefined,
  conceptsUrl: phase === 'after' && !focusPerformanceIntegration ? 'http://127.0.0.1:4181/concepts.html' : undefined,
  serviceCommand: focusPerformanceIntegration ? `node scripts/check-yeast-refonte-ui.mjs --after --performance-integration-focus${reuseBuild ? ' --reuse-build' : ''}`
    : phase === 'before' ? 'node scripts/check-yeast-refonte-ui.mjs --serve --reuse-build'
      : 'node scripts/check-yeast-refonte-ui.mjs --after --serve --reuse-build',
  screenshots: [],
};
const failures = [];

try {
  if (phase === 'before') for (const [width, height, label] of [[390, 844, labels[0]], [1280, 900, labels[1]]]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const remoteRequests = [];
    const pageErrors = [];
    const consoleErrors = [];
    await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (/^https?:/i.test(url) && !url.startsWith(`${base}/`)) {
        remoteRequests.push(url);
        request.abort();
      } else request.continue();
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type())) consoleErrors.push({ type: message.type(), text: message.text() });
    });
    await page.evaluateOnNewDocument(() => {
      if (!sessionStorage.getItem('__HOP_QA_INITIAL_UI_STATE__')) {
        localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' }));
        sessionStorage.setItem('__HOP_QA_INITIAL_UI_STATE__', '1');
      }
    });

    await page.goto(`${base}/?ux-poc=reset`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__hopQa?.ready());
    const editSelector = `[aria-label=${JSON.stringify(`Modifier la recette ${targetRecipe}`)}]`;
    await page.waitForSelector(editSelector, { visible: true });
    const editButton = await page.$(editSelector);
    const folded = await editButton.evaluateHandle(element => {
      const details = element.closest('details');
      return details && !details.open ? details.querySelector('summary') : null;
    });
    if (folded.asElement()) await folded.asElement().click();
    await page.locator(editSelector).click();
    await page.waitForSelector('#wz-title', { visible: true });
    const yeastStep = await page.waitForFunction(() => [...document.querySelectorAll('nav[aria-label="Étapes"] button')]
      .find(button => button.getClientRects().length && button.getAttribute('aria-label') === 'Levure'));
    await yeastStep.asElement().click();
    const panelSelector = '[aria-label="Choisir la levure de la recette"], [aria-label="Choix et simulation de levure"]';
    await page.waitForSelector(panelSelector, { visible: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));

    assert.equal(await page.title(), 'L’Affinée · banc QA local', 'La page est le banc QA local attendu.');
    assert(await page.$('body') && (await page.$eval('body', element => element.innerText)).includes('Levure'), 'Le Wizard Levure affiche du contenu.');
    assert.equal(await page.$('vite-error-overlay'), null, 'Aucun overlay Vite.');

    const state = await page.evaluate(() => {
      const panel = document.querySelector('[aria-label="Choisir la levure de la recette"]')
        ?? document.querySelector('[aria-label="Choix et simulation de levure"]');
      const visible = element => !!element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
      const rect = element => {
        const { x, y, width, height, right, bottom } = element.getBoundingClientRect();
        return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height), right: Math.round(right), bottom: Math.round(bottom) };
      };
      const controls = [...(panel ?? document).querySelectorAll('button,input,select,textarea,[role="combobox"],[role="radio"],[role="option"]')]
        .filter(element => {
          if (!visible(element) || element.closest('.sr-only,[aria-hidden="true"]')) return false;
          const bounds = element.getBoundingClientRect();
          return bounds.bottom > 0 && bounds.top < innerHeight && bounds.right > 0 && bounds.left < innerWidth;
        }).map(element => ({
          tag: element.tagName.toLowerCase(), role: element.getAttribute('role'),
          label: element.getAttribute('aria-label') || element.labels?.[0]?.innerText?.trim() || '',
          text: element.innerText?.trim().slice(0, 120) || '',
          value: 'value' in element ? element.value : undefined,
          disabled: 'disabled' in element ? element.disabled : false,
          rect: rect(element),
        }));
      const escapes = [...(panel ?? document).querySelectorAll('*')].filter(visible).filter(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.left < -1 || bounds.right > innerWidth + 1;
      }).map(element => ({ tag: element.tagName.toLowerCase(), text: element.textContent?.trim().slice(0, 90), rect: rect(element) })).slice(0, 20);
      return {
        url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        panelVisible: visible(panel), panelRect: panel ? rect(panel) : null,
        wizardStep: document.querySelector('nav[aria-label="Étapes"]')?.innerText ?? '',
        visibleText: panel?.innerText ?? '', controls, escapes,
        wizardControls: [...document.querySelectorAll('.recipe-wizard button')].filter(element => {
          if (!visible(element) || element.closest('.sr-only,[aria-hidden="true"]')) return false;
          const bounds = element.getBoundingClientRect();
          return bounds.bottom > 0 && bounds.top < innerHeight && bounds.right > 0 && bounds.left < innerWidth;
        }).map(element => ({
          label: element.getAttribute('aria-label') || element.innerText.trim(), disabled: element.disabled,
          rect: rect(element),
        })),
        fixture: window.__hopQa.storage.getRecipes().find(recipe => recipe.name === 'Weissbier de contrôle')?.yeast ?? null,
        callableAttempts: [...window.__hopQa.calls],
      };
    });
    assert.deepEqual(remoteRequests, [], `Tentative réseau externe sur ${label}`);
    assert.deepEqual(pageErrors, [], `Erreur JavaScript sur ${label}`);
    assert.equal(state.viewport.width, width);
    assert.equal(state.viewport.height, height);
    assert.equal(state.fixture?.hopIndexId, 'wyeast-3068', 'Le parcours reprend la fixture levure existante.');
    assert.equal(state.horizontalOverflow, false, `Débordement de page à ${label}`);
    assert.equal(state.escapes.length, 0, `Éléments du panneau hors écran à ${label}: ${JSON.stringify(state.escapes)}`);
    assert.match(state.visibleText, /Wyeast 3068/i, 'La souche de la fixture est visible dans le Wizard.');

    const screenshot = resolve(evidenceDir, `levure-${label}-avant.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    await writeFile(resolve(evidenceDir, `levure-${label}-avant.json`), JSON.stringify({ ...state, pageErrors, consoleErrors, remoteRequests }, null, 2));
    manifest.screenshots.push({ label, viewport: state.viewport, path: screenshot, panelRect: state.panelRect,
      visibleControls: state.controls.length, overflow: state.horizontalOverflow, visiblePanelText: state.visibleText });
    failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
    await context.close();
  }

  else {
    const afterRuns = [];
    const clickSelector = async (page, selector) => {
      const handle = await page.waitForFunction(selector => [...document.querySelectorAll(selector)]
        .find(element => element.getClientRects().length && !element.disabled), { timeout: 15000 }, selector);
      const element = handle.asElement();
      await element.evaluate(node => node.scrollIntoView({ block: 'center' }));
      await element.click();
      await handle.dispose();
    };
    const clickTextIn = async (page, scopeSelector, text, itemSelector = 'button') => {
      const handle = await page.waitForFunction(({ scopeSelector, text, itemSelector }) => {
        const scope = document.querySelector(scopeSelector);
        return scope && [...scope.querySelectorAll(itemSelector)].find(element => element.getClientRects().length
          && !element.disabled && element.textContent.trim() === text);
      }, { timeout: 15000 }, { scopeSelector, text, itemSelector });
      const element = handle.asElement();
      await element.evaluate(node => node.scrollIntoView({ block: 'center' }));
      await element.click();
      await handle.dispose();
    };
    const openDisclosure = async (page, selector) => {
      if (await page.$eval(selector, element => element.open).catch(() => false)) return;
      await clickSelector(page, `${selector} summary`);
      if (!await page.$eval(selector, element => element.open).catch(() => false)) {
        const summary = await page.waitForSelector(`${selector} summary`, { visible: true, timeout: 5000 });
        await summary.focus();
        await page.keyboard.press('Enter');
      }
      await page.waitForFunction(target => document.querySelector(target)?.open, { timeout: 5000 }, selector);
    };
    const fillLabelledInput = async (page, scopeSelector, labelStart, value) => {
      const handle = await page.waitForFunction(({ scopeSelector, labelStart }) => {
        const scope = document.querySelector(scopeSelector);
        return scope && [...scope.querySelectorAll('label')].find(label => label.textContent.trim().startsWith(labelStart))
          ?.querySelector('input,textarea');
      }, { timeout: 10000 }, { scopeSelector, labelStart });
      const element = handle.asElement();
      await element.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await element.type(value);
      await page.keyboard.press('Tab');
      await handle.dispose();
    };
    const selectLabelOption = async (page, scopeSelector, labelStart, value) => {
      const id = await page.$eval(scopeSelector, (scope, text) => {
        const label = [...scope.querySelectorAll('label')].find(element => element.textContent.trim().startsWith(text));
        return label?.querySelector('select')?.id ?? '';
      }, labelStart);
      assert(id, `${scopeSelector}: sélecteur « ${labelStart} » introuvable.`);
      await page.select(`select[id=${JSON.stringify(id)}]`, value);
    };
    const inputValueForLabel = async (page, scopeSelector, labelStart) => page.$eval(scopeSelector, (scope, text) => {
      const label = [...scope.querySelectorAll('label')].find(element => element.textContent.trim().startsWith(text));
      return label?.querySelector('input,textarea,select')?.value ?? '';
    }, labelStart);
    const typeNumericInput = async (page, selector, value) => {
      const element = await page.waitForSelector(selector, { visible: true, timeout: 10000 });
      await element.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await element.type(value);
      await page.keyboard.press('Tab');
      await element.dispose();
    };
    const clickStep = async (page, label) => {
      const handle = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')]
        .find(button => button.getClientRects().length && button.getAttribute('aria-label') === label), { timeout: 15000 }, label);
      const element = handle.asElement();
      await element.evaluate(node => node.scrollIntoView({ block: 'nearest' }));
      await element.click();
      await handle.dispose();
    };
    const openRecipeEditor = async (page, name) => {
      const selector = `[aria-label=${JSON.stringify(`Modifier la recette ${name}`)}]`;
      await page.waitForSelector(selector, { visible: true, timeout: 15000 });
      const button = await page.$(selector);
      const summary = await button.evaluateHandle(element => {
        const details = element.closest('details');
        return details && !details.open ? details.querySelector('summary') : null;
      });
      if (summary.asElement()) await summary.asElement().click();
      await clickSelector(page, selector);
      await page.waitForSelector('.recipe-wizard', { visible: true, timeout: 15000 });
    };
    const captureReview = async (page, width, height, name, scrollSelector) => {
      if (scrollSelector) {
        const handle = await page.waitForSelector(scrollSelector, { visible: true, timeout: 15000 });
        await handle.evaluate(element => element.scrollIntoView({ block: 'start' }));
      }
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const state = await page.evaluate(() => ({
        url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight },
        scrollX, scrollY, documentWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        step: document.querySelector('nav[aria-label="Étapes"] button[aria-current="step"]')?.getAttribute('aria-label')
          ?? [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(button => button.getAttribute('aria-pressed') === 'true')?.getAttribute('aria-label') ?? '',
        visibleText: document.body.innerText,
        supplyState: document.querySelector('.yp-supply')?.getAttribute('data-product-state'),
        lotState: document.querySelector('.yp-lot')?.getAttribute('data-lot'),
        wortBasis: document.querySelector('.yp-wort')?.getAttribute('data-wort-basis'),
        advice: document.querySelector('[data-advice-range]')?.innerText ?? '',
        packs: document.querySelector('[data-advice-packs]')?.innerText ?? '',
        calls: [...(window.__hopQa?.calls ?? [])],
      }));
      assert.equal(state.viewport.width, width, `${name}: largeur du viewport`);
      assert.equal(state.viewport.height, height, `${name}: hauteur du viewport`);
      assert.equal(state.horizontalOverflow, false, `${name}: débordement horizontal`);
      const screenshot = resolve(evidenceDir, `${name}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      await writeFile(resolve(evidenceDir, `${name}.json`), JSON.stringify(state, null, 2));
      manifest.screenshots.push({ name, viewport: state.viewport, path: screenshot, scrollY: state.scrollY,
        supplyState: state.supplyState, lotState: state.lotState, wortBasis: state.wortBasis,
        advice: state.advice, packs: state.packs });
      return state;
    };
    const runPerformanceIntegrationNavigation = async (page, recipe, width, height, label) => {
      const openA = `[aria-label=${JSON.stringify(`Ouvrir la recette ${recipe.name}`)}]`;
      const openB = `[aria-label=${JSON.stringify(`Ouvrir la recette ${recipe.performance.otherRecipeName}`)}]`;
      const screenshotNames = [];
      await page.waitForSelector(openA, { visible: true, timeout: 15000 });
      await page.waitForSelector(openB, { visible: true, timeout: 15000 });
      const list = await captureReview(page, width, height, `perf-integration-liste-${label}-apres`);
      screenshotNames.push(`perf-integration-liste-${label}-apres.png`);
      const listNames = [recipe.name, recipe.performance.otherRecipeName].filter(name => list.visibleText.includes(name));
      assert.equal(listNames.length, 2, 'La liste des recettes expose A et B avant navigation directe.');

      await clickSelector(page, openA);
      await page.waitForFunction(name => {
        const recipePage = document.querySelector('.recipe-reference');
        return recipePage?.innerText.includes(name) && recipePage.querySelector('[aria-label="Repères de la recette"] dd')
          && recipePage.querySelector('button[aria-label="Modifier la recette"]');
      }, { timeout: 15000 }, recipe.name);
      const firstSheet = await captureReview(page, width, height, `perf-integration-fiche-a-${label}-apres`);
      screenshotNames.push(`perf-integration-fiche-a-${label}-apres.png`);
      assert(firstSheet.visibleText.includes(recipe.name));

      const aromaDisclosure = '.recipe-reference details[data-recipe-section="Potentiel aromatique"]';
      await openDisclosure(page, aromaDisclosure);
      await page.waitForFunction(() => document.querySelector('.recipe-reference section[aria-label="Potentiel aromatique de la recette"]')
        ?.textContent.includes('lecture seule'), { timeout: 20000 });
      const firstReport = await captureReview(page, width, height, `perf-integration-premier-rapport-${label}-apres`,
        '.recipe-reference section[aria-label="Potentiel aromatique de la recette"]');
      screenshotNames.push(`perf-integration-premier-rapport-${label}-apres.png`);
      assert.match(firstReport.visibleText, /Potentiel aromatique/i);

      await page.keyboard.down('Control');
      await page.keyboard.press('K');
      await page.keyboard.up('Control');
      const searchSelector = '[placeholder^="Article, recette, brassin"]';
      await page.waitForSelector(searchSelector, { visible: true, timeout: 10000 });
      await page.locator(searchSelector).fill(recipe.performance.otherRecipeName);
      const resultSelector = `[cmdk-item][data-value=${JSON.stringify(`rec-${recipe.performance.otherRecipeId}`)}]`;
      await page.waitForSelector(resultSelector, { visible: true, timeout: 10000 });
      const search = await captureReview(page, width, height, `perf-integration-ctrl-k-resultat-b-${label}-apres`);
      screenshotNames.push(`perf-integration-ctrl-k-resultat-b-${label}-apres.png`);
      assert(search.visibleText.includes(recipe.performance.otherRecipeName));
      await page.keyboard.press('Enter');
      await page.waitForFunction(name => document.querySelector('.recipe-reference')?.innerText.includes(name),
        { timeout: 15000 }, recipe.performance.otherRecipeName);
      const focusOnB = await page.evaluate(() => ({
        inCurrentRecipe: !!document.activeElement?.closest('.recipe-reference'),
        pageLabel: document.activeElement?.closest('[data-page-shell]')?.getAttribute('aria-label') ?? null,
        openedRecipe: document.querySelector('.recipe-reference h1')?.innerText.trim() ?? null,
        openDisclosures: [...document.querySelectorAll('.recipe-reference details[data-recipe-section][open]')]
          .map(element => element.getAttribute('data-recipe-section')),
      }));
      assert(focusOnB.inCurrentRecipe, 'Après Ctrl+K, le focus entre dans la fiche B.');
      assert(focusOnB.openedRecipe?.includes(recipe.performance.otherRecipeName));
      assert.deepEqual(focusOnB.openDisclosures, [], 'La fiche B reçoit son identité sans hériter des disclosures de A.');
      const sheetB = await captureReview(page, width, height, `perf-integration-fiche-b-${label}-apres`);
      screenshotNames.push(`perf-integration-fiche-b-${label}-apres.png`);
      assert(sheetB.visibleText.includes(recipe.performance.otherRecipeName));

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.recipe-reference, .recipe-wizard, .brew-page')
        && !!document.querySelector('button[aria-label^="Ouvrir la recette "]'), { timeout: 15000 });
      const returnedFocus = await page.evaluate(name => {
        const opener = [...document.querySelectorAll('button[aria-label^="Ouvrir la recette "]')]
          .find(button => button.getAttribute('aria-label') === `Ouvrir la recette ${name}`);
        return { openerExists: !!opener, focusReturnedToA: document.activeElement === opener,
          activeLabel: document.activeElement?.getAttribute('aria-label') ?? null,
          routeClosed: !document.querySelector('.recipe-reference, .recipe-wizard, .brew-page') };
      }, recipe.name);
      assert(returnedFocus.openerExists && returnedFocus.focusReturnedToA && returnedFocus.routeClosed,
        `Escape ferme B et rend le focus au bouton qui avait ouvert A : ${JSON.stringify(returnedFocus)}`);
      await captureReview(page, width, height, `perf-integration-retour-focus-a-${label}-apres`);
      screenshotNames.push(`perf-integration-retour-focus-a-${label}-apres.png`);
      return { route: 'liste → A → premier rapport → Ctrl+K B → Escape → focus A', listNames,
        firstSheet: true, firstReport: true, focusOnB, returnedFocus, screenshotNames };
    };
    const measureMutation = async (page, selector, action) => {
      const previous = await page.$eval(selector, element => element.textContent);
      await page.evaluate(({ selector, previous }) => {
        window.__yeastQaLatency = undefined;
        window.__yeastQaObserver?.disconnect();
        const started = performance.now();
        const observer = new MutationObserver(() => {
          const target = document.querySelector(selector);
          if (target && target.textContent !== previous) {
            window.__yeastQaLatency = performance.now() - started;
            observer.disconnect();
          }
        });
        window.__yeastQaObserver = observer;
        observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
      }, { selector, previous });
      await action();
      await page.waitForFunction(() => Number.isFinite(window.__yeastQaLatency), { timeout: 4000 });
      const elapsed = await page.evaluate(() => {
        const value = window.__yeastQaLatency;
        window.__yeastQaObserver?.disconnect();
        delete window.__yeastQaLatency;
        delete window.__yeastQaObserver;
        return value;
      });
      return elapsed;
    };
    const setDateTimeValue = async (page, selector, value, index = 0) => {
      await page.$$eval(selector, (elements, { nextValue, nextIndex, selector }) => {
        const element = elements[nextIndex];
        if (!element) throw new Error(`Champ date/heure ${nextIndex} introuvable : ${selector}`);
        element.focus();
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, nextValue);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }, { nextValue: value, nextIndex: index, selector });
      await page.waitForFunction(({ selector, value: expected, targetIndex }) => document.querySelectorAll(selector)[targetIndex]?.value === expected,
        { timeout: 5000 }, { selector, value, targetIndex: index });
    };
    const installQaClock = async (page, at) => page.evaluateOnNewDocument(fixedNow => {
      const NativeDate = Date;
      class QaDate extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [fixedNow])); }
        static now() { return fixedNow; }
        static parse(value) { return NativeDate.parse(value); }
        static UTC(...args) { return NativeDate.UTC(...args); }
      }
      Object.defineProperty(window, 'Date', { configurable: true, writable: true, value: QaDate });
    }, at);
    const runPreJ0Scenario = async (page, remoteRequests, pageErrors, consoleErrors) => {
      const activatorProduct = 'wyeast-1056-activator-125ml';
      const activatorStockRef = 'qa-prej0-activator-flacon';
      const mediumStockRef = 'qa-prej0-extrait-malt';
      const grainStockRef = 'qa-prej0-pilsner-malt';
      const recipe = await page.evaluate(({ activatorProduct, activatorStockRef, mediumStockRef, grainStockRef }) => {
        const storage = window.__hopQa.storage;
        const config = storage.getConfig();
        const profileId = 'QA-BREWHOUSE-PREJ0-80L';
        const profile = { id: profileId, name: 'Banc QA synthétique · 80 L', volumeL: 80, efficiencyPct: 75,
          boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
          equipment: { kettleCapacityL: 120, kettleWorkingL: 100, workingVolumeConfirmed: true,
            spargeCapacityL: 100, fermenterCapacityL: 80, fermenterHeadspacePct: 20, roPackL: 5,
            boilOffLPerHour: 5, grainAbsorptionLPerKg: 0.96, grainDisplacementLPerKg: 0.67,
            coolingShrinkagePct: 4, heatingRateCPerMin: 0.5 } };
        config.brewhouses = [profile, ...config.brewhouses.filter(item => item.id !== profileId)];
        config.activeBrewhouseId = profileId;
        storage.saveConfig(config);
        storage.addStockItem('rawMaterials', { id: activatorStockRef, ref: activatorStockRef,
          name: 'Fixture QA · Wyeast 1056 Activator', category: 'Levure', unit: 'flacon', currentStock: 2, minStock: 0, reorder: false,
          yeastLot: { productId: activatorProduct, lotNumber: 'QA-PREJ0-1056' } });
        storage.addStockItem('rawMaterials', { id: mediumStockRef, ref: mediumStockRef,
          name: 'Fixture QA · Extrait de malt', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 0, reorder: false });
        storage.addStockItem('rawMaterials', { id: grainStockRef, ref: grainStockRef,
          name: 'Fixture QA · Malt Pilsner', category: 'Malt', unit: 'kg', currentStock: 10, minStock: 0, reorder: false });
        const seed = storage.getRecipes().find(item => item.name === 'Weissbier de contrôle');
        if (!seed) throw Error('La fixture locale Weissbier de contrôle manque.');
        if (!seed.fermentables?.[0]) throw Error('La fixture ne fournit pas de modèle de fermentescible pour le scénario synthétique.');
        const next = structuredClone(seed);
        next.id = 'QA-YEAST-PREJ0-ACTIVATOR';
        next.name = 'QA · Activator pré-J0';
        next.style = 'American Pale Ale';
        next.styleRef = undefined;
        next.yeastDesign = undefined;
        next.yeastGuide = undefined;
        next.fermentables = [{ ...structuredClone(seed.fermentables[0]), name: 'Fixture QA · Malt Pilsner',
          kind: 'grain', use: 'empatage', weightKg: 5, stockItemRef: grainStockRef }];
        next.hops = [];
        next.adjuncts = [];
        next.totalGristKg = 5;
        next.brewhouse = undefined;
        next.volumeL = 40;
        next.ogTarget = 1.05;
        next.yeast = { name: 'Wyeast 1056 American Ale', lab: 'Wyeast Laboratories', strain: '1056 American Ale',
          hopIndexId: 'wyeast-1056', form: 'liquide', qty: 1, unit: 'flacon', pitchTempC: 20 };
        window.__hopQa.seedRecipe(next);
        return { id: next.id, name: next.name, profileId, activatorStockRef, mediumStockRef, grainStockRef,
          recipeHasSyntheticGrainAndYeastOnly: true, stocksAreSynthetic: true };
      }, { activatorProduct, activatorStockRef, mediumStockRef, grainStockRef });
      manifest.preJ0Fixture = recipe;

      await openRecipeEditor(page, recipe.name);
      const adaptToQaEquipment = await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard button')]
        .find(button => button.getClientRects().length && button.textContent.trim().startsWith('Adapter à mon matériel actuel · Banc QA synthétique')),
      { timeout: 15000 });
      await adaptToQaEquipment.asElement().evaluate(element => element.scrollIntoView({ block: 'center' }));
      await adaptToQaEquipment.asElement().click();
      await page.waitForFunction(() => document.querySelector('.recipe-wizard')?.innerText.includes('Recette adaptée à 40 L'), { timeout: 15000 });
      await adaptToQaEquipment.dispose();
      await clickStep(page, 'Levure');
      const productRow = `.yp-products li[data-product="${activatorProduct}"]`;
      await page.waitForSelector(productRow, { visible: true, timeout: 15000 });
      const productText = await page.$eval(productRow, element => element.innerText);
      assert.match(productText, /Activator Smack Pack 125 mL/i);
      await clickSelector(page, `${productRow} button.yp-choose`);
      await page.waitForSelector('.yp-chosen', { visible: true, timeout: 15000 });
      await clickTextIn(page, '.yp-lot', 'Associer un lot de mon stock');
      await page.select('.yp-lot select', recipe.activatorStockRef);
      await clickTextIn(page, '.yp-lot', 'Associer ce lot');
      await page.waitForFunction(() => document.querySelector('.yp-lot')?.getAttribute('data-lot') === 'confirmed', { timeout: 15000 });
      assert.equal(await page.$eval('.yp-lot', element => element.getAttribute('data-lot')), 'confirmed');

      await clickTextIn(page, '.yp-wort', 'Saisir une mesure ou une hypothèse');
      await page.locator('[aria-label="Volume du moût à ensemencer en litres"]').fill('40');
      await clickTextIn(page, '[aria-label="Nature du volume"]', 'Mesuré', '[role="radio"]');
      await page.locator('[aria-label="Densité du moût à ensemencer en SG"]').fill('1.050');
      await clickTextIn(page, '[aria-label="Nature de la densité"]', 'Mesuré', '[role="radio"]');

      const preparationSelector = '.yp-prep';
      await page.waitForSelector(`${preparationSelector}[data-preparation="missing"]`, { visible: true, timeout: 15000 });
      const targetTimes = await page.evaluate(() => {
        const localInput = at => {
          const pad = value => String(value).padStart(2, '0');
          return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
        };
        const pitch = new Date(Date.now() + 8 * 86400000); pitch.setHours(12, 0, 0, 0);
        const start = new Date(pitch.getTime() - 48 * 3600000);
        return { targetPitchAt: localInput(pitch), startAt: localInput(start), targetDate: localInput(pitch).slice(0, 10) };
      });
      await clickTextIn(page, preparationSelector, 'Planifier la préparation');
      const prepDates = `${preparationSelector} input[type="datetime-local"]`;
      await setDateTimeValue(page, prepDates, targetTimes.targetPitchAt, 0);
      await setDateTimeValue(page, prepDates, targetTimes.startAt, 1);
      await page.locator(`${preparationSelector} [aria-label="Volume de starter retenu en litres"]`).fill('1');
      await page.locator(`${preparationSelector} input[id$="-inoculum"]`).fill('1 Activator du même produit');
      await page.locator(`${preparationSelector} input[id$="-equipment"]`).fill('Fiole 2 L avec agitateur · fixture QA');
      await clickTextIn(page, preparationSelector, 'Planifier');
      await page.waitForFunction(() => document.querySelector('.yp-prep')?.getAttribute('data-preparation') === 'planned', { timeout: 15000 });
      const plannedStateText = await page.$eval('.yp-prep .yp-plan-state', element => element.innerText);
      assert.match(plannedStateText, /Début .*choisi/);
      assert.match(plannedStateText, /Starter 1 L · inoculum : 1 Activator du même produit · matériel : Fiole 2 L avec agitateur · fixture QA · révision 1/);
      const manualMarginHours = await page.evaluate(({ targetPitchAt, startAt }) =>
        (Date.parse(targetPitchAt) - Date.parse(startAt)) / 3600000, targetTimes);
      assert.equal(manualMarginHours, 48, 'Le début choisi garde 12 h de marge au-delà de la fenêtre maximale publiée de 36 h.');

      // The too-close replacement must fail without altering the saved manual plan.
      await clickTextIn(page, preparationSelector, 'Corriger ou remplacer');
      const tooSoon = await page.evaluate(() => {
        const at = new Date(Date.now() + 12 * 3600000), pad = value => String(value).padStart(2, '0');
        return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
      });
      await setDateTimeValue(page, prepDates, tooSoon, 0);
      await clickTextIn(page, preparationSelector, 'Enregistrer la nouvelle révision');
      await page.waitForSelector(`${preparationSelector} [role="alert"]`, { visible: true, timeout: 10000 });
      const deadlineError = await page.$eval(`${preparationSelector} [role="alert"]`, element => element.innerText);
      assert.match(deadlineError, /Échéance trop proche/i);
      assert.equal(await page.$eval('.yp-prep .yp-plan-state', element => element.innerText), plannedStateText,
        'Le refus ne change pas le plan manuel conservé dans le brouillon du Wizard.');
      await captureReview(page, 1280, 900, 'prej0-plan-echeance-trop-proche-refusee-1280x900-apres', preparationSelector);
      await clickTextIn(page, preparationSelector, 'Fermer sans changer');
      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.preparation?.status === 'planned',
        { timeout: 20000 }, recipe.id);
      const savedPlan = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.preparation, recipe.id);
      assert.deepEqual({ revision: savedPlan.revision, startBasis: savedPlan.startBasis, status: savedPlan.status,
        volumeL: savedPlan.volumeL, inoculum: savedPlan.inoculum, equipment: savedPlan.equipment },
      { revision: 1, startBasis: 'manual', status: 'planned', volumeL: 1,
        inoculum: '1 Activator du même produit', equipment: 'Fiole 2 L avec agitateur · fixture QA' });
      assert.equal((Date.parse(savedPlan.targetPitchAt) - Date.parse(savedPlan.startAt)) / 3600000, manualMarginHours);

      // Create the actual planned batch through the app action; its snapshot must include the saved plan.
      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await clickSelector(page, `[aria-label=${JSON.stringify(`Ouvrir la recette ${recipe.name}`)}]`);
      await page.waitForSelector('[aria-label="Modifier la recette"]', { visible: true, timeout: 15000 });
      await clickTextIn(page, 'body', 'Préparer un brassin');
      await page.waitForSelector('[aria-label="Recette à brasser"]', { visible: true, timeout: 15000 });
      await page.select('[aria-label="Recette à brasser"]', recipe.id);
      await clickTextIn(page, '[aria-label="Quand brasser ?"]', 'Autre date', '[role="radio"]');
      await setDateTimeValue(page, 'input[type="date"]', targetTimes.targetDate);
      assert.equal(await page.$eval('input[type="date"]', element => element.value), targetTimes.targetDate);
      const plannedBatchButton = await page.$eval('button', (_, selector) => {
        const button = [...document.querySelectorAll(selector)].find(element => element.textContent.trim() === 'Créer le brassin à brasser');
        return button ? { disabled: button.disabled, label: button.textContent.trim(),
          recipeId: document.querySelector('[aria-label="Recette à brasser"]')?.value,
          volume: [...document.querySelectorAll('input')].map(input => ({ label: input.getAttribute('aria-label'), value: input.value })).find(input => input.value === '40'),
          date: document.querySelector('input[type="date"]')?.value,
          scheduleGroupDisabled: document.querySelector('[aria-label="Quand brasser ?"]')?.closest('fieldset')?.disabled } : null;
      }, 'button');
      assert.equal(plannedBatchButton?.disabled, false, `Bouton de brassin désactivé malgré le plan valide : ${JSON.stringify(plannedBatchButton)}`);
      await clickTextIn(page, 'body', 'Créer le brassin à brasser');
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().some(item => item.recipeRef === id), { timeout: 20000 }, recipe.id);
      const batch = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.recipeRef === id), recipe.id);
      const targetParts = targetTimes.targetDate.split('-');
      const targetSwiss = `${targetParts[2]}.${targetParts[1]}.${targetParts[0]}`;
      assert.equal(batch.status, 'planifie');
      assert.equal(batch.plannedBrewDate, targetSwiss);
      assert.equal(batch.brewDay, undefined, 'Créer un brassin planifié n’a pas commencé le brassage.');
      assert.equal(batch.recipeSnapshot.yeast.qty, 1);
      assert.equal(batch.recipeSnapshot.yeast.unit, 'flacon');
      assert.equal(batch.recipeSnapshot.yeast.pitching.preparation.id, savedPlan.id);
      assert.equal(batch.recipeSnapshot.yeast.pitching.preparation.startBasis, 'manual');
      const batchId = batch.id;
      const batchSelector = `[aria-label=${JSON.stringify(`Ouvrir le brassin ${batchId}`)}]`;

      const openBatchList = async () => {
        await page.waitForFunction(() => window.__hopQa?.ready(), { timeout: 15000 });
        await page.evaluate(() => {
          history.replaceState(null, '', location.pathname);
          window.__hopQa.storage.setUiState('app_active_tab', 'production');
          window.__hopQa.storage.setUiState('production_subtab', 'batches');
          window.__hopQa.storage.setUiState('app_global_time_filter', 'all');
        });
        await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        const currentPeriod = await page.evaluate(() => [...document.querySelectorAll('button[aria-expanded]')]
          .find(button => button.textContent.trim().startsWith('Ce mois') || button.textContent.trim() === "Tout l'historique")?.textContent.trim());
        if (currentPeriod !== "Tout l'historique") {
          const periodButton = await page.waitForFunction(() => [...document.querySelectorAll('button[aria-expanded]')]
            .find(button => button.textContent.trim().startsWith('Ce mois')));
          await periodButton.asElement().click();
          await clickTextIn(page, 'body', "Tout l'historique");
        }
        const batchList = await page.$('[aria-label="Liste des brassins"]');
        if (batchList) await batchList.dispose();
        else await clickSelector(page, '[aria-label="Atelier de brassage"] button[aria-label^="Brassins"]');
        await page.waitForSelector('[aria-label="Liste des brassins"]', { visible: true, timeout: 15000 });
        await page.waitForSelector(batchSelector, { visible: true, timeout: 15000 });
      };
      const openBatchPanel = async () => {
        await openBatchList();
        await clickSelector(page, batchSelector);
        await page.waitForSelector('section[aria-label="Préparation de levure"]', { visible: true, timeout: 15000 });
      };
      await openBatchPanel();
      const savedSnapshot = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id), batchId);
      assert.deepEqual({ status: savedSnapshot.status, scheduled: savedSnapshot.plannedBrewDate,
        planId: savedSnapshot.recipeSnapshot.yeast.pitching.preparation.id,
        startBasis: savedSnapshot.recipeSnapshot.yeast.pitching.preparation.startBasis },
      { status: 'planifie', scheduled: targetSwiss, planId: savedPlan.id, startBasis: 'manual' });
      const plannedPanel = await page.$eval('section[aria-label="Préparation de levure"]', element => element.innerText);
      assert.match(plannedPanel, /Début choisi/);
      assert.match(plannedPanel, /Culture prévue ·? ?1 L|Culture prévue\s*1 L|Prévu · Culture 1 L/i);
      assert.match(plannedPanel, /SG cible 1[,.]040/);
      const noticeSelector = 'section[aria-label="Préparation de levure"] details';
      assert.equal(await page.$eval(noticeSelector, element => element.open), false,
        'La notice complète reste repliée par défaut ; état, plan et geste utile restent visibles.');
      assert.match(await page.$eval(`${noticeSelector} summary`, element => element.innerText), /Notice et étapes complètes/);
      await captureReview(page, 1280, 900, 'prej0-activator-brassin-planifie-1280x900-apres', 'section[aria-label="Préparation de levure"]');
      await page.$eval(`${noticeSelector} summary`, element => element.click());
      const plannedNotice = await page.$eval(noticeSelector, element => element.innerText);
      assert.match(plannedNotice, /Cellules obtenues : inconnues/);
      assert.match(plannedNotice, /100 g/i);
      assert.ok(plannedNotice.includes(savedPlan.protocol.source.title), 'La disclosure expose la source enregistrée du protocole.');
      await captureReview(page, 1280, 900, 'prej0-activator-notice-ouverte-1280x900-apres', noticeSelector);
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await openBatchPanel();
      await captureReview(page, 390, 844, 'prej0-activator-brassin-planifie-390x844-apres', 'section[aria-label="Préparation de levure"]');
      await page.$eval(`${noticeSelector} summary`, element => element.click());
      assert.match(await page.$eval(noticeSelector, element => element.innerText), /Cellules obtenues : inconnues/);
      await captureReview(page, 390, 844, 'prej0-activator-notice-ouverte-390x844-apres', noticeSelector);
      const noticeTail = await page.$eval(noticeSelector, details => {
        let scroller = details.parentElement;
        while (scroller && !['auto', 'scroll'].includes(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
        if (!scroller) return null;
        scroller.scrollTop = scroller.scrollHeight;
        const source = [...details.querySelectorAll('a, p')].find(element => element.textContent.trim().startsWith('Source ·'));
        const bounds = source?.getBoundingClientRect();
        return { scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight, scrollTop: scroller.scrollTop,
          sourceVisible: !!bounds && bounds.top < innerHeight && bounds.bottom > 0,
          sourceTitle: source?.textContent.trim() ?? '' };
      });
      assert.ok(noticeTail && noticeTail.scrollHeight > noticeTail.clientHeight && noticeTail.scrollTop > 0,
        'La notice mobile reste parcourable jusqu’à ses dernières étapes et sa source.');
      assert.equal(noticeTail.sourceVisible, true, 'La source reste accessible après défilement de la notice mobile.');
      manifest.preJ0MobileDisclosureTail = noticeTail;
      await captureReview(page, 390, 844, 'prej0-activator-notice-fin-390x844-apres');
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
      await openBatchPanel();

      // Read the persisted plan at its chosen start time; no sleep or remote clock is used.
      const startAt = Date.parse(savedPlan.startAt), targetAt = Date.parse(savedPlan.targetPitchAt);
      await installQaClock(page, startAt + 1000);
      await openBatchPanel();
      assert.match(await page.$eval('section[aria-label="Préparation de levure"]', element => element.innerText), /À commencer maintenant/);
      const startPanel = 'section[aria-label="Préparation de levure"]';
      await page.locator('[aria-label="Quantité d’inoculum prélevée"]').fill('1');
      await page.select('[aria-label="Unité de l’inoculum prélevé"]', 'flacon');
      await page.select('[aria-label="Article de stock de l’inoculum"]', recipe.activatorStockRef);
      const beforeBeginStocks = await page.evaluate(({ activatorStockRef, mediumStockRef, grainStockRef }) => {
        const rows = window.__hopQa.storage.getStocks().rawMaterials;
        return { inoculum: rows.find(item => item.ref === activatorStockRef)?.currentStock,
          medium: rows.find(item => item.ref === mediumStockRef)?.currentStock,
          grain: rows.find(item => item.ref === grainStockRef)?.currentStock };
      }, recipe);
      assert.deepEqual(beforeBeginStocks, { inoculum: 2, medium: 2, grain: 10 });
      await clickTextIn(page, startPanel, 'Commencer la préparation du starter');
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation?.status === 'started',
        { timeout: 15000 }, batchId);
      let execution = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation, batchId);
      assert.deepEqual(execution.inoculumUsed, { amount: 1, unit: 'flacon', stockItemRef: recipe.activatorStockRef });
      assert.equal(execution.plan.id, savedPlan.id);
      assert.equal(execution.plan.revision, savedPlan.revision);
      assert.equal(execution.status, 'started');
      const stockAfterBegin = await page.evaluate(({ activatorStockRef, mediumStockRef, grainStockRef }) => {
        const rows = window.__hopQa.storage.getStocks().rawMaterials;
        return { inoculum: rows.find(item => item.ref === activatorStockRef)?.currentStock,
          medium: rows.find(item => item.ref === mediumStockRef)?.currentStock,
          grain: rows.find(item => item.ref === grainStockRef)?.currentStock };
      }, recipe);
      assert.deepEqual(stockAfterBegin, beforeBeginStocks, 'Le début du starter consigne le prélèvement, sans débit automatique.');
      const untimedSteps = savedPlan.steps.slice(0, -1);
      for (const step of untimedSteps) {
        const stepLabel = `Étape du starter : ${step.label}`;
        const handle = await page.waitForFunction(stepLabel => [...document.querySelectorAll('input[type="checkbox"][aria-label]')]
          .find(input => input.getAttribute('aria-label') === stepLabel && input.getClientRects().length),
        { timeout: 10000 }, stepLabel);
        await handle.asElement().click();
        await handle.dispose();
      }
      await page.waitForFunction(({ id, count }) => {
        const preparation = window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation;
        return preparation?.status === 'started' && preparation.steps.length === count;
      }, { timeout: 15000 }, { id: batchId, count: untimedSteps.length });
      await installQaClock(page, startAt + 2000);
      await openBatchPanel();
      execution = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation, batchId);
      assert.equal(execution.status, 'started');
      assert.equal(execution.steps.length, untimedSteps.length, 'Le journal local rouvre les étapes déjà consignées.');
      const startedPanel = await page.$eval(startPanel, element => element.innerText);
      assert.match(startedPanel, /Préparation commencée/);
      assert.match(startedPanel, new RegExp(`${untimedSteps.length}\/`));
      const prepStartedDesktop = await captureReview(page, 1280, 900, 'prej0-activator-demarre-1280x900-apres', startPanel);
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await openBatchPanel();
      const prepStartedMobile = await captureReview(page, 390, 844, 'prej0-activator-demarre-390x844-apres', startPanel);
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
      await openBatchPanel();

      // The transfer check is dated at J0; complete it only at that simulated local moment.
      await installQaClock(page, targetAt - 1000);
      await openBatchPanel();
      const transferStep = savedPlan.steps.at(-1);
      const transferLabel = `Étape du starter : ${transferStep.label}`;
      const transferCheckbox = await page.waitForFunction(stepLabel => [...document.querySelectorAll('input[type="checkbox"][aria-label]')]
        .find(input => input.getAttribute('aria-label') === stepLabel && input.getClientRects().length), { timeout: 10000 }, transferLabel);
      await transferCheckbox.asElement().click();
      await transferCheckbox.dispose();
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation?.status === 'ready',
        { timeout: 15000 }, batchId);
      execution = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation, batchId);
      assert.equal(execution.steps.length, savedPlan.steps.length);
      assert.equal(execution.plan.id, savedPlan.id);
      const preparationReady = await page.$eval(startPanel, element => element.innerText);
      assert.match(preparationReady, /Préparation prête/);
      assert.match(preparationReady, /100 g/i);
      const prepReadyDesktop = await captureReview(page, 1280, 900, 'prej0-activator-prete-a-j0-1280x900-apres', startPanel);
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await openBatchPanel();
      const prepReadyMobile = await captureReview(page, 390, 844, 'prej0-activator-prete-a-j0-390x844-apres', startPanel);
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
      await openBatchPanel();

      // Enter the real ensemencement phase and choose culture volume, not a pack dose.
      await openBatchList();
      await page.waitForSelector(batchSelector, { visible: true, timeout: 15000 });
      const brewButtonSelector = `[aria-label=${JSON.stringify(`Préparer le brassage · ${batchId}`)}]`;
      await clickSelector(page, brewButtonSelector);
      await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')].some(element =>
        element.querySelector('.brew-aide-title')?.textContent.includes('Wyeast 1056')), { timeout: 15000 });
      await clickSelector(page, 'nav[aria-label="Phases du brassage"] button[aria-label="Refroidir"]');
      const brewGuide = '.brew-aide';
      const yeastGuide = await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')].find(element =>
        element.querySelector('.brew-aide-title')?.textContent.includes('Wyeast 1056')), { timeout: 15000 });
      await yeastGuide.asElement().evaluate(element => {
        if (!element.open) element.querySelector('summary')?.click();
        element.scrollIntoView({ block: 'start' });
      });
      await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')].some(element => element.open
        && element.querySelector('.brew-aide-title')?.textContent.includes('Wyeast 1056')
        && element.innerText.includes('Culture du starter effectivement transférée')),
      { timeout: 15000 });
      const guideText = await yeastGuide.asElement().evaluate(element => element.innerText);
      assert.match(guideText, /Préparation prête/);
      assert.match(guideText, /Cellules obtenues : inconnues/);
      await clickTextIn(page, 'body', 'Commencer aujourd’hui');
      await page.waitForFunction(id => !!window.__hopQa.storage.getBatches().find(item => item.id === id)?.brewDay?.startedAt,
        { timeout: 15000 }, batchId);
      await clickTextIn(page, 'body', 'Terminer et continuer');
      await page.waitForFunction(() => document.body.innerText.includes('Étape 10 sur 10'), { timeout: 10000 });
      await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')].some(element =>
        element.querySelector('.brew-aide-title')?.textContent.includes('Wyeast 1056')
        && element.innerText.includes('Culture du starter effectivement transférée')), { timeout: 15000 });
      await clickSelector(page, 'nav[aria-label="Phases du brassage"] button[aria-label="Empâter"]');
      const grainAddition = '[aria-label="Ajouté : Fixture QA · Malt Pilsner"]';
      await page.waitForSelector(grainAddition, { visible: true, timeout: 15000 });
      await clickSelector(page, grainAddition);
      assert.equal(await page.$eval(grainAddition, element => element.checked), true,
        'Le malt synthétique de la recette est explicitement déclaré ajouté avant la clôture.');
      await clickSelector(page, 'nav[aria-label="Phases du brassage"] button[aria-label="Refroidir"]');
      await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')].some(element =>
        element.querySelector('.brew-aide-title')?.textContent.includes('Wyeast 1056')
        && element.innerText.includes('Culture du starter effectivement transférée')), { timeout: 15000 });
      await clickSelector(page, 'input[type="radio"][value="starter-transferred"]');
      await page.locator('[aria-label="Volume de starter réellement transféré"]').fill('1.2');
      await clickTextIn(page, 'body', 'J’ai ajouté la levure');
      await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 10000 });
      await clickTextIn(page, '[role="dialog"]', 'Confirmer la levure ajoutée');
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.status === 'fermentation',
        { timeout: 20000 }, batchId);
      const transferred = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id), batchId);
      assert.equal(transferred.yeastPreparation.status, 'transferred');
      assert.equal(transferred.yeastPreparation.cultureVolumeL, 1.2);
      assert.deepEqual({ amount: transferred.brewDay.additions.yeast.amount, unit: transferred.brewDay.additions.yeast.unit }, { amount: 1.2, unit: 'L' });
      assert.equal(transferred.brewDay.pitchQuantityConfirmation, 'starter-transferred');
      assert.equal(transferred.recipeSnapshot.yeast.qty, 1);
      assert.equal(transferred.recipeSnapshot.yeast.unit, 'flacon');
      assert.equal(transferred.stockConsumption, undefined, 'Le stock attend sa vérification de l’inoculum et du milieu.');
      assert.match((transferred.stockReviewIssues ?? []).join(' '), /Milieu du starter.*régulariser/i);
      const stockBeforeRegularization = await page.evaluate(({ activatorStockRef, mediumStockRef, grainStockRef }) => {
        const rows = window.__hopQa.storage.getStocks().rawMaterials;
        return { inoculum: rows.find(item => item.ref === activatorStockRef)?.currentStock,
          medium: rows.find(item => item.ref === mediumStockRef)?.currentStock,
          grain: rows.find(item => item.ref === grainStockRef)?.currentStock };
      }, recipe);
      assert.deepEqual(stockBeforeRegularization, { inoculum: 2, medium: 2, grain: 10 },
        'Le transfert de 1,2 L de culture ne débite pas le flacon d’inoculum ni le milieu sans comptage.');

      // Count the documented 100 g of DME from the 1 L starter, then retry the brew stock event once.
      await openBatchPanel();
      await page.waitForSelector('section[aria-label="Régularisation du stock du starter"]', { visible: true, timeout: 15000 });
      await page.select('[aria-label="Composant du starter à régulariser"]', 'medium');
      await page.select('[aria-label="Stock à régulariser"]', recipe.mediumStockRef);
      await clickTextIn(page, 'section[aria-label="Régularisation du stock du starter"]', 'Corriger l’inventaire');
      await page.waitForSelector('[aria-label="Stock réellement compté (kg)"]', { visible: true, timeout: 10000 });
      await page.locator('[aria-label="Stock réellement compté (kg)"]').fill('1.9');
      await clickTextIn(page, 'body', 'Enregistrer l’écart');
      await page.waitForFunction(({ ref }) => window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === ref)?.currentStock === 1.9,
        { timeout: 15000 }, { ref: recipe.mediumStockRef });
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation?.stockRegularization?.some(entry => entry.kind === 'medium'),
        { timeout: 15000 }, batchId);
      const countIdempotence = async (component, ref, unit, counted) => {
        await page.select('[aria-label="Composant du starter à régulariser"]', component);
        await page.select('[aria-label="Stock à régulariser"]', ref);
        await clickTextIn(page, 'section[aria-label="Régularisation du stock du starter"]', 'Corriger l’inventaire');
        await page.waitForSelector(`[aria-label="Stock réellement compté (${unit})"]`, { visible: true, timeout: 10000 });
        const countInput = `[aria-label="Stock réellement compté (${unit})"]`;
        assert.equal(await page.$eval(countInput, element => element.value), String(counted).replace('.', ','));
        const noDifference = await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"] button')]
          .find(button => button.textContent.trim() === 'Aucun écart'), { timeout: 10000 });
        assert.equal(await noDifference.asElement().evaluate(button => button.disabled), true);
        await noDifference.dispose();
        await clickTextIn(page, 'body', 'Annuler');
      };
      await countIdempotence('medium', recipe.mediumStockRef, 'kg', 1.9);
      await countIdempotence('inoculum', recipe.activatorStockRef, 'flacon', 2);
      const regularizedExecution = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation, batchId);
      assert(regularizedExecution.stockRegularization.some(entry => entry.kind === 'medium' && entry.stockItemRef === recipe.mediumStockRef));
      assert(!regularizedExecution.stockRegularization.some(entry => entry.kind === 'inoculum'),
        'L’inoculum reste consigné pour le débit réel unique au brassin.');
      await openBatchPanel();
      await page.waitForSelector('section[aria-label="Suivi du stock du brassin"]', { visible: true, timeout: 15000 });
      const reloadedRegularization = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.yeastPreparation?.stockRegularization, batchId);
      assert(reloadedRegularization.some(entry => entry.kind === 'medium' && entry.stockItemRef === recipe.mediumStockRef),
        'La régularisation du milieu survit à la réouverture hors ligne avant la seconde tentative.');
      await clickTextIn(page, '[aria-label="Suivi du stock du brassin"]', 'Revérifier et déstocker');
      const stockRetryDiagnostic = await page.evaluate(id => {
        const storage = window.__hopQa.storage, before = storage.getBatches().find(item => item.id === id);
        const result = storage.completeBrewStock(before);
        const after = storage.getBatches().find(item => item.id === id);
        return { result, preparation: after.yeastPreparation, stockConsumption: after.stockConsumption,
          stockReviewIssues: after.stockReviewIssues };
      }, batchId);
      assert.equal(stockRetryDiagnostic.result.success, true, `Le débit local réessayé après comptage doit réussir : ${JSON.stringify(stockRetryDiagnostic)}`);
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().find(item => item.id === id)?.stockConsumption?.completedStages?.includes('brewday'),
        { timeout: 15000 }, batchId);
      let stockResult = await page.evaluate(({ batchId, activatorStockRef, mediumStockRef, grainStockRef }) => ({
        batch: window.__hopQa.storage.getBatches().find(item => item.id === batchId),
        inoculumStock: window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === activatorStockRef)?.currentStock,
        mediumStock: window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === mediumStockRef)?.currentStock,
        grainStock: window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === grainStockRef)?.currentStock,
      }), { batchId, activatorStockRef: recipe.activatorStockRef, mediumStockRef: recipe.mediumStockRef, grainStockRef: recipe.grainStockRef });
      assert.equal(stockResult.inoculumStock, 1);
      assert.equal(stockResult.mediumStock, 1.9);
      const inoculumDebit = stockResult.batch.stockConsumption.items.find(item => item.stockItemRef === recipe.activatorStockRef);
      const grainDebit = stockResult.batch.stockConsumption.items.find(item => item.stockItemRef === recipe.grainStockRef);
      assert.deepEqual(inoculumDebit, { stockItemRef: recipe.activatorStockRef, quantity: 1, unit: 'flacon' });
      assert.equal(grainDebit?.unit, 'kg');
      assert(grainDebit?.quantity > 0, 'La quantité de malt réellement prévue pour la fixture reste positive et sourcée dans le snapshot.');
      assert(Math.abs(stockResult.grainStock - (10 - grainDebit.quantity)) < 1e-6,
        'Le lot déduit exactement la quantité de grain qu’il a figée dans son snapshot.');
      assert.deepEqual([...stockResult.batch.stockConsumption.items].sort((a, b) => a.stockItemRef.localeCompare(b.stockItemRef)),
        [inoculumDebit, grainDebit].sort((a, b) => a.stockItemRef.localeCompare(b.stockItemRef)));
      assert.match(stockResult.batch.stockConsumption.eventId, new RegExp(`^BREW-STOCK-${batchId}-brewday$`));
      const repeatedDebit = await page.evaluate(id => {
        const storage = window.__hopQa.storage, batch = storage.getBatches().find(item => item.id === id);
        const before = storage.getStocks().rawMaterials.map(item => [item.ref, item.currentStock]);
        const result = storage.completeBrewStock(batch);
        const after = storage.getStocks().rawMaterials.map(item => [item.ref, item.currentStock]);
        const saved = storage.getBatches().find(item => item.id === id);
        return { result, before, after, eventId: saved.stockConsumption?.eventId, items: saved.stockConsumption?.items };
      }, batchId);
      assert.equal(repeatedDebit.result.success, true);
      assert.deepEqual(repeatedDebit.after, repeatedDebit.before, 'Une nouvelle confirmation ne débite aucun stock une seconde fois.');
      assert.equal(repeatedDebit.eventId, stockResult.batch.stockConsumption.eventId);
      assert.deepEqual(repeatedDebit.items, stockResult.batch.stockConsumption.items);

      // Edit the reusable recipe and its plan; the launched batch keeps its original snapshot and execution.
      await page.evaluate(() => {
        history.replaceState(null, '', location.pathname);
        window.__hopQa.storage.setUiState('app_active_tab', 'production');
        window.__hopQa.storage.setUiState('production_subtab', 'recipes');
      });
      await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, recipe.name);
      await clickStep(page, 'Levure');
      const revisionTimes = await page.evaluate(() => {
        const localInput = at => { const pad = value => String(value).padStart(2, '0');
          return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`; };
        const pitch = new Date(Date.now() + 8 * 86400000); pitch.setHours(12, 0, 0, 0);
        return { targetPitchAt: localInput(pitch), startAt: localInput(new Date(pitch.getTime() - 48 * 3600000)) };
      });
      await clickTextIn(page, preparationSelector, 'Corriger ou remplacer');
      await setDateTimeValue(page, prepDates, revisionTimes.targetPitchAt, 0);
      await setDateTimeValue(page, prepDates, revisionTimes.startAt, 1);
      const revisionVolumeInput = `${preparationSelector} [aria-label="Volume de starter retenu en litres"]`;
      await typeNumericInput(page, revisionVolumeInput, '1,2');
      assert.equal(await page.$eval(revisionVolumeInput, element => element.value), '1,2');
      await clickTextIn(page, preparationSelector, 'Enregistrer la nouvelle révision');
      await page.waitForFunction(() => document.querySelector('.yp-prep')?.getAttribute('data-preparation') === 'planned', { timeout: 15000 });
      assert.match(await page.$eval('.yp-prep .yp-plan-state', element => element.innerText), /Starter 1,2 L/);
      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 20000 });
      const editedRecipe = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(editedRecipe.yeast.qty, 1);
      assert.notEqual(editedRecipe.yeast.pitching.preparation.id, savedPlan.id);
      assert.equal(editedRecipe.yeast.pitching.preparation.revision, 2,
        `La nouvelle révision du plan n’a pas été enregistrée : ${JSON.stringify(editedRecipe.yeast.pitching.preparation)}`);
      assert.equal(editedRecipe.yeast.pitching.preparation.volumeL, 1.2);
      stockResult = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.id === id), batchId);
      assert.equal(stockResult.recipeSnapshot.yeast.qty, 1);
      assert.equal(stockResult.recipeSnapshot.yeast.pitching.preparation.id, savedPlan.id);
      assert.equal(stockResult.recipeSnapshot.yeast.pitching.preparation.volumeL, 1);
      assert.equal(stockResult.yeastPreparation.plan.id, savedPlan.id);
      assert.equal(stockResult.yeastPreparation.plan.revision, savedPlan.revision);
      assert.equal(stockResult.yeastPreparation.status, 'transferred');
      assert.equal(stockResult.yeastPreparation.cultureVolumeL, 1.2);
      await openBatchPanel();
      const reopenedBatchPanel = await page.$eval(startPanel, element => element.innerText);
      assert.match(reopenedBatchPanel, /Culture transférée/);
      assert.match(reopenedBatchPanel, /Volume réellement transféré : 1,2 L/);
      assert.match(reopenedBatchPanel, /À régulariser|Inventaire corrigé/);
      const finalStock = await page.evaluate(({ batchId, activatorStockRef, mediumStockRef, grainStockRef }) => {
        const storage = window.__hopQa.storage, saved = storage.getBatches().find(item => item.id === batchId);
        const raw = storage.getStocks().rawMaterials;
        return { eventId: saved.stockConsumption?.eventId, items: saved.stockConsumption?.items,
          inoculumStock: raw.find(item => item.ref === activatorStockRef)?.currentStock,
          mediumStock: raw.find(item => item.ref === mediumStockRef)?.currentStock,
          grainStock: raw.find(item => item.ref === grainStockRef)?.currentStock };
      }, { batchId, activatorStockRef: recipe.activatorStockRef, mediumStockRef: recipe.mediumStockRef, grainStockRef: recipe.grainStockRef });
      const finalDesktop = await captureReview(page, 1280, 900, 'prej0-activator-apres-transfert-et-plan-modifie-1280x900-apres', startPanel);
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await openBatchPanel();
      const finalMobile = await captureReview(page, 390, 844, 'prej0-activator-apres-transfert-et-plan-modifie-390x844-apres', startPanel);
      assert.deepEqual(remoteRequests, [], 'Le parcours pré-J0 ne fait aucune requête externe.');
      assert.deepEqual(pageErrors, [], 'Aucune erreur JavaScript pendant le parcours pré-J0.');
      assert.deepEqual(consoleErrors, [], 'Aucune erreur/alerte console pendant le parcours pré-J0.');
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity'].includes(call)), [],
        'Aucun appel AI/Firestore réel n’est utilisé par cette fixture locale.');
      const result = { label: 'pre-j0-activator', fixture: recipe, batchId, schedule: targetSwiss,
        productId: activatorProduct, productText, plan: savedPlan,
        manualMarginHours: (targetAt - startAt) / 3600000 - savedPlan.protocol.leadHours.max,
        nearDeadlineRefused: deadlineError, snapshotAndExecutionPlanStayedFrozen: true,
        preparation: { startedBeforePitch: true, stepCountBeforeJ0: untimedSteps.length,
          completedAtJ0: execution.steps.length === savedPlan.steps.length, firstStoredInoculum: execution.inoculumUsed },
        transfer: { cultureVolumeL: 1.2, brewDayAddition: { amount: 1.2, unit: 'L' },
          recipePackQuantityNotTransferred: stockResult.recipeSnapshot.yeast.qty },
        stock: { initial: { activatorFlacons: 2, maltExtractKg: 2, pilsnerKg: 10 }, afterBegin: stockAfterBegin,
          afterExplicitMediumCount: { mediumKg: 1.9 }, afterBrewdayDebit: finalStock,
          repeatedCountDisabledAtNoDelta: true, repeatedBrewDebitUnchanged: true, stockRetryDiagnostic },
        subsequentRecipeRevision: { quantity: editedRecipe.yeast.qty, revision: editedRecipe.yeast.pitching.preparation.revision,
          originalBatchPlanId: savedPlan.id, updatedRecipePlanId: editedRecipe.yeast.pitching.preparation.id },
        screenshots: { planned1280: true, planned390: true, started1280: !!prepStartedDesktop, started390: !!prepStartedMobile,
          ready1280: !!prepReadyDesktop, ready390: !!prepReadyMobile, transferred1280: !!finalDesktop, transferred390: !!finalMobile },
        calls, remoteRequests, pageErrors, consoleErrors };
      return result;
    };
    const runPreJ0LateScenario = async (page, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const fixture = await page.evaluate(product => {
        const storage = window.__hopQa.storage;
        const stockItemRef = 'qa-prej0-late-activator-flacon';
        storage.addStockItem('rawMaterials', { id: stockItemRef, ref: stockItemRef, name: 'Fixture QA · Wyeast 1056 Activator',
          category: 'Levure', unit: 'flacon', currentStock: 2, minStock: 0, reorder: false,
          yeastLot: { productId: product.id, lotNumber: 'QA-LATE-1056' } });
        const seed = storage.getRecipes().find(item => item.name === 'Weissbier de contrôle');
        if (!seed) throw Error('La fixture locale Weissbier de contrôle manque.');
        const recipe = structuredClone(seed);
        recipe.id = 'QA-YEAST-PREJ0-LATE-ACTIVATOR';
        recipe.name = 'QA · Activator limite tardive';
        recipe.style = 'American Pale Ale';
        recipe.styleRef = undefined;
        recipe.yeastDesign = undefined;
        recipe.yeastGuide = undefined;
        recipe.yeast = { name: 'Wyeast 1056 American Ale', lab: 'Wyeast Laboratories', strain: '1056 American Ale',
          hopIndexId: 'wyeast-1056', form: 'liquide', qty: 1, unit: 'flacon', stockItemRef, pitchTempC: 20,
          pitching: { version: 1, product: structuredClone(product), lot: { productId: product.id, lotNumber: 'QA-LATE-1056' },
            wort: { basis: 'measured', volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' } } };
        recipe.hops = []; recipe.adjuncts = []; recipe.fermentables = structuredClone(seed.fermentables.slice(0, 1));
        recipe.volumeL = 40; recipe.ogTarget = 1.05; recipe.totalGristKg = recipe.fermentables.reduce((sum, row) => sum + row.weightKg, 0);
        window.__hopQa.seedRecipe(recipe);
        const localNow = Date.now();
        const target = new Date(localNow + 6 * 3600000);
        const pad = value => String(value).padStart(2, '0');
        const targetPitchAt = target.toISOString();
        const targetDate = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
        const startAt = new Date(target.getTime() - 48 * 3600000).toISOString();
        const context = JSON.stringify([recipe.yeast.hopIndexId, recipe.yeast.form, recipe.yeast.stockItemRef,
          recipe.yeast.pitching.product, recipe.yeast.pitching.lot, recipe.yeast.pitching.wort, recipe.yeast.pitching.rate], (_key, entry) =>
          entry && typeof entry === 'object' && !Array.isArray(entry)
            ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
        const plan = { id: 'QA-LATE-PREPARATION-PLAN', revision: 1, productId: product.id, stockItemRef,
          context, protocol: structuredClone(product.starter), volumeL: 1, inoculum: '1 Activator du même produit',
          equipment: 'Fiole 2 L avec agitateur · fixture QA', targetPitchAt, startAt, startBasis: 'manual', status: 'planned',
          note: 'Fixture QA : plan déjà créé au-delà de la fenêtre publiée; le test ne garantit pas la viabilité.',
          steps: product.starter.steps.map((step, index) => ({ id: `late-step-${index}`, label: step,
            ...(index === product.starter.steps.length - 1 ? { dueAt: targetPitchAt } : {}) })) };
        recipe.yeast.pitching.preparation = plan;
        window.__hopQa.seedRecipe(recipe);
        const lateBatchId = 'QA-LOT-PREJ0-TOO-LATE';
        const startedBatchId = 'QA-LOT-PREJ0-ALREADY-STARTED';
        const lateBatch = storage.planRecipeBatch(recipe, lateBatchId, targetDate);
        const startedBatch = storage.planRecipeBatch(recipe, startedBatchId, targetDate);
        const startedAt = Date.parse(startAt) + 3600000;
        const started = { ...startedBatch, yeastPreparation: { plan: structuredClone(plan), status: 'started', startedAt,
          steps: [{ id: plan.steps[0].id, at: startedAt + 1800000 }],
          inoculumUsed: { amount: 1, unit: 'flacon', stockItemRef } } };
        storage.updateBatch(started);
        storage.setUiState('app_active_tab', 'production');
        storage.setUiState('production_subtab', 'batches');
        storage.setUiState('app_global_time_filter', 'all');
        return { recipeId: recipe.id, productId: product.id, stockItemRef, targetPitchAt, startAt, targetDate,
          targetAt: Date.parse(targetPitchAt), lateBatchId, startedBatchId,
          lateBatch: storage.getBatches().find(item => item.id === lateBatchId), startedBatch: storage.getBatches().find(item => item.id === startedBatchId),
          stockBefore: storage.getStocks().rawMaterials.find(item => item.ref === stockItemRef)?.currentStock };
      }, qaLateActivatorProduct);
      assert.equal(fixture.stockBefore, 2);
      assert.equal(fixture.lateBatch.status, 'planifie');
      assert.equal(fixture.startedBatch.status, 'planifie');
      assert.equal(fixture.startedBatch.yeastPreparation.steps.length, 1);
      const lateNow = fixture.targetAt - 6 * 3600000;
      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await installQaClock(page, lateNow);
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      const storedLateBatchIds = await page.evaluate(() => window.__hopQa.storage.getBatches().map(item => item.id));
      if (!storedLateBatchIds.includes(fixture.lateBatchId) || !storedLateBatchIds.includes(fixture.startedBatchId))
        throw Error(`Banc pré-J0 tardif : brassins perdus au rechargement. Avant=${JSON.stringify([fixture.lateBatchId, fixture.startedBatchId])} Après=${JSON.stringify(storedLateBatchIds)}`);

      const openBatchPanel = async batchId => {
        await page.evaluate(() => {
          history.replaceState(null, '', location.pathname);
          window.__hopQa.storage.setUiState('app_active_tab', 'production');
          window.__hopQa.storage.setUiState('production_subtab', 'batches');
          window.__hopQa.storage.setUiState('app_global_time_filter', 'all');
        });
        await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        const currentPeriod = await page.evaluate(() => [...document.querySelectorAll('button[aria-expanded]')]
          .find(button => button.textContent.trim().startsWith('Ce mois') || button.textContent.trim() === "Tout l'historique")?.textContent.trim());
        if (currentPeriod !== "Tout l'historique") {
          const periodButton = await page.waitForFunction(() => [...document.querySelectorAll('button[aria-expanded]')]
            .find(button => button.textContent.trim().startsWith('Ce mois')));
          await periodButton.asElement().click();
          await clickTextIn(page, 'body', "Tout l'historique");
        }
        if (!await page.$('[aria-label="Liste des brassins"]')) await clickSelector(page, '[aria-label="Atelier de brassage"] button[aria-label^="Brassins"]');
        const selector = `[aria-label=${JSON.stringify(`Ouvrir le brassin ${batchId}`)}]`;
        await page.waitForSelector(selector, { visible: true, timeout: 15000 });
        await clickSelector(page, selector);
        await page.waitForSelector('section[aria-label="Préparation de levure"]', { visible: true, timeout: 15000 });
      };

      await openBatchPanel(fixture.lateBatchId);
      const lateText = await page.$eval('section[aria-label="Préparation de levure"]', element => element.innerText);
      assert.match(lateText, /Trop tard pour démarrer · replanifier/);
      assert.match(lateText, /Il reste 6 h avant l’ensemencement cible/);
      assert.match(lateText, /sous le minimum publié de 24 h/);
      assert.match(lateText, /Cette borne n’est pas une garantie de viabilité/);
      assert.equal(await page.$$eval('section[aria-label="Préparation de levure"] button', buttons =>
        buttons.filter(button => button.textContent.includes('Commencer la préparation du starter')).length), 0,
      'Le brassin planifié dont la fenêtre est sous le minimum documenté ne propose pas de démarrage.');
      await captureReview(page, width, height, `prej0-trop-tard-sans-demarrage-${label}-apres`, 'section[aria-label="Préparation de levure"]');

      await openBatchPanel(fixture.startedBatchId);
      const startedPanelText = await page.$eval('section[aria-label="Préparation de levure"]', element => element.innerText);
      assert.match(startedPanelText, /Préparation commencée/);
      assert.match(startedPanelText, /1\/6 étapes consignées · à poursuivre/);
      assert.match(startedPanelText, /Inoculum consigné · 1 flacon · qa-prej0-late-activator-flacon/);
      assert.doesNotMatch(startedPanelText, /Ne démarre pas ce plan à ce stade/,
        'La garde tardive bloque un premier départ, sans effacer ni réécrire une exécution commencée.');
      const startedDesktopOrMobile = await captureReview(page, width, height, `prej0-execution-deja-commencee-${label}-apres`, 'section[aria-label="Préparation de levure"]');
      const afterRender = await page.evaluate(({ startedBatchId, lateBatchId, stockItemRef }) => {
        const storage = window.__hopQa.storage;
        const started = storage.getBatches().find(item => item.id === startedBatchId);
        const late = storage.getBatches().find(item => item.id === lateBatchId);
        return { startedPreparation: started?.yeastPreparation, latePreparation: late?.recipeSnapshot?.yeast?.pitching?.preparation,
          stock: storage.getStocks().rawMaterials.find(item => item.ref === stockItemRef)?.currentStock };
      }, fixture);
      assert.deepEqual(afterRender.startedPreparation.steps, fixture.startedBatch.yeastPreparation.steps);
      assert.deepEqual(afterRender.startedPreparation.inoculumUsed, fixture.startedBatch.yeastPreparation.inoculumUsed);
      assert.equal(afterRender.startedPreparation.status, 'started');
      assert.equal(afterRender.latePreparation.startAt, fixture.lateBatch.recipeSnapshot.yeast.pitching.preparation.startAt);
      assert.equal(afterRender.stock, fixture.stockBefore, 'L’ouverture des deux vues ne régularise ni ne débite le stock.');
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation'].includes(call)), [],
        'Le rejeu pré-J0 n’utilise aucune callable distante/IA.');
      assert.deepEqual(remoteRequests, [], `${label}: aucune requête externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune erreur JavaScript.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
      return { label, fixture: { recipeId: fixture.recipeId, productId: fixture.productId, plan: fixture.lateBatch.recipeSnapshot.yeast.pitching.preparation,
          stockBefore: fixture.stockBefore, lateBatchId: fixture.lateBatchId, startedBatchId: fixture.startedBatchId },
        lateStateText: lateText, startActionAbsent: true, startedExecutionPreserved: afterRender.startedPreparation,
        stockAfterRender: afterRender.stock, screenshots: [
          `prej0-trop-tard-sans-demarrage-${label}-apres`, `prej0-execution-deja-commencee-${label}-apres`
        ], calls, remoteRequests, pageErrors, consoleErrors, capturedViewport: startedDesktopOrMobile.viewport };
    };
    const runM20SourceScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      await page.locator('[aria-label="Chercher une autre levure"]').fill('M20');
      const m20Id = 'yeast-mangrove-jacks-132040951';
      await page.waitForSelector(`.yc-list li[data-candidate-id="${m20Id}"]`, { visible: true, timeout: 15000 });
      await clickSelector(page, `.yc-list li[data-candidate-id="${m20Id}"] button[data-choose="${m20Id}"]`);
      await page.waitForFunction(() => document.querySelector('.yc-strain-station')?.innerText.includes('M20 · Bavarian Wheat'),
        { timeout: 15000 });
      assert.equal(await page.$eval('.yc-strain-station', element => element.getAttribute('aria-label')), 'Levure de la recette');
      const recipeSheet = '.yc-sheet-fold[data-sheet-scope="recipe"]';
      await openDisclosure(page, recipeSheet);
      await page.waitForSelector(`${recipeSheet} .yc-dossier-fields[data-sheet-scope="recipe"]`, { visible: true, timeout: 10000 });
      const observations = `${recipeSheet} details[aria-label="Données documentaires conservées"]`;
      await openDisclosure(page, observations);
      const temperatures = await page.$$eval(`${observations} [data-observation="temperature"]`, elements => elements.map(element => element.innerText));
      assert.equal(temperatures.length, 2, `Les deux observations brutes restent distinctes : ${JSON.stringify(temperatures)}`);
      assert(temperatures.every(text => /18–30 °C/.test(text)));
      const craftSeries = temperatures.find(text => text.includes('Craft Series — Brewers Yeasts, M20'));
      const yeastRange = temperatures.find(text => text.includes('Yeast Range, version 10'));
      assert(craftSeries, `La fiche Craft Series reste nommée : ${JSON.stringify(temperatures)}`);
      assert(yeastRange, `La fiche Yeast Range reste nommée : ${JSON.stringify(temperatures)}`);
      assert.match(craftSeries, /contexte non indiqué/);
      assert.match(yeastRange, /contexte Beer/);
      const citationSummary = await page.$eval(observations, element => ({
        count: element.querySelectorAll('.yc-citations a').length,
        links: [...element.querySelectorAll('.yc-citations a')].map(link => ({ href: link.href, title: link.textContent.trim() })),
        visible: element.innerText
      }));
      const sharedPdfLinks = citationSummary.links.filter(link => link.href === 'https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785');
      assert.equal(sharedPdfLinks.length, 1, 'L’URL PDF commune est citée une seule fois malgré deux titres/contextes distincts.');
      assert.equal(citationSummary.count, 2, 'La page produit M20 et le PDF de gamme restent deux documents distincts.');
      assert(citationSummary.links.some(link => link.href === 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g'));
      await captureReview(page, width, height, `m20-sources-temperature-double-contexte-${label}-apres`, observations);
      await page.$eval(observations, element => {
        const rows = element.querySelectorAll('[data-observation="temperature"]');
        rows[rows.length - 1]?.scrollIntoView({ block: 'center' });
      });
      await captureReview(page, width, height, `m20-source-deuxieme-contexte-${label}-apres`);
      const currentDraft = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast, recipe.id);
      assert.equal(currentDraft.hopIndexId, 'wyeast-1007', 'La lecture directe de M20 ne change pas les observations ni la souche de la recette sauvegardée.');
      assert.deepEqual(remoteRequests, [], `${label}: aucune ressource distante chargée.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune erreur JavaScript.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation'].includes(call)), [],
        `${label}: fiche M20 locale uniquement, sans appel Gemini/DB.`);
      return { label, recipeId: recipe.id, selectedForReading: m20Id, savedReferenceUnchanged: true,
        temperatureObservations: temperatures, citationSummary, remoteRequests, pageErrors, consoleErrors, calls };
    };
    const runOfferProductContextScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const search = '[aria-label="Chercher une autre levure"]';
      await page.locator(search).fill('US-05');
      await page.waitForSelector('.yc-list li[data-candidate-id="fermentis-us05"]', { visible: true, timeout: 15000 });
      await clickSelector(page, '.yc-list li[data-candidate-id="fermentis-us05"] input[aria-label^="Comparer"]');
      await page.locator(search).fill('Verdant');
      await page.waitForSelector('.yc-list li[data-candidate-id="lalbrew-verdant-ipa"]', { visible: true, timeout: 15000 });
      await clickSelector(page, '.yc-list li[data-candidate-id="lalbrew-verdant-ipa"] input[aria-label^="Comparer"]');
      await clickSelector(page, '.yc-compare-open');
      await page.waitForSelector('[data-supply-comparison]', { visible: true, timeout: 15000 });
      const productIds = await page.$$eval('[data-supply-comparison] [data-supply-product]', rows => rows.map(row => row.getAttribute('data-supply-product')));
      assert.deepEqual(productIds, ['wyeast-1007-xl-unspecified', 'fermentis-us05-11_5g', 'lalbrew-verdant-11g']);
      const offerScroller = '[data-supply-comparison] .yc-compare-scroll[aria-label="Produits, formats, doses et offres"]';
      await captureReview(page, width, height, `offres-produits-contextes-${label}-avant-scroll-apres`, '.yc-supply-comparison');
      let horizontalProof;
      if (width === 390) {
        await page.$eval(offerScroller, element => { element.scrollLeft = 0; element.scrollIntoView({ block: 'center' }); });
        const scrollerRect = await page.$eval(offerScroller, element => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + Math.min(rect.height / 2, 120),
            clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, start: element.scrollLeft };
        });
        assert.equal(scrollerRect.start, 0);
        assert(scrollerRect.scrollWidth > scrollerRect.clientWidth, 'Les offres restent dans la zone horizontale dédiée sur mobile.');
        await page.mouse.move(scrollerRect.x, scrollerRect.y);
        await page.mouse.wheel({ deltaX: scrollerRect.scrollWidth, deltaY: 0 });
        await page.waitForFunction(selector => {
          const element = document.querySelector(selector);
          return element && element.scrollLeft > 0;
        }, { timeout: 5000 }, offerScroller);
        horizontalProof = await page.$eval(offerScroller, element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
          scrollLeft: element.scrollLeft, scrollEnd: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
          documentWidth: document.documentElement.scrollWidth }));
        assert.equal(horizontalProof.scrollEnd, true, 'Le geste horizontal atteint les offres à droite; aucun code ne revient ensuite à gauche.');
        assert.equal(horizontalProof.documentWidth, 390, 'Le scroll des offres ne crée pas un débordement de page.');
      }
      const readOfferProductContext = async (offerId, expected) => {
        const selector = `[data-supply-offer="${offerId}"] [data-offer-product-context]`;
        const context = await page.$eval(selector, element => {
          const rect = element.getBoundingClientRect(), scroller = element.closest('.yc-compare-scroll').getBoundingClientRect();
          return { text: element.innerText, left: rect.left, right: rect.right, viewportWidth: innerWidth,
            scrollerLeft: scroller.left, scrollerRight: scroller.right,
            visibleInOfferViewport: rect.left >= scroller.left - 1 && rect.right <= scroller.right + 1 };
        });
        assert.match(context.text, new RegExp(expected.manufacturer, 'i'));
        assert.match(context.text, new RegExp(expected.product, 'i'));
        assert.match(context.text, new RegExp(expected.format, 'i'));
        assert.equal(context.visibleInOfferViewport, true,
          `${offerId}: fabricant, produit et format restent visibles dans la colonne Offres sans revenir à gauche.`);
        return context;
      };
      const us05Context = await readOfferProductContext('brau-rauch-us05-he0102-20260927',
        { manufacturer: 'Fermentis', product: 'SafAle US-05', format: '11,5 g' });
      const verdantContext = await readOfferProductContext('brau-rauch-verdant-he2036-20260927',
        { manufacturer: 'Lallemand Brewing', product: 'Verdant IPA', format: '11 g' });
      if (width === 390) {
        const afterReadingBothOffers = await page.$eval(offerScroller, element => element.scrollLeft);
        assert.equal(afterReadingBothOffers, horizontalProof.scrollLeft,
          'La lecture des deux offres ne ramène pas le tableau à gauche après le geste.');
      }
      const afterScroll = await captureReview(page, width, height, `offres-produits-contextes-${label}-scroll-a-droite-apres`, '.yc-supply-comparison');
      assert.equal(afterScroll.horizontalOverflow, false);
      const currentReference = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast, recipe.id);
      assert.equal(currentReference.hopIndexId, 'wyeast-1007', 'La comparaison volontaire ne remplace pas le brouillon.');
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(remoteRequests, [], `${label}: aucun réseau externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune erreur JavaScript.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation'].includes(call)), [],
        `${label}: aucune callable IA/DB.`);
      return { label, recipeId: recipe.id, flow: 'comparison volontaire US-05 + Verdant puis scroll direct à Offres',
        comparedProductIds: productIds, horizontalProof, offerContexts: { us05Context, verdantContext },
        returnedToLeftAfterScroll: false, referenceUnchanged: true, calls, remoteRequests, pageErrors, consoleErrors };
    };
    const runManualSupplyScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const productScope = '[data-entry="product"]', offerScope = '[data-entry="offer"]';
      await page.waitForSelector('.yp-supply[data-product-state="none"] [data-product-empty]', { visible: true, timeout: 15000 });
      const emptyState = await page.$eval('.yp-supply', element => element.innerText);
      assert.match(emptyState, /Aucun produit exact relevé pour Wyeast 3068/);
      assert.match(emptyState, /format, dose fabricant, packs et offres restent inconnus/);
      await captureReview(page, width, height, `levure-3068-sans-produit-${label}-apres`, '.yp-supply');

      // Define an exact variant with unknown package format, then explicitly offer it to the local database.
      await clickTextIn(page, '.yp-supply', 'Définir le produit exact / format');
      await page.waitForSelector(productScope, { visible: true, timeout: 10000 });
      const productId = await page.$eval(productScope, element => element.getAttribute('data-entry-id'));
      await fillLabelledInput(page, productScope, 'Nom ou variante exacte', 'Wyeast 3068 · produit témoin sans format QA');
      assert.equal(await inputValueForLabel(page, productScope, 'Fabricant'), 'Wyeast',
        'Le fabricant déjà documenté de la référence est proposé comme champ modifiable, sans le recopier au test.');
      await selectLabelOption(page, productScope, 'Forme', 'liquide');
      await selectLabelOption(page, productScope, 'Format du conditionnement', 'unknown');
      await fillLabelledInput(page, productScope, 'Titre', 'Fiche produit exacte · fixture QA manuelle');
      await fillLabelledInput(page, productScope, 'Lien https', 'https://example.invalid/qa/wyeast-3068-format-inconnu');
      const productSourceDay = await page.evaluate(() => {
        const date = new Date(Date.now());
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      });
      await page.$eval(`${productScope} input[type="date"]`, (element, value) => {
        element.focus();
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }, productSourceDay);
      await page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.value === value,
        { timeout: 5000 }, { selector: `${productScope} input[type="date"]`, value: productSourceDay });
      assert.equal(await inputValueForLabel(page, productScope, 'Format du conditionnement'), 'unknown');
      const productSource = await page.$eval(`${productScope} fieldset.yp-entry-source`, element => element.innerText);
      assert.match(productSource, /Source saisie à la main/);
      assert(!/cellules|dose fabricant|starter/i.test(await page.$eval(productScope, element => element.innerText)),
        'Le formulaire produit n’invente ni dose, ni cellules, ni méthode.');
      await captureReview(page, width, height, `levure-3068-produit-manuel-inconnu-${label}-apres`, productScope);
      await clickTextIn(page, productScope, 'Retenir cette définition dans la recette');
      await page.waitForSelector('.yp-supply[data-product-state="chosen"] [data-product-copy="manual"]', { visible: true, timeout: 10000 });
      const chosenProductText = await page.$eval('.yp-chosen', element => element.innerText);
      assert.match(chosenProductText, /produit témoin sans format QA/);
      assert.match(await page.$eval(productScope, element => element.innerText), /Rien n’est publié dans la base|Cette action ne publie rien/i);
      assert.match(await page.$eval('.yp-supply', element => element.innerText), /Format non communiqué · packs inconnus/);
      assert.equal(await page.$eval('[aria-label^="Quantité de levure"]', element => element.value), '1');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'flacon');
      await clickTextIn(page, productScope, 'Fermer');

      // Manual local offer: unknown stock, delivery and price stay unknown; no purchase state is fabricated.
      await clickTextIn(page, '.yp-supply', 'Définir une offre');
      await page.waitForSelector(offerScope, { visible: true, timeout: 10000 });
      const localOfferId = await page.$eval(offerScope, element => element.getAttribute('data-entry-id'));
      await fillLabelledInput(page, offerScope, 'Vendeur', 'Marchand QA · relevé incomplet');
      await fillLabelledInput(page, offerScope, 'Lien https de la page exacte', 'https://example.invalid/qa/wyeast-3068-offre-locale');
      await fillLabelledInput(page, offerScope, 'Titre de la page', 'Page vendeur exacte · fixture QA locale');
      assert.equal(await inputValueForLabel(page, offerScope, 'État'), 'unknown');
      assert.match(await page.$eval(offerScope, element => element.innerText), /Aucun coût livré|non calculé/i);
      await clickTextIn(page, offerScope, 'Retenir cette offre dans la recette');
      await page.waitForSelector(`[data-offer="${localOfferId}"][data-retained]`, { visible: true, timeout: 10000 });
      assert.equal(await page.$eval(`[data-offer="${localOfferId}"]`, element => element.getAttribute('data-buyable')), 'false');
      assert.equal(await page.$eval('[aria-label^="Quantité de levure"]', element => element.value), '1');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'flacon');
      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(({ id, productId, localOfferId }) => {
        const yeast = window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast;
        return yeast?.pitching?.product?.id === productId && yeast.pitching.offer?.id === localOfferId;
      }, { timeout: 20000 }, { id: recipe.id, productId, localOfferId });
      let saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(saved.yeast.hopIndexId, 'wyeast-3068');
      assert.equal(saved.yeast.qty, 1);
      assert.equal(saved.yeast.unit, 'flacon');
      assert.deepEqual({ volume: saved.yeast.pitching.wort.volumeL, volumeBasis: saved.yeast.pitching.wort.volumeBasis,
        sg: saved.yeast.pitching.wort.sg, sgBasis: saved.yeast.pitching.wort.sgBasis },
      { volume: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' });
      assert.equal(saved.yeast.pitching.product.referenceId, 'wyeast-3068');
      assert.equal(saved.yeast.pitching.product.format, undefined);
      assert.equal(saved.yeast.pitching.product.dose, undefined);
      assert.equal(saved.yeast.pitching.product.cellsPerPack, undefined);
      assert.equal(saved.yeast.pitching.product.starter, undefined);
      assert.equal(saved.yeast.pitching.product.source.origin, 'manual');
      assert.equal(saved.yeast.pitching.offer.id, localOfferId);
      assert.equal(saved.yeast.pitching.offer.stock.status, 'unknown');
      assert.equal(saved.yeast.pitching.offer.stock.source.origin, 'manual');
      assert.equal(saved.yeast.pitching.offer.shipping, undefined);
      assert.equal(saved.yeast.pitching.offer.price, undefined);
      assert(!(await page.evaluate(id => window.__hopQa.storage.getYeastProducts().some(row => row.id === id), productId)),
        'La copie manuelle est sauvegardée dans la recette, pas dans le cache canonique local.');

      // Reload without the reset query: the fixture storage is local/offline, including exact sources and unknowns.
      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, recipe.name);
      await clickStep(page, 'Levure');
      saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(saved.yeast.pitching.product.id, productId);
      assert.equal(saved.yeast.pitching.offer.id, localOfferId);
      assert.equal(saved.yeast.pitching.product.source.origin, 'manual');
      assert.equal(saved.yeast.pitching.offer.stock.source.origin, 'manual');
      assert.equal(saved.yeast.pitching.product.format, undefined);
      assert.equal(saved.yeast.pitching.product.dose, undefined);
      assert.equal(saved.yeast.pitching.offer.stock.status, 'unknown');
      assert.equal(saved.yeast.pitching.offer.shipping, undefined);
      assert.equal(saved.yeast.pitching.offer.price, undefined);
      assert.equal(saved.yeast.qty, 1);
      assert.equal(saved.yeast.unit, 'flacon');
      await page.waitForSelector('.yp-supply [data-product-copy="manual"]', { visible: true, timeout: 10000 });
      await page.waitForSelector(`[data-offer-copy="manual"]`, { visible: true, timeout: 10000 });
      const canonicalAfterReload = await page.evaluate(id => window.__hopQa.storage.getYeastProducts().some(row => row.id === id), productId);
      assert.equal(canonicalAfterReload, false);
      const reopenedShot = await captureReview(page, width, height, `levure-3068-copie-locale-reouverte-${label}-apres`, '.yp-supply');
      assert.match(reopenedShot.visibleText, /Définir une offre/);

      // Voluntary S1 composition proves recipe-local product/offer copies are included without catalog mutation.
      await page.locator('[aria-label="Chercher une autre levure"]').fill('US-05');
      await page.waitForSelector('.yc-list li[data-candidate-id="fermentis-us05"]', { visible: true, timeout: 15000 });
      await clickSelector(page, '.yc-list li[data-candidate-id="fermentis-us05"] input[aria-label^="Comparer"]');
      await clickSelector(page, '.yc-compare-open');
      await page.waitForSelector('[data-supply-comparison]', { visible: true, timeout: 15000 });
      const copyComparison = await page.$eval(`[data-supply-product="${productId}"]`, element => ({
        role: element.getAttribute('data-reference-role'), text: element.innerText,
        productCopy: !!element.querySelector('[data-recipe-copy="product"]'),
        offerCopy: !!element.querySelector(`[data-supply-offer] [data-recipe-copy="offer"]`),
        offerBuyable: element.querySelector('[data-supply-offer]')?.getAttribute('data-buyable')
      }));
      assert.equal(copyComparison.role, 'selected-reference');
      assert.equal(copyComparison.productCopy, true);
      assert.equal(copyComparison.offerCopy, true);
      assert.equal(copyComparison.offerBuyable, 'false');
      assert.match(copyComparison.text, /Format non communiqué · packs inconnus/);
      assert.match(copyComparison.text, /Inconnu/);
      assert.match(copyComparison.text, /Définie à la main|saisie à la main|copie/i);
      const copyProductFacts = `[data-supply-product="${productId}"] .yc-compare-col > details.yc-fact-source`;
      await openDisclosure(page, copyProductFacts);
      const manualProductSourceText = await page.$eval(copyProductFacts, element => element.innerText);
      assert.match(manualProductSourceText, /Saisie manuelle/);
      assert.match(manualProductSourceText, /(?:relevé le|date indiquée\s*:?)\s*\d{2}\.\d{2}\.2026/);
      const copySources = `${copyProductFacts} details[data-source-documents="product"]`;
      await openDisclosure(page, copySources);
      assert.equal(await page.$$eval(`${copySources} a`, links => links.length), 1,
        'La source unique de la copie produit reste liée sans fusionner ses observations datées.');
      const copyOfferDetails = `[data-supply-product="${productId}"] [data-supply-offer="${localOfferId}"]`;
      await openDisclosure(page, copyOfferDetails);
      const manualOfferSourceText = await page.$eval(copyOfferDetails, element => element.innerText);
      assert.match(manualOfferSourceText, /Saisie manuelle/);
      assert.match(manualOfferSourceText, /(?:relevé le|date indiquée\s*:?)\s*\d{2}\.\d{2}\.2026/);
      await captureReview(page, width, height, `levure-3068-copie-offre-comparaison-${label}-apres`, '.yc-supply-comparison');
      let comparisonScroll;
      if (width === 390) {
        comparisonScroll = await page.$eval('[data-supply-comparison] .yc-compare-scroll[aria-label="Produits, formats, doses et offres"]', element => {
          const before = { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth };
          element.scrollLeft = element.scrollWidth;
          return { ...before, scrollLeft: element.scrollLeft, describedBy: element.getAttribute('aria-describedby'),
            hintText: element.getAttribute('aria-describedby') ? document.getElementById(element.getAttribute('aria-describedby'))?.innerText : '' };
        });
        assert.ok(comparisonScroll.scrollWidth > comparisonScroll.clientWidth && comparisonScroll.scrollLeft > 0);
        assert.match(comparisonScroll.hintText, /horizontalement|balay|flèches/i);
        await captureReview(page, width, height, `levure-3068-comparaison-offres-visible-${label}-apres`, '.yc-supply-comparison');
      }
      await clickSelector(page, '.yc-compare-open');
      const retainedAfterCompare = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast, recipe.id);
      assert.equal(retainedAfterCompare.hopIndexId, 'wyeast-3068');
      assert.equal(retainedAfterCompare.pitching.product.id, productId);
      assert.equal(retainedAfterCompare.pitching.offer.id, localOfferId);

      // A second offer may be explicitly proposed; its server receipt/readback does not select it in the recipe.
      await clickTextIn(page, '.yp-supply', 'Définir une offre');
      await page.waitForSelector(offerScope, { visible: true, timeout: 10000 });
      const databaseOfferId = await page.$eval(offerScope, element => element.getAttribute('data-entry-id'));
      await fillLabelledInput(page, offerScope, 'Vendeur', 'Marchand QA · offre canonique témoin');
      await fillLabelledInput(page, offerScope, 'Lien https de la page exacte', 'https://example.invalid/qa/wyeast-3068-offre-canonique');
      await fillLabelledInput(page, offerScope, 'Titre de la page', 'Page exacte · offre canonique QA');
      await clickTextIn(page, offerScope, 'Ajouter l’offre à la base');
      await page.waitForSelector('[aria-label="Ajout manuel d’une offre"]', { visible: true, timeout: 15000 });
      const offerProposalText = await page.$eval('[aria-label="Ajout manuel d’une offre"]', element => element.innerText);
      assert.match(offerProposalText, /Saisie manuelle/);
      assert.match(offerProposalText, /offre canonique témoin/);
      assert.match(offerProposalText, /Aucune valeur enregistrée/);
      await captureReview(page, width, height, `levure-3068-proposition-offre-manuel-${label}-apres`, '[aria-label="Ajout manuel d’une offre"]');
      await clickTextIn(page, 'body', 'Ajouter l’offre exacte');
      await page.waitForSelector('[aria-label="Reçu serveur"]', { visible: true, timeout: 15000 });
      const offerReceipt = await page.$eval('[aria-label="Reçu serveur"]', element => element.innerText);
      assert.match(offerReceipt, /Reçu serveur confirmé/);
      assert.match(offerReceipt, /offre ajoutée/i);
      assert.match(offerReceipt, /fiche produit créée/i,
        'L’offre ajoutée depuis la copie locale crée explicitement sa fiche parente absente du serveur QA.');
      assert.doesNotMatch(offerReceipt, /lecture dans le cache local reste en attente/i);
      const refreshedDoc = await page.evaluate(id => window.__hopQa.storage.getYeastProducts().find(row => row.id === id), productId);
      assert(refreshedDoc?.offers.some(offer => offer.id === databaseOfferId));
      assert.equal(refreshedDoc.product.source.origin, 'manual');
      assert.equal(refreshedDoc.offers.find(offer => offer.id === databaseOfferId)?.stock.source.origin, 'manual');
      const afterOfferReceipt = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast, recipe.id);
      assert.equal(afterOfferReceipt.pitching.offer.id, localOfferId);
      assert.notEqual(afterOfferReceipt.pitching.offer.id, databaseOfferId,
        'Le reçu canonique ne retient pas automatiquement la nouvelle offre dans la recette.');
      assert(await page.$(`[data-entry="offer"] button`), 'La fiche reste sous le geste explicite de retenir l’offre.');
      assert.equal(await page.$$eval('[role="dialog"] button', buttons => buttons.filter(button => button.textContent.trim() === 'Fermer').length), 1,
        'Après reçu, le pied de feuille propose seulement de fermer; il ne garde pas un bouton de second apply désactivé.');
      await captureReview(page, width, height, `levure-3068-recu-offre-refresh-sans-adoption-${label}-apres`, '[aria-label="Reçu serveur"]');
      const documentBeforeConflict = await page.evaluate(id => window.__hopQa.storage.getYeastProducts().find(row => row.id === id), productId);
      await clickTextIn(page, '[role="dialog"]', 'Fermer');
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 10000 });
      await clickTextIn(page, offerScope, 'Fermer');

      // A simulated revision race is rejected; source draft and prior canonical document remain untouched.
      await clickTextIn(page, '.yp-supply', 'Définir une offre');
      await page.waitForSelector(offerScope, { visible: true, timeout: 10000 });
      const conflictOfferId = await page.$eval(offerScope, element => element.getAttribute('data-entry-id'));
      await fillLabelledInput(page, offerScope, 'Vendeur', 'Marchand QA · brouillon conflictuel');
      await fillLabelledInput(page, offerScope, 'Lien https de la page exacte', 'https://example.invalid/qa/offer-conflict');
      await fillLabelledInput(page, offerScope, 'Titre de la page', 'Page exacte · conflit QA');
      await clickTextIn(page, offerScope, 'Ajouter l’offre à la base');
      await page.waitForSelector('[aria-label="Ajout manuel d’une offre"]', { visible: true, timeout: 15000 });
      await clickTextIn(page, 'body', 'Ajouter l’offre exacte');
      await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some(element => element.innerText.includes('Conflit QA')),
        { timeout: 15000 });
      const conflictText = await page.$eval('[role="alert"]', element => element.innerText);
      assert.match(conflictText, /Conflit QA.*révision concurrente/i);
      assert.equal(await page.$('[aria-label="Reçu serveur"]'), null, 'Le refus concurrent n’affiche pas de reçu confirmé.');
      assert.equal(await inputValueForLabel(page, offerScope, 'Vendeur'), 'Marchand QA · brouillon conflictuel');
      assert.equal(await inputValueForLabel(page, offerScope, 'Lien https de la page exacte'), 'https://example.invalid/qa/offer-conflict');
      assert.equal(await page.$eval(offerScope, element => element.querySelector('fieldset')?.disabled), true,
        'Le brouillon soumis reste figé pendant que le refus est visible; il n’est pas effacé.');
      const documentAfterConflict = await page.evaluate(id => window.__hopQa.storage.getYeastProducts().find(row => row.id === id), productId);
      assert.deepEqual(documentAfterConflict, documentBeforeConflict, 'Le refus CAS conserve la dernière fiche locale relue.');
      const finalDraft = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast, recipe.id);
      assert.equal(finalDraft.pitching.offer.id, localOfferId);
      assert.notEqual(finalDraft.pitching.offer.id, conflictOfferId);
      assert.equal(await page.$$eval(`[data-offer="${localOfferId}"][data-retained]`, elements => elements.length), 1,
        'Le Wizard reste sur sa copie retenue; le refus n’a pas remplacé son offre.');
      // The retained copy is still represented by the row even when it is no longer a catalogue row.
      assert.equal(finalDraft.pitching.offer.stock.status, 'unknown');
      await captureReview(page, width, height, `levure-3068-conflit-offre-draft-conserve-${label}-apres`, '[aria-label="Ajout manuel d’une offre"]');

      // A distinct product-create branch exercises pending readback without auto-replacing the retained product.
      await clickSelector(page, '[role="dialog"] button[aria-label="Fermer"]');
      await clickTextIn(page, offerScope, 'Annuler');
      await clickTextIn(page, '.yp-supply', 'Définir un autre produit / format');
      await page.waitForSelector(productScope, { visible: true, timeout: 10000 });
      const pendingProductId = await page.$eval(productScope, element => element.getAttribute('data-entry-id'));
      await fillLabelledInput(page, productScope, 'Nom ou variante exacte', 'Wyeast 3068 · autre variante exacte QA');
      assert.equal(await inputValueForLabel(page, productScope, 'Fabricant'), 'Wyeast');
      await selectLabelOption(page, productScope, 'Forme', 'liquide');
      await selectLabelOption(page, productScope, 'Format du conditionnement', 'unknown');
      await fillLabelledInput(page, productScope, 'Titre', 'Page variante exacte · fixture QA');
      await fillLabelledInput(page, productScope, 'Lien https', 'https://example.invalid/qa/wyeast-3068-variante-b');
      await page.$eval(`${productScope} input[type="date"]`, (element, value) => {
        element.focus();
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }, productSourceDay);
      await page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.value === value,
        { timeout: 5000 }, { selector: `${productScope} input[type="date"]`, value: productSourceDay });
      await clickTextIn(page, productScope, 'Créer la fiche dans la base');
      await page.waitForSelector('[aria-label="Création manuelle du produit exact"]', { visible: true, timeout: 15000 });
      await clickTextIn(page, 'body', 'Créer le produit exact');
      await page.waitForSelector('[aria-label="Reçu serveur"]', { visible: true, timeout: 15000 });
      const productReceipt = await page.$eval('[aria-label="Reçu serveur"]', element => element.innerText);
      assert.match(productReceipt, /Reçu serveur confirmé/);
      assert.match(productReceipt, /produit exact créé/i);
      assert.match(productReceipt, /lecture dans le cache local reste en attente/i);
      assert.equal(await page.$$eval('[role="dialog"] button', buttons => buttons.filter(button => button.textContent.trim() === 'Fermer').length), 1,
        'Le reçu pending expose le geste fermer et empêche un second apply.');
      const selectedBeforePendingReceipt = await page.$eval('.yp-chosen strong', element => element.innerText);
      assert.match(selectedBeforePendingReceipt, /produit témoin sans format QA/);
      assert.doesNotMatch(selectedBeforePendingReceipt, /autre variante exacte QA/,
        'Le reçu pending ne remplace pas le produit déjà retenu dans la recette.');
      assert.equal(await page.$eval('[aria-label^="Quantité de levure"]', element => element.value), '1');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'flacon');
      await captureReview(page, width, height, `levure-3068-2e-produit-recu-pending-sans-adoption-${label}-apres`, '[aria-label="Reçu serveur"]');
      const productCreateEvidence = await page.evaluate(id => ({
        localContains: window.__hopQa.storage.getYeastProducts().some(row => row.id === id),
        serverContains: Object.keys(JSON.parse(localStorage.getItem('__HOP_QA_YEAST_CORRECTION_SERVER__') || '{"products":{}}').products).includes(id),
        recipeSelectedId: window.__hopQa.storage.getRecipes().find(item => item.id.startsWith('QA-YEAST-REFONTE-'))?.yeast?.pitching?.product?.id,
        calls: window.__hopQa.nolo.inputs.filter(call => ['proposeYeastDbCorrection', 'applyYeastDbCorrection'].includes(call.name))
      }), pendingProductId);
      assert.equal(productCreateEvidence.localContains, false);
      assert.equal(productCreateEvidence.serverContains, true);
      assert.equal(productCreateEvidence.recipeSelectedId, productId);
      assert(productCreateEvidence.calls.some(call => call.input.manual?.kind === 'product-create'
        && call.input.target.id === pendingProductId && call.input.target.fallback.product.source.origin === 'manual'));

      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(remoteRequests, [], `${label}: aucun réseau externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune erreur JavaScript.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation', 'proposeYeastDbCorrection', 'applyYeastDbCorrection'].includes(call)), [],
        `${label}: aucune callable réelle/IA.`);
      const qualification = { label, recipeId: recipe.id, flow: 'définition manuelle produit/offre sans produit initial',
        initialReference: 'wyeast-3068', productId, localOfferId, databaseOfferId, conflictOfferId,
        receiptProduct: { productId: pendingProductId, status: 'server-confirmed', targetCreated: true,
          readback: 'pending', autoChosen: false, productCreateEvidence },
        localCopy: { savedAndReopened: true, formatUnknown: true, productSource: 'manual', offerStock: 'unknown', shipping: null, price: null,
          quantityAndUnitPreserved: { qty: 1, unit: 'flacon' }, wort: { volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' } },
        compareCopy: { productAndOfferIncluded: true, sourcesVisibleAndManual: true, voluntaryAlternative: 'fermentis-us05' },
        receiptOffer: { status: 'server-confirmed', targetCreated: true, readback: 'refreshed', autoRetained: false },
        conflict: { rejected: conflictText, draftPreserved: true, canonicalDocumentUnchanged: true }, comparisonScroll, calls,
        remoteRequests, pageErrors, consoleErrors };
      return qualification;
    };

    const runWortIdentityScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const seed = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(seed.yeast.stockItemRef, 'QA-WORT-STOCK-A');
      assert.equal(seed.yeast.localDocumentary.version, 1, 'La fixture porte une fiche documentaire locale versionnée.');
      assert.equal(seed.yeast.pitching.product.id, 'qa-local-yeast-product-a');
      assert.equal(seed.yeast.pitching.lot.lotNumber, 'LOT-A-QA');
      assert.equal(await page.$eval('.yp-lot', element => element.getAttribute('data-lot')), 'confirmed',
        'Le produit et le lot synthétiques de départ correspondent à l’article stock lié.');
      const readDraftDocumentary = async () => page.evaluate(id => {
        const prefix = 'laffinee_recipe_draft_v1:';
        for (const key of Object.keys(localStorage).filter(item => item.startsWith(prefix))) {
          try {
            const draft = JSON.parse(localStorage.getItem(key) || 'null')?.draft;
            if (draft?.recipe?.id === id) return {
              localDocumentary: draft.recipe.yeast?.localDocumentary,
              technicalFacts: draft.recipe.yeast?.technicalFacts,
            };
          } catch { /* unrelated or invalid local fixture key */ }
        }
        return undefined;
      }, recipe.id);
      const draftDocumentaryBeforeWort = await readDraftDocumentary();
      const documentaryModelBeforeWort = draftDocumentaryBeforeWort ?? {
        localDocumentary: seed.yeast.localDocumentary, technicalFacts: seed.yeast.technicalFacts,
      };
      const documentaryModelBaseline = draftDocumentaryBeforeWort ? 'Wizard draft before wort edit' : 'saved fixture recipe';
      const documentaryDiffBeforeWort = await page.$eval('.yc-state-documentary', element => element.textContent).catch(() => '');

      const setMeasuredByKeyboard = async groupLabel => {
        await page.waitForFunction(label => [...document.querySelectorAll('[role="radiogroup"]')]
          .some(group => group.getAttribute('aria-label') === label && [...group.querySelectorAll('[role="radio"]')]
            .some(radio => radio.textContent.trim() === 'Hypothèse' && radio.getAttribute('aria-checked') === 'true')),
        { timeout: 10000 }, groupLabel);
        await page.evaluate(label => {
          const group = [...document.querySelectorAll('[role="radiogroup"]')].find(item => item.getAttribute('aria-label') === label);
          [...group.querySelectorAll('[role="radio"]')].find(radio => radio.textContent.trim() === 'Hypothèse')?.focus();
        }, groupLabel);
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(label => [...document.querySelectorAll('[role="radiogroup"]')]
          .some(group => group.getAttribute('aria-label') === label && [...group.querySelectorAll('[role="radio"]')]
            .some(radio => radio.textContent.trim() === 'Mesuré' && radio.getAttribute('aria-checked') === 'true')),
        { timeout: 5000 }, groupLabel);
      };
      const enterMeasuredWort = async () => {
        const editorOpen = await page.$eval('.yp-wort .yp-editor', element => !!element.getClientRects().length).catch(() => false);
        if (!editorOpen) {
          const basis = await page.$eval('.yp-wort', element => element.getAttribute('data-wort-basis'));
          if (basis === 'none') await clickTextIn(page, '.yp-wort', 'Saisir une mesure ou une hypothèse');
          else await clickTextIn(page, '.yp-wort', 'Corriger');
        }
        await typeNumericInput(page, '[aria-label="Volume du moût à ensemencer en litres"]', '40');
        await setMeasuredByKeyboard('Nature du volume');
        await typeNumericInput(page, '[aria-label="Densité du moût à ensemencer en SG"]', '1.050');
        await setMeasuredByKeyboard('Nature de la densité');
        const state = await page.$eval('.yp-wort', element => ({
          basis: element.getAttribute('data-wort-basis'), text: element.innerText,
          reading: element.querySelector('.yp-reading')?.innerText ?? '',
        }));
        assert.equal(state.basis, 'measured', 'Les deux valeurs saisies au clavier sont qualifiées comme mesure.');
        assert.match(state.reading, /40\s*L/);
        assert.match(state.reading, /SG 1,050/);
        assert.equal((state.reading.match(/mesuré/gi) ?? []).length, 2, 'Volume et SG affichent chacun leur qualification mesurée.');
        return state;
      };
      const typePickerQuery = async query => {
        await openDisclosure(page, '.yc-personal-fold');
        const picker = await page.waitForSelector('[role="combobox"][aria-label="Souche de levure"]', { visible: true, timeout: 10000 });
        await picker.click();
        if (await picker.evaluate(element => element.readOnly)) await picker.click();
        await page.waitForFunction(() => !document.querySelector('[role="combobox"][aria-label="Souche de levure"]')?.readOnly,
          { timeout: 5000 });
        await picker.click({ clickCount: 3 });
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.type(query);
        await page.waitForFunction(query => [...document.querySelectorAll('[role="option"]')]
          .some(option => option.textContent.includes(query) || option.textContent.includes(`« ${query} »`)),
        { timeout: 10000 }, query);
        await page.keyboard.press('Enter');
      };
      const readCurrent = () => page.evaluate(() => ({
        identity: document.querySelector('.yc-identity-card')?.innerText ?? '',
        source: document.querySelector('.yc-identity-card')?.getAttribute('data-yeast-source'),
        wortBasis: document.querySelector('.yp-wort')?.getAttribute('data-wort-basis'),
        wortText: document.querySelector('.yp-wort')?.innerText ?? '',
        wortReadingText: document.querySelector('.yp-wort .yp-reading')?.innerText ?? '',
        supplyText: document.querySelector('.yp-supply')?.innerText ?? '',
        lotText: document.querySelector('.yp-lot')?.innerText ?? '',
        lotState: document.querySelector('.yp-lot')?.getAttribute('data-lot'),
        changeText: document.querySelector('.yc-change-bar')?.innerText ?? '',
      }));
      const assertMeasured = state => {
        assert.equal(state.wortBasis, 'measured');
        assert.match(state.wortText, /40\s*L/);
        assert.match(state.wortText, /SG 1,050/);
        assert.equal((state.wortReadingText.match(/mesuré/gi) ?? []).length, 2);
      };

      const measured = await enterMeasuredWort();
      await page.waitForFunction(id => Object.keys(localStorage).some(key => {
        if (!key.startsWith('laffinee_recipe_draft_v1:')) return false;
        try {
          const draft = JSON.parse(localStorage.getItem(key) || 'null')?.draft;
          return draft?.recipe?.id === id && draft.recipe.yeast?.pitching?.wort?.volumeBasis === 'measured'
            && draft.recipe.yeast?.pitching?.wort?.sgBasis === 'measured';
        } catch { return false; }
      }), { timeout: 10000 }, recipe.id);
      const documentaryModelAfterWort = await readDraftDocumentary();
      assert(documentaryModelAfterWort, 'Le brouillon local doit permettre la lecture des champs après la saisie.');
      const documentaryModelUnchanged = JSON.stringify(documentaryModelAfterWort) === JSON.stringify(documentaryModelBeforeWort);
      const documentaryDiffAfterWort = await page.$eval('.yc-state-documentary', element => element.textContent).catch(() => '');
      let documentaryDiffCapture;
      if (documentaryDiffAfterWort) {
        await openDisclosure(page, '.yc-state-documentary');
        documentaryDiffCapture = await captureReview(page, width, height, `wort-fiche-diff-apres-saisie-${label}-apres`, '.yc-state-documentary');
        assert.match(documentaryDiffCapture.visibleText, /Ajout Forme : liquide/);
        assert.match(documentaryDiffCapture.visibleText, /Article de stock QA-WORT-STOCK-A/);
      }
      const startCapture = await captureReview(page, width, height, `wort-local-stock-mesure-${label}-apres`, '.yp-wort');
      assert.match(startCapture.visibleText, /Culture locale stock A QA/);

      await typePickerQuery('Culture stock B QA');
      await page.waitForFunction(() => document.querySelector('.yc-identity-card')?.innerText.includes('Culture stock B QA'),
        { timeout: 15000 });
      const stockChoice = await readCurrent();
      assert.equal(stockChoice.source, 'stock');
      assertMeasured(stockChoice);
      assert.match(stockChoice.lotText, /Culture stock B QA/);
      assert.doesNotMatch(`${stockChoice.supplyText}\n${stockChoice.lotText}`, /Produit local QA A|LOT-A-QA|qa-local-yeast-product-a/,
        'La sélection du nouvel article n’emporte ni le produit ni le lot de l’identité précédente.');
      assert.match(stockChoice.changeText, /Depuis Culture locale stock A QA/);
      const stockCapture = await captureReview(page, width, height, `wort-apres-choix-stock-${label}-apres`, '.yp-wort');
      assert.equal(stockCapture.wortBasis, 'measured');
      assert.match(stockCapture.visibleText, /40\s*L/);
      assert.match(stockCapture.visibleText, /SG 1,050/);

      await clickTextIn(page, '.yp-wort', 'Corriger');
      await clickTextIn(page, '.yp-wort', 'Effacer le moût');
      await page.waitForFunction(() => document.querySelector('.yp-wort')?.getAttribute('data-wort-basis') === 'none', { timeout: 5000 });
      const cleared = await readCurrent();
      assert.doesNotMatch(cleared.wortText, /40\s*L|SG 1,050/);
      const clearCapture = await captureReview(page, width, height, `wort-efface-apres-stock-${label}-apres`, '.yp-wort');

      await clickSelector(page, '.yc-change-bar [data-undo-change]');
      await page.waitForFunction(() => document.querySelector('.yc-identity-card')?.innerText.includes('Culture locale stock A QA')
        && document.querySelector('.yp-wort')?.getAttribute('data-wort-basis') === 'none', { timeout: 15000 });
      const undone = await readCurrent();
      assert.equal(undone.lotState, 'confirmed', 'Undo restaure la fiche locale et le lot source, mais pas le moût effacé.');
      assert.doesNotMatch(undone.wortText, /40\s*L|SG 1,050/);
      const undoCapture = await captureReview(page, width, height, `wort-efface-apres-undo-${label}-apres`, '.yp-wort');
      assert.equal(undoCapture.wortBasis, 'none');

      await clickSelector(page, '.yc-change-bar [data-undo-change]');
      await page.waitForFunction(() => document.querySelector('.yc-identity-card')?.innerText.includes('Culture stock B QA')
        && document.querySelector('.yp-wort')?.getAttribute('data-wort-basis') === 'none', { timeout: 15000 });
      const redone = await readCurrent();
      assert.equal(redone.source, 'stock');
      assert.doesNotMatch(redone.wortText, /40\s*L|SG 1,050/);
      assert.doesNotMatch(`${redone.supplyText}\n${redone.lotText}`, /Produit local QA A|LOT-A-QA|qa-local-yeast-product-a/);
      const redoCapture = await captureReview(page, width, height, `wort-efface-apres-redo-${label}-apres`, '.yp-wort');

      // Re-enter a measured physical wort on B, then use the free-identity path as a second preservation check.
      await enterMeasuredWort();
      await typePickerQuery('Culture libre QA B');
      await page.waitForFunction(() => document.querySelector('.yc-identity-card')?.innerText.includes('Culture libre QA B'),
        { timeout: 15000 });
      const freeChoice = await readCurrent();
      assert.equal(freeChoice.source, 'free');
      assertMeasured(freeChoice);
      assert.doesNotMatch(`${freeChoice.supplyText}\n${freeChoice.lotText}`, /Produit local QA A|LOT-A-QA|qa-local-yeast-product-a/);
      const freeCapture = await captureReview(page, width, height, `wort-apres-choix-libre-${label}-apres`, '.yp-wort');
      assert.equal(freeCapture.wortBasis, 'measured');
      assert.match(freeCapture.visibleText, /40\s*L/);
      assert.match(freeCapture.visibleText, /SG 1,050/);

      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.name === 'Culture libre QA B',
        { timeout: 20000 }, recipe.id);
      await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 15000 });
      const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(saved.yeast.stockItemRef, undefined);
      assert.equal(saved.yeast.localDocumentary, undefined);
      assert.equal(saved.yeast.pitching.product, undefined);
      assert.equal(saved.yeast.pitching.lot, undefined);
      assert.deepEqual({ volumeL: saved.yeast.pitching.wort.volumeL, volumeBasis: saved.yeast.pitching.wort.volumeBasis,
        sg: saved.yeast.pitching.wort.sg, sgBasis: saved.yeast.pitching.wort.sgBasis },
      { volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' });

      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, recipe.name);
      await clickStep(page, 'Levure');
      await page.waitForSelector('.yp-wort', { visible: true, timeout: 10000 });
      const reopened = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(reopened.yeast.name, 'Culture libre QA B');
      assert.equal(reopened.yeast.stockItemRef, undefined);
      assert.equal(reopened.yeast.pitching.product, undefined);
      assert.equal(reopened.yeast.pitching.lot, undefined);
      assert.deepEqual({ volumeL: reopened.yeast.pitching.wort.volumeL, volumeBasis: reopened.yeast.pitching.wort.volumeBasis,
        sg: reopened.yeast.pitching.wort.sg, sgBasis: reopened.yeast.pitching.wort.sgBasis },
      { volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' });
      const reopenedCapture = await captureReview(page, width, height, `wort-local-reouvert-${label}-apres`, '.yp-wort');
      assertMeasured(await readCurrent());
      const documentaryDiffUnchanged = documentaryDiffAfterWort === documentaryDiffBeforeWort;

      assert.deepEqual(remoteRequests, [], `${label}: aucun appel réseau externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune exception navigateur.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur/alerte console.`);
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation'].includes(call)), [],
        `${label}: aucun appel serveur ou IA hors ligne mocké.`);
      return { label, fixture: { identity: seed.yeast.name, stockRef: seed.yeast.stockItemRef,
        localDocumentaryVersion: seed.yeast.localDocumentary.version, product: seed.yeast.pitching.product.id,
        lot: seed.yeast.pitching.lot.lotNumber }, keyboardEntry: { volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' },
        stockChoicePreservedMeasuredWort: true, stockChoiceDidNotCopyProductOrLot: true,
        clearUndoRedoStayedCleared: true, freeChoicePreservedMeasuredWort: true,
        documentaryModelBaseline, documentaryModelBeforeWort, documentaryModelAfterWort, documentaryModelUnchanged,
        documentaryDiffBeforeWort, documentaryDiffAfterWort, documentaryDiffUnchanged,
        documentaryDiffScreenshot: documentaryDiffAfterWort ? `wort-fiche-diff-apres-saisie-${label}-apres` : undefined,
        localSaveReopen: { identity: reopened.yeast.name, wort: reopened.yeast.pitching.wort },
        captures: [documentaryDiffCapture, startCapture, stockCapture, clearCapture, undoCapture, redoCapture, freeCapture, reopenedCapture].filter(Boolean).length,
        remoteRequests, pageErrors, consoleErrors, calls };
    };

    const runFreeLocalWortScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const sourceRecipe = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(sourceRecipe.yeast.hopIndexId, undefined);
      assert.equal(sourceRecipe.yeast.stockItemRef, undefined);
      assert.deepEqual(sourceRecipe.yeast.localDocumentary, { version: 1, documentary: { form: 'liquide', lab: 'Fabricant QA' } });
      assert.equal(sourceRecipe.yeast.technicalFacts, undefined);
      const readDraftDocumentary = async () => page.evaluate(id => {
        const prefix = 'laffinee_recipe_draft_v1:';
        for (const key of Object.keys(localStorage).filter(item => item.startsWith(prefix))) {
          try {
            const draft = JSON.parse(localStorage.getItem(key) || 'null')?.draft;
            if (draft?.recipe?.id === id) return {
              localDocumentary: draft.recipe.yeast?.localDocumentary,
              technicalFacts: draft.recipe.yeast?.technicalFacts,
              wort: draft.recipe.yeast?.pitching?.wort,
            };
          } catch { /* unrelated or invalid local fixture key */ }
        }
        return undefined;
      }, recipe.id);
      const baseline = await readDraftDocumentary() ?? {
        localDocumentary: sourceRecipe.yeast.localDocumentary,
        technicalFacts: sourceRecipe.yeast.technicalFacts,
        wort: sourceRecipe.yeast.pitching?.wort,
      };
      const readUiDocumentaryDiff = () => page.$eval('.yc-state-documentary', element => element.textContent).catch(() => '');
      const initialUiDocumentaryDiff = await readUiDocumentaryDiff();
      const initialShot = await captureReview(page, width, height, `free-local-documentary-moût-initial-${label}-apres`, '.yp-wort');

      await clickTextIn(page, '.yp-wort', 'Corriger');
      await typeNumericInput(page, '[aria-label="Volume du moût à ensemencer en litres"]', '42');
      const setMeasuredByKeyboard = async groupLabel => {
        await page.waitForFunction(label => [...document.querySelectorAll('[role="radiogroup"]')]
          .some(group => group.getAttribute('aria-label') === label && [...group.querySelectorAll('[role="radio"]')]
            .some(radio => radio.textContent.trim() === 'Hypothèse' && radio.getAttribute('aria-checked') === 'true')),
        { timeout: 10000 }, groupLabel);
        await page.evaluate(label => {
          const group = [...document.querySelectorAll('[role="radiogroup"]')].find(item => item.getAttribute('aria-label') === label);
          [...group.querySelectorAll('[role="radio"]')].find(radio => radio.textContent.trim() === 'Hypothèse')?.focus();
        }, groupLabel);
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(label => [...document.querySelectorAll('[role="radiogroup"]')]
          .some(group => group.getAttribute('aria-label') === label && [...group.querySelectorAll('[role="radio"]')]
            .some(radio => radio.textContent.trim() === 'Mesuré' && radio.getAttribute('aria-checked') === 'true')),
        { timeout: 5000 }, groupLabel);
      };
      await setMeasuredByKeyboard('Nature du volume');
      await typeNumericInput(page, '[aria-label="Densité du moût à ensemencer en SG"]', '1.050');
      await setMeasuredByKeyboard('Nature de la densité');
      await page.waitForFunction(id => Object.keys(localStorage).some(key => {
        if (!key.startsWith('laffinee_recipe_draft_v1:')) return false;
        try {
          const draft = JSON.parse(localStorage.getItem(key) || 'null')?.draft;
          return draft?.recipe?.id === id && draft.recipe.yeast?.pitching?.wort?.volumeL === 42
            && draft.recipe.yeast?.pitching?.wort?.volumeBasis === 'measured'
            && draft.recipe.yeast?.pitching?.wort?.sgBasis === 'measured';
        } catch { return false; }
      }), { timeout: 10000 }, recipe.id);
      const measured = await readDraftDocumentary();
      assert(measured, 'Le brouillon libre reste lisible après la saisie physique.');
      const measuredUiDocumentaryDiff = await readUiDocumentaryDiff();
      assert.deepEqual(measured.localDocumentary, baseline.localDocumentary);
      assert.deepEqual(measured.technicalFacts, baseline.technicalFacts);
      assert.equal(measuredUiDocumentaryDiff, initialUiDocumentaryDiff,
        'La saisie de volume/SG ne crée pas de différence documentaire locale.');
      const measuredShot = await captureReview(page, width, height, `free-local-documentary-moût-mesure-${label}-apres`, '.yp-wort');
      assert.match(measuredShot.visibleText, /42\s*L/);
      assert.match(measuredShot.visibleText, /SG 1,050/);

      await clickTextIn(page, '.yp-wort', 'Effacer le moût');
      await page.waitForFunction(id => Object.keys(localStorage).some(key => {
        if (!key.startsWith('laffinee_recipe_draft_v1:')) return false;
        try {
          const draft = JSON.parse(localStorage.getItem(key) || 'null')?.draft;
          return draft?.recipe?.id === id && draft.recipe.yeast?.pitching?.wort === undefined;
        } catch { return false; }
      }), { timeout: 10000 }, recipe.id);
      const cleared = await readDraftDocumentary();
      const clearedUiDocumentaryDiff = await readUiDocumentaryDiff();
      assert.deepEqual(cleared.localDocumentary, baseline.localDocumentary,
        'Effacer le moût ne change aucun octet du localDocumentary de cette recette.');
      assert.deepEqual(cleared.technicalFacts, baseline.technicalFacts,
        'Effacer le moût ne crée aucun technicalFact de forme.');
      assert.equal(clearedUiDocumentaryDiff, initialUiDocumentaryDiff,
        'La fiche ne présente aucun compteur/diff après effacement.');
      const clearShot = await captureReview(page, width, height, `free-local-documentary-moût-efface-${label}-apres`, '.yp-wort');
      assert.equal(clearShot.wortBasis, 'none');

      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.wort === undefined,
        { timeout: 20000 }, recipe.id);
      await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 15000 });
      const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.deepEqual(saved.yeast.localDocumentary, sourceRecipe.yeast.localDocumentary);
      assert.equal(saved.yeast.technicalFacts, undefined);
      assert.equal(saved.yeast.hopIndexId, undefined);
      assert.equal(saved.yeast.stockItemRef, undefined);
      assert.equal(saved.yeast.pitching?.wort, undefined);

      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, recipe.name);
      await clickStep(page, 'Levure');
      await page.waitForSelector('.yp-wort', { visible: true, timeout: 10000 });
      const reopened = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.deepEqual(reopened.yeast.localDocumentary, sourceRecipe.yeast.localDocumentary);
      assert.equal(reopened.yeast.technicalFacts, undefined);
      assert.equal(reopened.yeast.pitching?.wort, undefined);
      const reopenedUiDocumentaryDiff = await readUiDocumentaryDiff();
      assert.equal(reopenedUiDocumentaryDiff, initialUiDocumentaryDiff,
        'La réouverture hors ligne ne fait pas apparaître de provenance ou différence documentaire.');
      const reopenedShot = await captureReview(page, width, height, `free-local-documentary-moût-reouvert-${label}-apres`, '.yp-wort');

      assert.deepEqual(remoteRequests, [], `${label}: aucune requête HTTP(S) externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune exception navigateur.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur/alerte console.`);
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation'].includes(call)), [],
        `${label}: aucun appel serveur ou IA.`);
      return { label, identity: { name: sourceRecipe.yeast.name, source: 'free', hopIndexId: null, stockItemRef: null },
        localDocumentaryBefore: baseline.localDocumentary, localDocumentaryAfterEdit: measured.localDocumentary,
        localDocumentaryAfterClear: cleared.localDocumentary, localDocumentaryAfterSaveReopen: reopened.yeast.localDocumentary,
        technicalFactsBefore: baseline.technicalFacts ?? null, technicalFactsAfterEdit: measured.technicalFacts ?? null,
        technicalFactsAfterClear: cleared.technicalFacts ?? null, technicalFactsAfterSaveReopen: reopened.yeast.technicalFacts ?? null,
        documentaryDiffNeverAppeared: initialUiDocumentaryDiff === measuredUiDocumentaryDiff
          && measuredUiDocumentaryDiff === clearedUiDocumentaryDiff && clearedUiDocumentaryDiff === reopenedUiDocumentaryDiff,
        wortEditing: { enteredKeyboard: { volumeL: 42, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' }, cleared: true,
          savedAndReopened: reopened.yeast.pitching?.wort === undefined },
        captures: [initialShot, measuredShot, clearShot, reopenedShot].length,
        remoteRequests, pageErrors, consoleErrors, calls };
    };

    const runFlocculationProvenanceScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const stockRef = 'QA-FLOC-COMPANION', historicalRef = 'QA-FLOC-HISTORICAL';
      const initialStock = await page.evaluate(ref => window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === ref), stockRef);
      const historicalStock = await page.evaluate(ref => window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === ref), historicalRef);
      assert.equal(initialStock.yeastFlocculation, 'Medium');
      assert.equal(initialStock.yeastTechnicalFacts, undefined);
      assert.equal(historicalStock.yeastFlocculation, 'Low');
      assert.equal(historicalStock.yeastTechnicalFacts[0].reported, 'Low');
      assert.equal(historicalStock.yeastTechnicalFacts[0].acceptedScalarFields, undefined,
        'La fixture historique a le même scalaire Low et un fait IA sans sélection explicite.');

      const flocRequest = 'QA: flocculation Low, valeur companion dans le contexte Beer.';
      await clickTextIn(page, '.yp-lot', 'Corriger l’article dans la base');
      await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 10000 });
      await page.locator('#yeast-db-correction-request').fill(flocRequest);
      await clickTextIn(page, '[role="dialog"]', 'Proposer une correction');
      await page.waitForSelector('[aria-label="Proposition Gemini"]', { visible: true, timeout: 15000 });
      const proposalText = await page.$eval('[aria-label="Proposition Gemini"]', element => element.innerText);
      assert.match(proposalText, /Medium/);
      assert.match(proposalText, /Low/);
      assert.match(proposalText, /Beer/);
      await openDisclosure(page, 'details[aria-label="Sources des corrections"]');
      const citationText = await page.$eval('details[aria-label="Sources des corrections"]', element => element.innerText);
      assert.match(citationText, /Companion IA QA · flocculation/);
      assert.match(citationText, /date indiquée/i);
      assert.equal(await page.$eval('details[aria-label="Sources des corrections"] a', anchor => anchor.href),
        'https://example.invalid/qa-flocculation-low');
      const proposalShot = await captureReview(page, width, height, `floculation-proposition-companion-${label}-apres`, '[aria-label="Proposition Gemini"]');

      await clickTextIn(page, '[role="dialog"]', 'Confirmer la correction dans la base');
      await page.waitForSelector('[aria-label="Reçu serveur"]', { visible: true, timeout: 15000 });
      const receiptText = await page.$eval('[aria-label="Reçu serveur"]', element => element.innerText);
      assert.match(receiptText, /Reçu serveur confirmé/);
      const correctedStock = await page.evaluate(ref => window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === ref), stockRef);
      assert.equal(correctedStock.yeastFlocculation, 'Low');
      const acceptedFact = correctedStock.yeastTechnicalFacts.find(fact => fact.key === 'flocculation' && fact.reported === 'Low');
      assert.deepEqual(acceptedFact.acceptedScalarFields, ['yeastFlocculation']);
      assert.equal(acceptedFact.origin, 'ai');
      assert.equal(acceptedFact.sourceUrl, 'https://example.invalid/qa-flocculation-low');
      const correctionCalls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.equal(correctionCalls.filter(call => call === 'proposeYeastDbCorrection').length, 1);
      assert.equal(correctionCalls.filter(call => call === 'applyYeastDbCorrection').length, 1);
      assert.equal(correctionCalls.includes('aiTask'), false, 'La proposition companion est fournie par le mock QA.');
      const receiptShot = await captureReview(page, width, height, `floculation-recu-companion-${label}-apres`, '[aria-label="Reçu serveur"]');
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        [...(dialog?.querySelectorAll('button') ?? [])].find(button => button.textContent.trim() === 'Fermer')?.click();
      });
      await page.waitForSelector('[aria-label="Reçu serveur"]', { hidden: true, timeout: 10000 });

      const readField = async () => page.$eval('.yc-sheet-fold .yc-fact-row[data-sheet-fact="flocculation"]', element => ({
        value: element.querySelector('[data-fact-reading]')?.textContent.trim() ?? '',
        valueKind: element.getAttribute('data-value-kind'),
        provenance: element.querySelector('.yc-fact-provenance')?.innerText ?? '',
        href: element.querySelector('.yc-fact-provenance a')?.getAttribute('href') ?? '',
        rowText: element.innerText,
      }));
      const makeEmptyRecipe = async (id, name) => page.evaluate(({ id, name }) => {
        const base = window.__hopQa.storage.getRecipes().find(item => item.name === 'Weissbier de contrôle');
        const next = structuredClone(base);
        next.id = id; next.name = name; next.style = 'Hefeweizen'; next.styleRef = undefined;
        next.yeastDesign = undefined; next.yeastGuide = undefined; next.yeast = { name: '' };
        window.__hopQa.seedRecipe(next);
      }, { id, name });
      const chooseQuickStock = async (stockName, ref) => {
        await clickSelector(page, `button[aria-label*="${ref}"]`);
        await page.waitForFunction(name => document.querySelector('.yc-identity-card')?.innerText.includes(name),
          { timeout: 15000 }, stockName);
        await openDisclosure(page, '.yc-sheet-fold');
        await page.waitForSelector('.yc-sheet-fold .yc-fact-row[data-sheet-fact="flocculation"]', { visible: true, timeout: 10000 });
        return readField();
      };
      const saveAndReopen = async (id, name, targetRef) => {
        await clickStep(page, 'Récapitulatif');
        await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
        await page.waitForFunction(({ id, ref }) => {
          const saved = window.__hopQa.storage.getRecipes().find(item => item.id === id);
          return saved?.yeast?.stockItemRef === ref;
        }, { timeout: 20000 }, { id, ref: targetRef });
        await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 15000 });
        const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), id);
        await page.evaluate(() => history.replaceState(null, '', location.pathname));
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        await openRecipeEditor(page, name);
        await clickStep(page, 'Levure');
        await openDisclosure(page, '.yc-sheet-fold');
        const reopened = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), id);
        return { saved, reopened, field: await readField() };
      };

      // Use a fresh recipe after the DB receipt so the Wizard chooses the updated stock record.
      const companionName = `QA choix floc companion ${width}`, companionRecipeId = `QA-FLOC-CHOSEN-${width}`;
      await page.evaluate(() => {
        history.replaceState(null, '', location.pathname);
        window.__hopQa.storage.setUiState('app_active_tab', 'production');
        window.__hopQa.storage.setUiState('production_subtab', 'recipes');
      });
      await makeEmptyRecipe(companionRecipeId, companionName);
      await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, companionName);
      await clickStep(page, 'Levure');
      const acceptedField = await chooseQuickStock('Culture QA floc companion', stockRef);
      assert.match(acceptedField.value, /Low|Faible/i);
      assert.match(acceptedField.provenance, /Recherche IA/);
      assert.match(acceptedField.provenance, /Companion IA QA · flocculation/);
      assert.match(acceptedField.provenance, /28\.09\.2026/);
      assert.equal(acceptedField.href, 'https://example.invalid/qa-flocculation-low');
      const companionFieldShot = await captureReview(page, width, height, `floculation-champ-companion-selectionne-${label}-apres`,
        '.yc-sheet-fold .yc-fact-row[data-sheet-fact="flocculation"]');
      const companionSaved = await saveAndReopen(companionRecipeId, companionName, stockRef);
      assert.deepEqual(companionSaved.field, acceptedField, 'Le champ Floculation retient sa valeur, origine, date et lien après réouverture.');
      assert.deepEqual(companionSaved.saved.yeast.technicalFacts.find(fact => fact.key === 'flocculation')?.acceptedScalarFields,
        ['yeastFlocculation']);
      const companionReopenShot = await captureReview(page, width, height, `floculation-champ-companion-reouvert-${label}-apres`,
        '.yc-sheet-fold .yc-fact-row[data-sheet-fact="flocculation"]');

      // Same historical scalar and the same text fact do not acquire provenance without the apply marker.
      const historicalName = `QA choix floc historique ${width}`, historicalRecipeId = `QA-FLOC-HISTORICAL-${width}`;
      await page.evaluate(() => {
        history.replaceState(null, '', location.pathname);
        window.__hopQa.storage.setUiState('app_active_tab', 'production');
        window.__hopQa.storage.setUiState('production_subtab', 'recipes');
      });
      await makeEmptyRecipe(historicalRecipeId, historicalName);
      await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, historicalName);
      await clickStep(page, 'Levure');
      const historicalField = await chooseQuickStock('Culture QA floc historique', historicalRef);
      assert.match(historicalField.value, /Low|Faible/i);
      assert.equal(historicalField.provenance, '', 'Une observation IA non sélectionnée ne prête pas son origine à l’ancien scalaire.');
      assert.equal(historicalField.href, '');
      const historicalFieldShot = await captureReview(page, width, height, `floculation-champ-scalaire-historique-${label}-apres`,
        '.yc-sheet-fold .yc-fact-row[data-sheet-fact="flocculation"]');
      const historicalSaved = await saveAndReopen(historicalRecipeId, historicalName, historicalRef);
      assert.deepEqual(historicalSaved.field, historicalField);
      const historicalFact = historicalSaved.reopened.yeast.technicalFacts.find(fact => fact.key === 'flocculation');
      assert.equal(historicalFact.acceptedScalarFields, undefined);
      assert.equal(historicalFact.reported, 'Low');
      const historicalReopenShot = await captureReview(page, width, height, `floculation-champ-scalaire-historique-reouvert-${label}-apres`,
        '.yc-sheet-fold .yc-fact-row[data-sheet-fact="flocculation"]');

      assert.deepEqual(remoteRequests, [], `${label}: aucune requête HTTP(S) externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune exception navigateur.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur/alerte console.`);
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.equal(calls.includes('aiTask'), false, `${label}: aucun appel Gemini réel.`);
      return { label, syntheticOnly: true,
        companionCorrection: { targetRef: stockRef, previousScalar: 'Medium', acceptedScalar: 'Low', acceptedScalarFields: ['yeastFlocculation'],
          fieldAfterChoice: acceptedField, fieldAfterSaveReopen: companionSaved.field, sourceUrl: 'https://example.invalid/qa-flocculation-low' },
        historicalCounterexample: { targetRef: historicalRef, scalar: 'Low', sameReportedFact: 'Low', acceptedScalarFields: null,
          fieldAfterChoice: historicalField, fieldAfterSaveReopen: historicalSaved.field },
        captures: [proposalShot, receiptShot, companionFieldShot, companionReopenShot, historicalFieldShot, historicalReopenShot].length,
        calls: [...correctionCalls, ...calls], remoteRequests, pageErrors, consoleErrors };
    };

    const runStarterNoticeScenario = async (page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label) => {
      const protocolFields = {
        label: 'Notice synthétique QA · culture test',
        method: 'Description synthétique pour tester le transport, sans méthode de brassage réelle.',
        targetSg: '1.040', leadMin: '24', leadMax: '36', meaning: 'culture',
        conditions: 'Fixture synthétique de contrôle; aucune croissance ni recommandation de brassage.',
        steps: ['Préparer le milieu de test QA.', 'Effectuer le contrôle synthétique QA.'],
        sourceTitle: 'Fixture QA synthétique · notice non réelle', sourceUrl: 'https://example.invalid/qa-starter-notice',
      };
      const fillNotice = async entrySelector => {
        await fillLabelledInput(page, entrySelector, 'Nom de la méthode', protocolFields.label);
        await selectLabelOption(page, entrySelector, 'Milieu de la notice', 'malt-extract');
        await fillLabelledInput(page, entrySelector, 'Description de la méthode', protocolFields.method);
        await typeNumericInput(page, `${entrySelector} [aria-label="Densité cible publiée du starter"]`, protocolFields.targetSg);
        await typeNumericInput(page, `${entrySelector} [aria-label="Durée publiée, valeur ou minimum en heures"]`, protocolFields.leadMin);
        await typeNumericInput(page, `${entrySelector} [aria-label="Durée publiée, maximum en heures, vide pour une valeur unique"]`, protocolFields.leadMax);
        await selectLabelOption(page, entrySelector, 'Cette durée couvre', protocolFields.meaning);
        await fillLabelledInput(page, entrySelector, 'Conditions de la notice', protocolFields.conditions);
        await typeNumericInput(page, `${entrySelector} [aria-label="Étape 1"]`, protocolFields.steps[0]);
        await clickTextIn(page, entrySelector, 'Ajouter une étape');
        await typeNumericInput(page, `${entrySelector} [aria-label="Étape 2"]`, protocolFields.steps[1]);
        await fillLabelledInput(page, entrySelector, 'Titre', protocolFields.sourceTitle);
        await fillLabelledInput(page, entrySelector, 'Lien https précis', protocolFields.sourceUrl);
        const date = await page.$eval(`${entrySelector} input[type="date"]`, element => element.value);
        assert.match(date, /^\d{4}-\d\d-\d\d$/, 'La date indiquée par le brasseur est renseignée.');
      };
      const source = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      const product = source.yeast.pitching.product;
      assert.equal(product.id, 'wyeast-1007-xl-unspecified');
      assert.equal(product.form, 'liquide');
      assert.equal(product.starter, undefined, 'Le produit exact bootstrap ne porte pas de notice starter.');
      const baseBefore = await page.evaluate(id => window.__hopQa.storage.getYeastProducts().find(item => item.id === id), product.id);
      assert.equal(baseBefore, undefined, 'La fixture bootstrap n’est pas déjà une fiche canonique locale.');

      const prepSelector = '.yp-prep';
      const beforeText = await page.$eval(prepSelector, element => element.innerText);
      assert.match(beforeText, /Aucune méthode de starter documentée/);
      const beforeShot = await captureReview(page, width, height, `starter-produit-sans-notice-${label}-apres`, prepSelector);
      await clickTextIn(page, prepSelector, 'Compléter la notice');
      const entrySelector = '[data-entry="starter"]';
      await page.waitForSelector(entrySelector, { visible: true, timeout: 10000 });
      await fillNotice(entrySelector);
      assert.match(await page.$eval(entrySelector, element => element.innerText), /aucune croissance ni nombre de cellules n’est promis/i);
      const proposalButton = await page.$eval(entrySelector, element => [...element.querySelectorAll('button')]
        .find(button => button.textContent.trim() === 'Proposer l’enregistrement dans la base')?.disabled);
      assert.equal(proposalButton, false, 'Le produit bootstrap autorise une proposition locale vers sa cible exacte.');

      await clickTextIn(page, entrySelector, 'Proposer l’enregistrement dans la base');
      await page.waitForSelector('[aria-label="Notice de préparation manuelle"]', { visible: true, timeout: 15000 });
      await page.waitForFunction(() => document.querySelector('[data-entry="starter"] [role="status"]')?.textContent.includes('Proposition prête'));
      const proposalText = await page.$eval('[aria-label="Notice de préparation manuelle"]', element => element.innerText);
      const proposalSheetText = await page.$eval('[role="dialog"]', element => element.innerText);
      assert.match(proposalText, /Notice QA · Wyeast 1007/);
      assert.match(proposalText, /Notice synthétique QA · culture test/);
      assert.match(proposalText, /1,040/);
      assert.match(proposalText, /24–36 h/);
      assert.match(proposalSheetText, /Aucune croissance ni cellule n’est calculée/);
      assert.match(proposalSheetText, /La cible canonique est absente/);
      await openDisclosure(page, 'details[aria-label="Sources des corrections"]');
      const proposalSources = await page.$eval('details[aria-label="Sources des corrections"]', element => element.innerText);
      assert.match(proposalSources, /Fixture QA synthétique · notice non réelle/);
      assert.match(proposalSources, /date indiquée :/i);
      const proposalShot = await captureReview(page, width, height, `starter-revue-avant-recu-${label}-apres`, '[aria-label="Notice de préparation manuelle"]');
      const recipeBeforeReceipt = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(recipeBeforeReceipt.yeast.pitching.product.starter, undefined, 'La proposition n’adopte pas la notice dans la recette.');

      const remoteBefore = [...remoteRequests];
      await clickTextIn(page, 'body', 'Enregistrer la notice dans la base');
      await page.waitForSelector('[aria-label="Reçu serveur"]', { visible: true, timeout: 15000 });
      const receiptText = await page.$eval('[aria-label="Reçu serveur"]', element => element.innerText);
      assert.match(receiptText, /Reçu serveur confirmé/);
      assert.match(receiptText, /fiche produit créée · notice enregistrée/i);
      const canonicalAfterReceipt = await page.evaluate(id => window.__hopQa.storage.getYeastProducts().find(item => item.id === id), product.id);
      assert.equal(canonicalAfterReceipt.product.starter.label, protocolFields.label);
      const correctionCalls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.equal(correctionCalls.filter(call => call === 'proposeYeastDbCorrection').length, 1);
      assert.equal(correctionCalls.filter(call => call === 'applyYeastDbCorrection').length, 1);
      assert.equal(correctionCalls.includes('aiTask'), false, 'Aucun appel Gemini n’est déclenché pour la saisie manuelle.');
      const receiptShot = await captureReview(page, width, height, `starter-recu-sans-adoption-${label}-apres`, '[aria-label="Reçu serveur"]');
      const savedBeforeAdoption = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(savedBeforeAdoption.yeast.pitching.product.starter, undefined,
        'Le reçu canonique ne change pas la copie déjà choisie dans la recette.');
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        [...(dialog?.querySelectorAll('button') ?? [])].find(button => button.textContent.trim() === 'Fermer')?.click();
      });
      await page.waitForSelector('[aria-label="Reçu serveur"]', { hidden: true, timeout: 10000 });
      assert(await page.$(`${entrySelector} button`), 'L’entrée reste disponible après fermeture du reçu.');
      await clickTextIn(page, entrySelector, 'Retenir cette notice pour la recette');
      await page.waitForFunction(() => document.querySelector('.yp-prep .yp-protocol')?.innerText.includes('Notice synthétique QA · culture test'),
        { timeout: 10000 });
      const adopted = await page.$eval('.yp-prep .yp-protocol', element => element.innerText);
      assert.match(adopted, /Source citée à la main/);
      assert.match(adopted, /Fixture QA synthétique/);
      await clickTextIn(page, '[data-entry="starter"]', 'Fermer');
      await page.waitForSelector('[data-entry="starter"]', { hidden: true, timeout: 10000 });
      const adoptedShot = await captureReview(page, width, height, `starter-notice-adoptee-localement-${label}-apres`, '.yp-prep');

      // The published lead time and a deliberately earlier manual start keep their distinct meanings.
      await clickTextIn(page, prepSelector, 'Planifier la préparation');
      await page.waitForSelector(`${prepSelector} input[type="datetime-local"]`, { visible: true, timeout: 10000 });
      const times = await page.evaluate(() => {
        const localInput = value => {
          const date = new Date(value), pad = number => String(number).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };
        const target = Date.now() + 96 * 3600000;
        return { target: localInput(target), start: localInput(target - 48 * 3600000),
          tooCloseTarget: localInput(Date.now() + 20 * 3600000), tooCloseStart: localInput(Date.now() + 3600000) };
      });
      await setDateTimeValue(page, `${prepSelector} input[type="datetime-local"]`, times.target, 0);
      await setDateTimeValue(page, `${prepSelector} input[type="datetime-local"]`, times.start, 1);
      await typeNumericInput(page, `${prepSelector} [aria-label="Volume de starter retenu en litres"]`, '1');
      await fillLabelledInput(page, prepSelector, 'Inoculum', '1 flacon de test QA');
      await fillLabelledInput(page, prepSelector, 'Matériel', 'Matériel de test QA');
      await clickTextIn(page, prepSelector, 'Planifier');
      await page.waitForFunction(() => document.querySelector('.yp-prep')?.getAttribute('data-preparation') === 'planned', { timeout: 10000 });
      const plannedText = await page.$eval('.yp-prep .yp-plan-state', element => element.innerText);
      assert.match(plannedText, /Début.*choisi/);
      assert.match(plannedText, /1 flacon de test QA/);
      assert.match(plannedText, /Matériel de test QA/);
      const planShot = await captureReview(page, width, height, `starter-plan-manuel-avec-marge-${label}-apres`, prepSelector);

      await clickTextIn(page, prepSelector, 'Corriger ou remplacer');
      await setDateTimeValue(page, `${prepSelector} input[type="datetime-local"]`, times.tooCloseTarget, 0);
      await setDateTimeValue(page, `${prepSelector} input[type="datetime-local"]`, times.tooCloseStart, 1);
      await clickTextIn(page, prepSelector, 'Enregistrer la nouvelle révision');
      await page.waitForSelector(`${prepSelector} [role="alert"]`, { visible: true, timeout: 10000 });
      const tooCloseError = await page.$eval(`${prepSelector} [role="alert"]`, element => element.innerText);
      assert.match(tooCloseError, /Échéance trop proche/i);
      assert.equal(await page.$eval(prepSelector, element => element.getAttribute('data-preparation')), 'planned');
      assert.equal(await page.$eval('.yp-prep .yp-plan-state', element => element.innerText), plannedText,
        'Le refus garde le plan manuel valide précédemment saisi.');
      const refusalShot = await captureReview(page, width, height, `starter-plan-echeance-trop-proche-refuse-${label}-apres`, `${prepSelector} [role="alert"]`);

      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(id => {
        const saved = window.__hopQa.storage.getRecipes().find(item => item.id === id);
        return saved?.yeast.pitching?.product?.starter?.label === 'Notice synthétique QA · culture test'
          && saved?.yeast.pitching?.preparation?.status === 'planned';
      }, { timeout: 20000 }, recipe.id);
      await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 15000 });
      const savedRecipe = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      const savedProtocol = savedRecipe.yeast.pitching.product.starter;
      const savedPlan = savedRecipe.yeast.pitching.preparation;
      assert.equal(savedProtocol.source.origin, 'manual');
      assert.equal(savedPlan.startBasis, 'manual');
      assert.equal(savedPlan.status, 'planned');
      assert.equal(savedPlan.volumeL, 1);
      assert.equal(savedPlan.inoculum, '1 flacon de test QA');
      assert.equal(savedPlan.equipment, 'Matériel de test QA');

      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, recipe.name);
      await clickStep(page, 'Levure');
      await page.waitForSelector('.yp-prep', { visible: true, timeout: 10000 });
      const reopened = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(reopened.yeast.pitching.product.starter.id, savedProtocol.id);
      assert.equal(reopened.yeast.pitching.product.starter.method, protocolFields.method);
      assert.deepEqual(reopened.yeast.pitching.preparation, savedPlan);
      assert.equal(await page.$eval('.yp-prep', element => element.getAttribute('data-preparation')), 'planned');
      const reopenedShot = await captureReview(page, width, height, `starter-offline-reouvert-${label}-apres`, '.yp-prep');

      // Plan an actual QA batch through the production action and inspect its immutable recipe snapshot.
      await page.evaluate(() => {
        window.__hopQa.storage.setUiState('app_active_tab', 'production');
        window.__hopQa.storage.setUiState('production_subtab', 'recipes');
      });
      await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await clickSelector(page, `[aria-label=${JSON.stringify(`Ouvrir la recette ${recipe.name}`)}]`);
      await page.waitForSelector('[aria-label="Modifier la recette"]', { visible: true, timeout: 15000 });
      await clickTextIn(page, 'body', 'Préparer un brassin');
      await page.waitForSelector('[aria-label="Recette à brasser"]', { visible: true, timeout: 15000 });
      await page.select('[aria-label="Recette à brasser"]', recipe.id);
      await clickTextIn(page, '[aria-label="Quand brasser ?"]', 'Autre date', '[role="radio"]');
      await setDateTimeValue(page, 'input[type="date"]', times.target.slice(0, 10));
      await clickTextIn(page, 'body', 'Créer le brassin à brasser');
      await page.waitForFunction(id => window.__hopQa.storage.getBatches().some(item => item.recipeRef === id), { timeout: 20000 }, recipe.id);
      const batch = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.recipeRef === id), recipe.id);
      assert(batch.recipeSnapshot?.yeast?.pitching?.product?.starter, 'Le brassin planifié capture la notice produit exacte.');
      assert.equal(batch.recipeSnapshot.yeast.pitching.product.starter.id, savedProtocol.id);
      assert.equal(batch.recipeSnapshot.yeast.pitching.preparation.id, savedPlan.id);
      assert.equal(batch.recipeSnapshot.yeast.pitching.preparation.startBasis, 'manual');
      assert.equal(batch.brewDay, undefined);

      // A recipe-only exact product can keep a cited notice locally while publication remains disabled.
      const localName = `QA notice locale ${width}`;
      const localProductId = `qa-local-only-starter-${width}`;
      await page.evaluate(({ sourceId, localName, localProductId }) => {
        window.__hopQa.storage.setUiState('app_active_tab', 'production');
        window.__hopQa.storage.setUiState('production_subtab', 'recipes');
        const sourceRecipe = window.__hopQa.storage.getRecipes().find(item => item.id === sourceId);
        const next = structuredClone(sourceRecipe);
        next.id = localProductId;
        next.name = localName;
        const product = structuredClone(next.yeast.pitching.product);
        product.id = localProductId;
        product.label = `Produit local QA ${localProductId}`;
        product.source = { title: 'Fiche saisie locale QA', url: 'https://example.invalid/local-only-product',
          checkedAt: '2026-09-28', origin: 'manual' };
        delete product.starter;
        next.yeast.name = product.label;
        next.yeast.pitching = { ...next.yeast.pitching, product,
          lot: undefined, offer: undefined, rate: undefined, preparation: undefined };
        delete next.yeast.stockItemRef;
        window.__hopQa.seedRecipe(next);
      }, { sourceId: recipe.id, localName, localProductId });
      await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, localName);
      await clickStep(page, 'Levure');
      await clickTextIn(page, '.yp-prep', 'Compléter la notice');
      await page.waitForSelector('[data-entry="starter"]', { visible: true, timeout: 10000 });
      await fillNotice('[data-entry="starter"]');
      const localEntryText = await page.$eval('[data-entry="starter"]', element => element.innerText);
      assert.match(localEntryText, /crée d’abord sa fiche produit dans la base/i);
      const disabledLocalProposal = await page.$eval('[data-entry="starter"]', element => [...element.querySelectorAll('button')]
        .find(button => button.textContent.trim() === 'Proposer l’enregistrement dans la base')?.disabled);
      assert.equal(disabledLocalProposal, true, 'Une copie produit absente de la base ne permet pas de proposer seulement sa notice.');
      const localDisabledShot = await captureReview(page, width, height, `starter-copie-locale-proposition-desactivee-${label}-apres`, '[data-starter-base="needs-product"]');
      await clickTextIn(page, '[data-entry="starter"]', 'Retenir cette notice pour la recette');
      await page.waitForFunction(() => document.querySelector('.yp-prep .yp-protocol')?.innerText.includes('Notice synthétique QA · culture test'),
        { timeout: 10000 });
      const localProtocolText = await page.$eval('.yp-prep .yp-protocol', element => element.innerText);
      assert.match(localProtocolText, /Source citée à la main/);
      await clickTextIn(page, '[data-entry="starter"]', 'Fermer');
      await page.waitForSelector('[data-entry="starter"]', { hidden: true, timeout: 10000 });
      const localCopyShot = await captureReview(page, width, height, `starter-copie-locale-retenue-${label}-apres`, '.yp-prep');
      const localOnlyCalls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.equal(localOnlyCalls.some(call => ['proposeYeastDbCorrection', 'applyYeastDbCorrection'].includes(call)), false,
        'Garder une notice de recette locale n’appelle pas la base canonique.');

      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.product?.starter?.source?.origin === 'manual',
        { timeout: 20000 }, localProductId);
      await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 15000 });
      const localSaved = await page.evaluate(id => ({ recipe: window.__hopQa.storage.getRecipes().find(item => item.id === id),
        canonical: window.__hopQa.storage.getYeastProducts().find(item => item.id === id) }), localProductId);
      assert.match(localSaved.recipe.yeast.pitching.product.starter.id, /^yeast-starter-manual-/);
      assert.equal(localSaved.recipe.yeast.pitching.product.starter.source.origin, 'manual');
      assert.equal(localSaved.canonical, undefined, 'L’action locale ne publie pas le produit ni sa notice.');
      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, localName);
      await clickStep(page, 'Levure');
      const localReopened = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), localProductId);
      assert.equal(localReopened.yeast.pitching.product.starter.source.origin, 'manual');
      assert.equal(localReopened.yeast.pitching.product.starter.label, protocolFields.label);
      const localReopenShot = await captureReview(page, width, height, `starter-copie-locale-reouverte-${label}-apres`, '.yp-prep');

      const localCopyCalls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(remoteRequests, [], `${label}: aucune requête HTTP(S) externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune exception navigateur.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
      assert.equal([...correctionCalls, ...localOnlyCalls, ...localCopyCalls].includes('aiTask'), false, `${label}: aucun appel Gemini.`);
      return { label, syntheticOnly: true, product: { id: product.id, form: product.form, noExistingNotice: true, format: product.format ?? null },
        manualProtocol: savedProtocol, manualStartPlan: savedPlan, nearDeadlineRefused: tooCloseError,
        proposalReviewVisible: proposalText, serverReceipt: receiptText, voluntaryLocalAdoption: true,
        readback: { canonicalStarter: canonicalAfterReceipt.product.starter.id, readback: 'refreshed', noAutoAdoption: true },
        offlineReopen: { protocol: reopened.yeast.pitching.product.starter, plan: reopened.yeast.pitching.preparation },
        batchSnapshot: { id: batch.id, status: batch.status, planId: batch.recipeSnapshot.yeast.pitching.preparation.id,
          protocolId: batch.recipeSnapshot.yeast.pitching.product.starter.id },
        recipeOnlyCopy: { productId: localProductId, proposalDisabled: disabledLocalProposal, sourceOrigin: localReopened.yeast.pitching.product.starter.source.origin,
          savedOffline: true, canonicalProductAbsent: localSaved.canonical === undefined },
        screenshotNames: [beforeShot, proposalShot, receiptShot, adoptedShot, planShot, refusalShot, reopenedShot,
          localDisabledShot, localCopyShot, localReopenShot].length,
        calls: [...correctionCalls, ...localOnlyCalls, ...localCopyCalls], remoteRequests, pageErrors, consoleErrors };
    };

    for (const [width, height, label] of [[390, 844, labels[0]], [1280, 900, labels[1]]]) {
      if (focusPreJ0 && width !== 1280) continue;
      const context = await browser.createBrowserContext();
      await context.overridePermissions(base, ['clipboard-read', 'clipboard-sanitized-write']);
      const page = await context.newPage();
      const remoteRequests = [], pageErrors = [], consoleErrors = [];
      await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = request.url();
        if (/^https?:/i.test(url) && !url.startsWith(`${base}/`)) { remoteRequests.push(url); request.abort(); }
        else request.continue();
      });
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (['error', 'warning'].includes(message.type())) consoleErrors.push({ type: message.type(), text: message.text() });
      });
      await page.evaluateOnNewDocument(() => {
        if (!sessionStorage.getItem('__HOP_QA_INITIAL_UI_STATE__')) {
          localStorage.setItem('laffinee_ui_state', JSON.stringify({ app_active_tab: 'production', production_subtab: 'recipes' }));
          sessionStorage.setItem('__HOP_QA_INITIAL_UI_STATE__', '1');
        }
      });
      await page.goto(`${base}/?ux-poc=reset`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());

      if (focusPreJ0) {
        afterRuns.push(await runPreJ0Scenario(page, remoteRequests, pageErrors, consoleErrors));
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusPreJ0Late) {
        afterRuns.push(await runPreJ0LateScenario(page, remoteRequests, pageErrors, consoleErrors, width, height, label));
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }

      let qaEquipment;
      if (!focusClaude02 && !focusCompareS1 && !focusManualSupply && !focusM20Source && !focusOfferContext && !focusWortIdentity && !focusFreeLocalWort && !focusFlocculationProvenance && !focusPerformanceIntegration) {
        // The shared QA seed config has no physical equipment. Install a clearly
        // synthetic, local-only 80 L profile so the full snapshot path can be exercised.
        qaEquipment = await page.evaluate(() => {
          const config = window.__hopQa.storage.getConfig();
          const id = 'QA-BREWHOUSE-REFONTE-80L';
          const profile = {
            id, name: 'Banc QA synthétique · 80 L', volumeL: 80, efficiencyPct: 75,
            boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
            equipment: { kettleCapacityL: 120, kettleWorkingL: 100, workingVolumeConfirmed: true,
              spargeCapacityL: 100, fermenterCapacityL: 80, fermenterHeadspacePct: 20, roPackL: 5,
              boilOffLPerHour: 5, grainAbsorptionLPerKg: 0.96, grainDisplacementLPerKg: 0.67,
              coolingShrinkagePct: 4, heatingRateCPerMin: 0.5 }
          };
          config.brewhouses = [profile, ...config.brewhouses.filter(item => item.id !== id)];
          config.activeBrewhouseId = id;
          window.__hopQa.storage.saveConfig(config);
          history.replaceState(null, '', location.pathname);
          return { id, name: profile.name, synthetic: true };
        });
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        assert.equal(await page.evaluate(() => window.__hopQa.storage.getConfig().activeBrewhouseId), qaEquipment.id);
        manifest.qaEquipment = qaEquipment;
      }

      const name = focusPerformanceIntegration ? `QA performance moût lié ${width}` : focusWortIdentity ? `QA moût lié ${width}` : focusFreeLocalWort ? `QA moût libre documenté ${width}`
        : focusFlocculationProvenance ? `QA floculation source ${width}`
        : focusStarterNotice ? `QA notice starter ${width}` : `QA levure appro ${width}`;
      const recipe = await page.evaluate(({ name, width, compareS1, manualSupply, offerContext, wortIdentity, freeLocalWort, flocProvenance, starterNotice, starterProduct, performanceIntegration }) => {
        const seed = performanceIntegration ? window.__hopQa.nolo.fruty()
          : window.__hopQa.storage.getRecipes().find(item => item.name === 'Weissbier de contrôle');
        if (!seed) throw Error('La fixture yeastFlowRecipe n’a pas été injectée par le banc QA.');
        const next = structuredClone(seed);
        next.id = `QA-YEAST-REFONTE-${width}`;
        next.name = name;
        next.style = 'Hefeweizen';
        next.styleRef = undefined;
        if (performanceIntegration) next.nolo = undefined;
        next.yeastDesign = undefined;
        next.yeastGuide = undefined;
        if (wortIdentity || performanceIntegration) {
          const source = { url: 'https://example.invalid/qa-local-yeast', title: 'Fiche locale QA A', checkedAt: '2026-09-27' };
          const product = { id: 'qa-local-yeast-product-a', referenceId: 'qa-local-yeast-a', label: 'Produit local QA A · 125 mL',
            manufacturer: 'Laboratoire QA A', form: 'liquide', source,
            format: { amount: 125, unit: 'mL', label: '125 mL', source } };
          const stockA = { id: 'QA-WORT-STOCK-A', ref: 'QA-WORT-STOCK-A', name: 'Culture locale stock A QA', category: 'Levure',
            unit: 'flacon', currentStock: 2, minStock: 0, reorder: false, yeastLab: 'Laboratoire QA A', yeastStrain: 'QA-A',
            yeastForm: 'liquide', yeastLot: { productId: product.id, lotNumber: 'LOT-A-QA' } };
          const stockB = { id: 'QA-WORT-STOCK-B', ref: 'QA-WORT-STOCK-B', name: 'Culture stock B QA', category: 'Levure',
            unit: 'flacon', currentStock: 3, minStock: 0, reorder: false, yeastLab: 'Laboratoire QA B', yeastStrain: 'QA-B', yeastForm: 'liquide' };
          window.__hopQa.storage.addStockItem('rawMaterials', stockA);
          window.__hopQa.storage.addStockItem('rawMaterials', stockB);
          next.yeast = { name: stockA.name, lab: stockA.yeastLab, strain: stockA.yeastStrain, form: stockA.yeastForm,
            qty: 1, unit: 'flacon', stockItemRef: stockA.ref,
            localDocumentary: { version: 1, documentary: { lab: stockA.yeastLab, strain: stockA.yeastStrain,
              form: stockA.yeastForm, technicalSource: 'Fiche locale synthétique QA A' } },
            pitching: { version: 1, product, lot: { productId: product.id, lotNumber: 'LOT-A-QA' } } };
        } else if (freeLocalWort) next.yeast = { name: 'Culture libre documentée QA', lab: 'Fabricant QA', form: 'liquide', qty: 125, unit: 'mL',
          localDocumentary: { version: 1, documentary: { form: 'liquide', lab: 'Fabricant QA' } },
          pitching: { version: 1, wort: { basis: 'hypothesis', volumeL: 25, volumeBasis: 'hypothesis', sg: 1.048, sgBasis: 'hypothesis' } } };
        else if (flocProvenance) {
          const fact = { key: 'flocculation', reported: 'Low', context: 'Beer', origin: 'ai', source: 'Companion IA QA · historique sans marqueur',
            sourceUrl: 'https://example.invalid/qa-flocculation-low', retrievedAt: '2026-09-28T00:00:00.000Z' };
          const companion = { id: 'QA-FLOC-COMPANION', ref: 'QA-FLOC-COMPANION', name: 'Culture QA floc companion', category: 'Levure',
            unit: 'flacon', currentStock: 2, minStock: 0, reorder: false, yeastLab: 'Laboratoire QA', yeastStrain: 'FLOC-A',
            yeastForm: 'liquide', yeastFlocculation: 'Medium' };
          const historical = { id: 'QA-FLOC-HISTORICAL', ref: 'QA-FLOC-HISTORICAL', name: 'Culture QA floc historique', category: 'Levure',
            unit: 'flacon', currentStock: 1, minStock: 0, reorder: false, yeastLab: 'Laboratoire QA', yeastStrain: 'FLOC-B',
            yeastForm: 'liquide', yeastFlocculation: 'Low', yeastTechnicalFacts: [fact] };
          window.__hopQa.storage.addStockItem('rawMaterials', companion);
          window.__hopQa.storage.addStockItem('rawMaterials', historical);
          next.yeast = { name: companion.name, lab: companion.yeastLab, strain: companion.yeastStrain, form: companion.yeastForm,
            qty: 1, unit: 'flacon', stockItemRef: companion.ref, flocculation: companion.yeastFlocculation };
        }
        else if (starterNotice) next.yeast = { name: starterProduct.label, lab: starterProduct.manufacturer, strain: starterProduct.referenceId,
          hopIndexId: starterProduct.referenceId, form: starterProduct.form, qty: 1, unit: 'flacon', pitchTempC: 20,
          pitching: { version: 1, product: structuredClone(starterProduct),
            wort: { basis: 'measured', volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' } } };
        else next.yeast = manualSupply ? { name: 'Wyeast 3068 Weihenstephan Weizen', lab: 'Wyeast', strain: '3068 Weihenstephan Weizen',
          hopIndexId: 'wyeast-3068', form: 'liquide', qty: 1, unit: 'flacon', pitchTempC: 20,
          pitching: { version: 1, wort: { basis: 'measured', volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured' } } }
          : { name: 'Wyeast 1007 German Ale', lab: 'Wyeast Laboratories', strain: '1007 German Ale',
            hopIndexId: 'wyeast-1007', form: 'liquide', qty: 1, unit: 'sachet', pitchTempC: 20 };
        if (compareS1 || offerContext) next.yeast.pitching = { version: 1, wort: {
          basis: 'measured', volumeL: 40, volumeBasis: 'measured', sg: 1.05, sgBasis: 'measured'
        } };
        if (!performanceIntegration) next.volumeL = 40;
        next.ogTarget = 1.05;
        window.__hopQa.seedRecipe(next);
        let performance;
        if (performanceIntegration) {
          const other = structuredClone(next);
          other.id = `QA-YEAST-PERFORMANCE-B-${width}`;
          other.name = `QA performance recette B ${width}`;
          other.volumeL = 18;
          other.yeast = { name: 'Levure alternative synthétique QA', form: 'sèche', qty: 1, unit: 'sachet' };
          window.__hopQa.seedRecipe(other);
          const storedRecipe = window.__hopQa.storage.getRecipes().find(item => item.id === next.id);
          const batchId = `QA-YEAST-PERFORMANCE-SNAPSHOT-${width}`;
          window.__hopQa.storage.planRecipeBatch(storedRecipe, batchId, '2026-09-28');
          const batch = window.__hopQa.storage.getBatches().find(item => item.id === batchId);
          if (!batch?.recipeSnapshot) throw Error('Snapshot synthétique manquant pour le parcours combiné.');
          performance = { otherRecipeId: other.id, otherRecipeName: other.name, batchId,
            recipeSnapshot: structuredClone(batch.recipeSnapshot), waterPlan: structuredClone(storedRecipe.waterPlan),
            hops: structuredClone(storedRecipe.hops), localDocumentary: structuredClone(storedRecipe.yeast.localDocumentary) };
        }
        const stock = window.__hopQa.storage.getStocks().rawMaterials.find(item => item.ref === 'qa-us05');
        return { id: next.id, name: next.name, yeast: next.yeast, mash: next.mash, fermentation: next.fermentation, stock, performance,
          waterPlan: structuredClone(next.waterPlan), hops: structuredClone(next.hops) };
      }, { name, width, compareS1: focusCompareS1, manualSupply: focusManualSupply, offerContext: focusOfferContext,
        wortIdentity: focusWortIdentity || focusPerformanceIntegration, freeLocalWort: focusFreeLocalWort, flocProvenance: focusFlocculationProvenance, starterNotice: focusStarterNotice,
        starterProduct: focusStarterNotice ? qaStarterEntryProduct : undefined, performanceIntegration: focusPerformanceIntegration });
      if (focusManualSupply) {
        assert.equal(recipe.yeast.hopIndexId, 'wyeast-3068');
        assert.equal(recipe.yeast.qty, 1);
        assert.equal(recipe.yeast.unit, 'flacon');
      } else if (focusWortIdentity) {
        assert.equal(recipe.yeast.name, 'Culture locale stock A QA');
        assert.equal(recipe.yeast.stockItemRef, 'QA-WORT-STOCK-A');
        assert.equal(recipe.yeast.localDocumentary?.version, 1);
        assert.equal(recipe.yeast.pitching.product.id, 'qa-local-yeast-product-a');
        assert.equal(recipe.yeast.pitching.lot.lotNumber, 'LOT-A-QA');
      } else if (focusPerformanceIntegration) {
        assert.equal(recipe.yeast.name, 'Culture locale stock A QA');
        assert.equal(recipe.yeast.localDocumentary?.version, 1);
        assert.equal(recipe.yeast.pitching.wort, undefined);
        assert(recipe.waterPlan?.sourceSnapshot, 'La fixture combinée conserve son analyse d’eau source.');
        assert(recipe.hops.length > 0, 'La fixture combinée conserve les ajouts de houblon.');
        manifest.performanceIntegrationFixture = { id: recipe.id, name: recipe.name, otherRecipeId: recipe.performance.otherRecipeId,
          batchId: recipe.performance.batchId, waterPlanSource: recipe.waterPlan.sourceSnapshot.name, hopRows: recipe.hops.length };
      } else if (focusStarterNotice) {
        assert.equal(recipe.yeast.pitching.product.id, 'wyeast-1007-xl-unspecified');
        assert.equal(recipe.yeast.pitching.product.form, 'liquide');
        assert.equal(recipe.yeast.pitching.product.starter, undefined);
        assert.equal(recipe.yeast.pitching.wort.volumeBasis, 'measured');
      } else if (focusFreeLocalWort) {
        assert.equal(recipe.yeast.hopIndexId, undefined);
        assert.equal(recipe.yeast.stockItemRef, undefined);
        assert.equal(recipe.yeast.localDocumentary?.version, 1);
        assert.equal(recipe.yeast.localDocumentary.documentary.form, 'liquide');
        assert.equal(recipe.yeast.pitching.wort.volumeBasis, 'hypothesis');
      } else if (focusFlocculationProvenance) {
        assert.equal(recipe.yeast.stockItemRef, 'QA-FLOC-COMPANION');
        assert.equal(recipe.yeast.flocculation, 'Medium');
      } else {
        assert.equal(recipe.yeast.hopIndexId, 'wyeast-1007');
        assert.equal(recipe.yeast.qty, 1);
        assert.equal(recipe.yeast.unit, 'sachet');
        assert.equal(recipe.stock?.name, 'SafAle US-05');
        assert.equal(recipe.stock?.currentStock, 1);
        assert.equal(recipe.stock?.yeastLot, undefined, 'L’homonyme QA n’a pas de référence de produit ou de lot.');
      }

      const performanceNavigation = focusPerformanceIntegration
        ? await runPerformanceIntegrationNavigation(page, recipe, width, height, label)
        : undefined;
      if (performanceNavigation) manifest.performanceIntegrationByViewport ??= [];
      if (performanceNavigation) manifest.performanceIntegrationByViewport.push({ viewport: label, ...performanceNavigation });

      await openRecipeEditor(page, name);
      if (qaEquipment) {
        const adapt = await page.waitForFunction(() => [...document.querySelectorAll('.recipe-wizard button')]
          .find(button => button.getClientRects().length && button.textContent.trim().startsWith('Adapter à mon matériel actuel · Banc QA synthétique')),
        { timeout: 15000 });
        await adapt.asElement().evaluate(element => element.scrollIntoView({ block: 'center' }));
        await adapt.asElement().click();
        await page.waitForFunction(() => document.querySelector('.recipe-wizard')?.innerText.includes('Recette adaptée à 40 L'), { timeout: 15000 });
      }
      await clickStep(page, 'Levure');
      await page.waitForSelector('[aria-label="Choisir la levure de la recette"]', { visible: true });
      if (focusWortIdentity || focusPerformanceIntegration) {
        const wortIdentityResult = await runWortIdentityScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label);
        if (focusPerformanceIntegration) {
          const finalState = await page.evaluate(({ recipeId, batchId }) => {
            const saved = window.__hopQa.storage.getRecipes().find(item => item.id === recipeId);
            const batch = window.__hopQa.storage.getBatches().find(item => item.id === batchId);
            return { saved, batch };
          }, { recipeId: recipe.id, batchId: recipe.performance.batchId });
          const waterIntent = plan => {
            const { startIons: _startIons, wortIons: _wortIons, ...inputs } = plan;
            return inputs;
          };
          assert.deepEqual(waterIntent(finalState.saved.waterPlan), waterIntent(recipe.performance.waterPlan),
            'Les champs source, cible et doses du plan d’eau restent inchangés; seuls les ions dérivés du Wizard peuvent être recalculés.');
          assert(finalState.saved.waterPlan.startIons && finalState.saved.waterPlan.wortIons,
            'Les deux jeux d’ions dérivés restent attachés au plan d’eau sauvegardé.');
          assert.deepEqual(finalState.saved.hops, recipe.performance.hops,
            'L’édition du moût pitching ne remplace pas les ajouts de houblon sauvegardés.' );
          assert.deepEqual(finalState.batch.recipeSnapshot, recipe.performance.recipeSnapshot,
            'Le snapshot du brassin antérieur reste strictement identique après sauvegarde et réouverture de la recette.' );
          wortIdentityResult.performanceIntegration = { navigation: performanceNavigation,
            snapshotUnchangedAfterSaveAndReopen: true, waterPlanInputsUnchanged: true, hopsUnchanged: true,
            batchId: recipe.performance.batchId,
            waterPlanDerivedIons: { before: { startIons: recipe.performance.waterPlan.startIons ?? null,
              wortIons: recipe.performance.waterPlan.wortIons ?? null },
              after: { startIons: finalState.saved.waterPlan.startIons,
                wortIons: finalState.saved.waterPlan.wortIons } },
            snapshot: { waterSource: finalState.batch.recipeSnapshot.waterPlan?.sourceSnapshot?.name ?? null,
              hopRows: finalState.batch.recipeSnapshot.hops?.length ?? 0 },
            finalRecipeIdentity: finalState.saved.yeast.name,
            localDocumentaryAfterDeliberateIdentitySwitch: finalState.saved.yeast.localDocumentary ?? null };
        }
        afterRuns.push(wortIdentityResult);
        if (!wortIdentityResult.documentaryModelUnchanged || !wortIdentityResult.documentaryDiffUnchanged) failures.push({ viewport: label,
          issue: 'documentary state or UI diff changed after wort-only entry',
          modelBefore: wortIdentityResult.documentaryModelBeforeWort, modelAfter: wortIdentityResult.documentaryModelAfterWort,
          uiBefore: wortIdentityResult.documentaryDiffBeforeWort, uiAfter: wortIdentityResult.documentaryDiffAfterWort });
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusFreeLocalWort) {
        afterRuns.push(await runFreeLocalWortScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label));
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusFlocculationProvenance) {
        afterRuns.push(await runFlocculationProvenanceScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label));
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusStarterNotice) {
        afterRuns.push(await runStarterNoticeScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label));
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusM20Source) {
        const m20Result = await runM20SourceScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label);
        afterRuns.push(m20Result);
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusOfferContext) {
        const offerContextResult = await runOfferProductContextScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label);
        afterRuns.push(offerContextResult);
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      if (focusManualSupply) {
        const manualResult = await runManualSupplyScenario(page, recipe, remoteRequests, pageErrors, consoleErrors, width, height, label);
        afterRuns.push(manualResult);
        failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
        await context.close();
        continue;
      }
      const xl = await page.waitForFunction(() => [...document.querySelectorAll('.yp-products li[data-product="wyeast-1007-xl-unspecified"]')]
        .find(element => element.getClientRects().length), { timeout: 15000 });
      const xlText = await xl.asElement().evaluate(element => element.innerText);
      assert.match(xlText, /volume non communiqué/i, 'Le produit XL reste sans format confirmé.');
      assert.match(xlText, /Hors stock/i, 'L’offre observée hors stock n’est pas présentée comme achetable.');
      const initialShot = await captureReview(page, width, height, `levure-xl-reference-${label}-apres`, '.yc-strain-station');
      assert.match(initialShot.visibleText, /Wyeast 1007/i);

      // Comparaison explicitement demandée, refermée sans changer la référence.
      if (!focusClaude03Packs) {
        await page.locator('[aria-label="Chercher une autre levure"]').fill('US-05');
        await page.waitForSelector('.yc-list li[data-candidate-id="fermentis-us05"]', { visible: true });
        await clickSelector(page, '.yc-list li[data-candidate-id="fermentis-us05"] input[aria-label^="Comparer"]');
        await clickSelector(page, '.yc-compare-open');
        const comparison = await page.waitForSelector('[aria-label="Comparaison des levures"]', { visible: true });
        const comparisonText = await comparison.evaluate(element => element.innerText);
        assert.match(comparisonText, /Wyeast 1007/i);
        assert.match(comparisonText, /SafAle US-05/i);
        const beforeDirectChoice = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast,
          recipe.id);
        assert.equal(beforeDirectChoice.hopIndexId, 'wyeast-1007', 'Comparer ne change pas la recette.');
        assert.equal(beforeDirectChoice.qty, 1);
        if (focusCompareS1) {
          const supplyWort = await page.$eval('[data-supply-wort]', element => element.innerText);
          assert.match(supplyWort, /40 L · mesuré/);
          assert.match(supplyWort, /SG 1,050 · mesuré/);
          const supplyRows = await page.$$eval('[data-supply-comparison] tbody[data-criterion="supply-products"] tr', rows => rows.map(row => ({
            id: row.getAttribute('data-supply-product'), role: row.getAttribute('data-reference-role'), text: row.innerText
          })));
          assert.deepEqual(supplyRows.map(row => [row.id, row.role]), [
            ['wyeast-1007-xl-unspecified', 'selected-reference'], ['fermentis-us05-11_5g', 'alternative-reference']
          ]);
          assert.match(supplyRows[0].text, /Format non communiqué · packs inconnus/);
          assert.match(supplyRows[0].text, /Packs inconnus|Inconnu/);
          assert.match(supplyRows[1].text, /20–32 g/);
          assert.match(supplyRows[1].text, /2–3 sachets/);
          const wyeastOfferSelector = '[data-supply-offer="brau-rauch-wyeast1007-he1007xl-20260927"]';
          const offerState = await page.$eval(wyeastOfferSelector, element => ({ buyable: element.getAttribute('data-buyable'), text: element.innerText }));
          assert.equal(offerState.buyable, 'false');
          assert.match(offerState.text, /Hors stock/);
          assert.match(offerState.text, /prix non relevé|13,50 CHF/i);

          const referenceProductFacts = 'tr[data-supply-product="wyeast-1007-xl-unspecified"] .yc-compare-col > details.yc-fact-source';
          const referenceProductSources = `${referenceProductFacts} details[data-source-documents="product"]`;
          const doseFacts = 'tr[data-supply-product="fermentis-us05-11_5g"] td[data-supply-row="dose"] .yc-candidate-details > details.yc-fact-source';
          const doseSources = `${doseFacts} details[data-source-documents="dose"]`;
          let sourceFactsVerified = false;
          let mobileComparisonLayout;
          if (width === 1280) {
            await openDisclosure(page, referenceProductFacts);
            const referenceSourceText = await page.$eval(referenceProductFacts, element => element.innerText);
            assert.match(referenceSourceText, /Origine non précisée/,
              'Le bootstrap ne porte pas origin; l’écran garde cette inconnue au lieu d’inférer Fabricant depuis le titre/l’URL.');
            assert.match(referenceSourceText, /(?:relevé le|date indiquée\s*:?)\s*27\.09\.2026/);
            await openDisclosure(page, referenceProductSources);
            assert.equal(await page.$$eval(`${referenceProductSources} a`, links => links.length), 1,
              'Les observations de produit et format gardent leurs dates et partagent le lien unique de la même source.');
            await openDisclosure(page, doseFacts);
            const doseSourceText = await page.$eval(doseFacts, element => element.innerText);
            assert.match(doseSourceText, /Origine non précisée/,
              'Le repère de dose garde l’origine absente comme inconnue; son titre, URL et date restent visibles.');
            assert.match(doseSourceText, /(?:relevé le|date indiquée\s*:?)\s*27\.09\.2026/);
            await openDisclosure(page, doseSources);
            assert.equal(await page.$$eval(`${doseSources} a`, links => links.length), 1,
              'Les observations de dose et le calcul conservent leur origine/date, avec un lien par URL commune.');
            sourceFactsVerified = true;
          } else {
            mobileComparisonLayout = await page.$eval('[data-supply-comparison] .yc-compare-scroll[aria-label="Produits, formats, doses et offres"]', element => ({
              clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
              tableWidth: element.querySelector('table')?.getBoundingClientRect().width,
              productColumnWidth: element.querySelector('th[scope="row"]')?.getBoundingClientRect().width,
              doseColumnWidth: element.querySelector('td[data-supply-row="dose"]')?.getBoundingClientRect().width,
              preparationColumnWidth: element.querySelector('td[data-supply-row="preparation"]')?.getBoundingClientRect().width,
              offerColumnWidth: element.querySelector('td[data-supply-row="offers"]')?.getBoundingClientRect().width,
              documentWidth: document.documentElement.scrollWidth
            }));
            if (mobileComparisonLayout.scrollWidth <= mobileComparisonLayout.clientWidth ||
              [mobileComparisonLayout.productColumnWidth, mobileComparisonLayout.doseColumnWidth,
                mobileComparisonLayout.preparationColumnWidth, mobileComparisonLayout.offerColumnWidth].some(column => column < 72)) {
              manifest.s1MobileLayoutFinding = { viewport: { width, height },
                description: 'Le sous-tableau Produits, formats, doses et offres n’impose pas un défilement horizontal lisible à 390 px.',
                metrics: mobileComparisonLayout,
                evidence: resolve(evidenceDir, `failure-1.png`) };
            }
          }

          await clickTextIn(page, '.yp-wort', 'Corriger');
          const volumeLatency = [], densityLatency = [];
          for (let sample = 0; sample < 20; sample++) {
            const volume = sample % 2 === 0 ? '39.8' : '40';
            volumeLatency.push(await measureMutation(page, '[data-supply-wort]', () => page.locator('[aria-label="Volume du moût à ensemencer en litres"]').fill(volume)));
            const sg = sample % 2 === 0 ? '1.051' : '1.050';
            densityLatency.push(await measureMutation(page, '[data-supply-wort]', () => page.locator('[aria-label="Densité du moût à ensemencer en SG"]').fill(sg)));
          }
          await page.locator('[aria-label="Volume du moût à ensemencer en litres"]').fill('40');
          await page.locator('[aria-label="Densité du moût à ensemencer en SG"]').fill('1.050');
          const percentile = values => {
            const sorted = [...values].sort((a, b) => a - b);
            return { n: sorted.length, p50Ms: sorted[Math.floor((sorted.length - 1) * 0.5)],
              p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1], maxMs: sorted.at(-1), samples: sorted };
          };
          const latency = { method: 'performance.now() + MutationObserver, début juste avant le remplissage Puppeteer, fin à la mise à jour visible du moût commun dans la comparaison; fixture/adaptateur local sans réseau; 20 échantillons par signal et largeur; hors saisie physique, démarrage à froid, synchronisation réelle et compréhension humaine.',
            viewport: label, volumeToComparisonWort: percentile(volumeLatency), densityToComparisonWort: percentile(densityLatency) };
          await captureReview(page, width, height, `levure-comparaison-s1-moût-${label}-apres`, '.yc-supply-comparison');
          let mobileSupplyScroll;
          if (width === 390) {
            mobileSupplyScroll = await page.$eval('[data-supply-comparison] .yc-compare-scroll[aria-label="Produits, formats, doses et offres"]', element => {
              element.scrollLeft = 0;
              element.focus();
              const before = { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
                describedBy: element.getAttribute('aria-describedby'), hintText: element.getAttribute('aria-describedby')
                  ? document.getElementById(element.getAttribute('aria-describedby'))?.innerText : '' };
              return before;
            });
            await page.keyboard.press('ArrowRight');
            const afterKeyboardScroll = await page.$eval('[data-supply-comparison] .yc-compare-scroll[aria-label="Produits, formats, doses et offres"]', element => element.scrollLeft);
            assert.ok(afterKeyboardScroll > 0, 'Le lecteur clavier peut avancer dans les colonnes du sous-tableau.');
            const mobileStartMetrics = mobileSupplyScroll;
            const mobileEndMetrics = await page.$eval('[data-supply-comparison] .yc-compare-scroll[aria-label="Produits, formats, doses et offres"]', element => {
              element.scrollLeft = element.scrollWidth;
              return { scrollLeft: element.scrollLeft };
            });
            mobileSupplyScroll = { ...mobileStartMetrics, keyboardScrollLeft: afterKeyboardScroll, ...mobileEndMetrics };
            assert.ok(mobileSupplyScroll.scrollWidth > mobileSupplyScroll.clientWidth && mobileSupplyScroll.scrollLeft > 0,
              'La comparaison de produits reste consultable par défilement horizontal sur mobile sans élargir la page.');
            assert.match(mobileSupplyScroll.hintText, /horizontalement|balay|flèches/i);
            await captureReview(page, width, height, `levure-comparaison-s1-colonne-alternative-${label}-apres`, '.yc-supply-comparison');
          }
          await clickSelector(page, '.yc-compare-open');
          const afterVoluntaryComparison = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast, recipe.id);
          assert.equal(afterVoluntaryComparison.hopIndexId, 'wyeast-1007');
          assert.equal(afterVoluntaryComparison.qty, 1);
          assert.equal(afterVoluntaryComparison.unit, 'sachet');
          assert.equal(afterVoluntaryComparison.pitching.product, undefined);
          assert.equal(afterVoluntaryComparison.pitching.offer, undefined);
          const calls = await page.evaluate(() => [...window.__hopQa.calls]);
          assert.deepEqual(remoteRequests, [], `${label}: aucune requête externe.`);
          assert.deepEqual(pageErrors, [], `${label}: aucune erreur JavaScript.`);
          assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
          assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation'].includes(call)), [],
            `${label}: comparaison S1 pure, sans appel serveur ou IA.`);
          afterRuns.push({ label, recipeId: recipe.id, flow: 'comparaison S1 à demande volontaire',
            reference: { id: 'wyeast-1007', productId: 'wyeast-1007-xl-unspecified', format: 'unknown', offerState: offerState.buyable },
            alternative: { id: 'fermentis-us05', productId: 'fermentis-us05-11_5g', doseForMeasuredWort: '20–32 g', packs: '2–3 sachets' },
            commonWort: supplyWort, sourceOriginsAndDatesVerified: sourceFactsVerified, uniqueSourceLinksVerified: sourceFactsVerified,
            mobileComparisonLayoutFinding: mobileComparisonLayout,
            mobileSupplyScroll, comparisonLeftReferenceUnchanged: true, latency, calls, remoteRequests, pageErrors, consoleErrors });
          failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
          await context.close();
          continue;
        }
        await clickSelector(page, '.yc-compare-open');
      } else await page.locator('[aria-label="Chercher une autre levure"]').fill('US-05');

      // The catalogue row keeps a direct choice alongside the voluntary comparison control.
      await clickSelector(page, '.yc-list li[data-candidate-id="fermentis-us05"] button[data-choose="fermentis-us05"]');
      await page.waitForFunction(() => document.querySelector('.yc-strain-station')?.innerText.includes('SafAle US-05'),
        { timeout: 15000 });
      const directQuantity = await page.evaluate(() => ({
        value: document.querySelector('[aria-label^="Quantité de levure"]')?.value ?? '',
        unit: document.querySelector('[aria-label="Unité de la quantité de levure"]')?.value ?? '',
        notice: document.querySelector('.yc-change-bar')?.innerText ?? '',
      }));
      // Strain identities do not inherit another strain's manual mass or unit.
      // Record that boundary, then enter 1 sachet for the newly selected US-05.
      const identityBoundary = { viewport: label, previousIdentity: 'wyeast-1007', chosenIdentity: 'fermentis-us05',
        previousQuantity: { value: 1, unit: 'sachet' }, afterDirectChoice: directQuantity,
        expectation: 'L’ancienne quantité appartient à l’identité précédente; une quantité manuelle est saisie pour US-05.' };
      assert.notDeepEqual({ value: directQuantity.value, unit: directQuantity.unit }, { value: '1', unit: 'sachet' },
        'La quantité d’une autre identité ne se transplante pas.');
      assert.match(directQuantity.notice, /Quantité : 1 sachet non reprise/i);
      const boundaryShot = resolve(evidenceDir, `levure-changement-souche-${label}-apres.png`);
      await page.screenshot({ path: boundaryShot, fullPage: false });
      await writeFile(resolve(evidenceDir, `levure-changement-souche-${label}-apres.json`), JSON.stringify(identityBoundary, null, 2));
      manifest.screenshots.push({ name: `levure-changement-souche-${label}-apres`, viewport: { width, height }, path: boundaryShot });
      await clickTextIn(page, '.yc-change-bar', 'Saisir');
      await page.locator('[aria-label^="Quantité de levure"]').fill('1');
      await page.select('[aria-label="Unité de la quantité de levure"]', 'sachet');
      assert.equal(await page.$eval('[aria-label^="Quantité de levure"]', element => element.value), '1');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'sachet');

      const productId = 'fermentis-us05-11_5g';
      await page.waitForSelector(`.yp-products li[data-product="${productId}"]`, { visible: true, timeout: 15000 });
      const productText = await page.$eval(`.yp-products li[data-product="${productId}"]`, element => element.innerText);
      assert.match(productText, /11,5\s*g/i, 'Le format sélectionné est le sachet fabricant 11,5 g.');
      await clickSelector(page, `.yp-products li[data-product="${productId}"] button.yp-choose`);
      await page.waitForSelector('.yp-chosen', { visible: true, timeout: 15000 });
      const offerId = 'brau-rauch-us05-he0102-20260927';
      await page.waitForSelector(`.yp-offers li[data-offer="${offerId}"]`, { visible: true, timeout: 15000 });
      await clickSelector(page, `.yp-offers li[data-offer="${offerId}"] button`);
      await page.waitForFunction(offerId => document.querySelector(`.yp-offers li[data-offer="${offerId}"][data-retained]`),
        { timeout: 15000 }, offerId);
      assert.equal(await page.$eval('[aria-label^="Quantité de levure"]', element => element.value), '1');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'sachet');

      await clickTextIn(page, '.yp-wort', 'Saisir une mesure ou une hypothèse');
      await page.locator('[aria-label="Volume du moût à ensemencer en litres"]').fill('40');
      await clickTextIn(page, '[aria-label="Nature du volume"]', 'Mesuré', '[role="radio"]');
      await page.locator('[aria-label="Densité du moût à ensemencer en SG"]').fill('1.050');
      await clickTextIn(page, '[aria-label="Nature de la densité"]', 'Mesuré', '[role="radio"]');
      await page.waitForFunction(() => {
        const wort = document.querySelector('.yp-wort');
        return wort?.innerText.includes('40 L') && wort.innerText.includes('1,050')
          && document.querySelector('[data-advice-range]')?.textContent.includes('20–32');
      }, { timeout: 15000 });
      const adviceText = await page.$eval('.yp-advice', element => element.innerText);
      assert.match(adviceText, /20–32\s*g/, 'La plage fabricant appliquée à 40 L reste 20–32 g.');
      assert.match(adviceText, /2–3\s*sachets/i, 'Le format exact donne une plage de 2–3 sachets.');
      const homonymText = await page.$eval('[data-homonym]', element => element.textContent);
      assert.match(homonymText, /SafAle US-05.*qa-us05/i);
      assert.match(homonymText, /ne couvre rien/i);
      assert.equal(await page.$eval('.yp-lot', element => element.getAttribute('data-lot')), 'none');
      assert.match(await page.$eval('.yp-lot', element => element.innerText), /Packs à acheter inconnus/i,
        'L’homonyme sans référence de produit ne réduit pas le besoin à acheter.');
      const quantity = '[aria-label="Quantité de levure, en sachet"]';
      assert.equal(await page.$eval(quantity, element => element.value), '1');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'sachet');

      const adoptPacks = async count => {
        const handle = await page.waitForFunction(count => [...document.querySelectorAll('[aria-label^="Adopter un nombre de sachets"] button')]
          .find(button => button.getClientRects().length && button.textContent.trim().startsWith(`${count} sachets`)),
        { timeout: 15000 }, count);
        const element = handle.asElement();
        await element.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await element.click();
        await handle.dispose();
      };
      const readPlannedCheck = async id => page.$eval(`.yp-quantity [data-check="${id}"]`, element => ({
        tone: element.getAttribute('data-tone'), label: element.querySelector('dt')?.textContent.trim(),
        text: element.querySelector('dd')?.innerText.trim(),
      }));
      await adoptPacks(3);
      await page.waitForFunction(() => document.querySelector('[role="status"].yp-adopted')?.textContent.includes('1 sachet → 3 sachet'));
      const adoptedThree = await page.evaluate(() => ({
        qty: document.querySelector('[aria-label="Quantité de levure, en sachet"]')?.value,
        unit: document.querySelector('[aria-label="Unité de la quantité de levure"]')?.value,
        plannedTone: document.querySelector('.yp-quantity')?.getAttribute('data-planned'),
        packTone: document.querySelector('.yp-quantity')?.getAttribute('data-packs-check'),
        badge: document.querySelector('.yp-quantity .yp-head .yp-tag')?.textContent.trim(),
        reading: document.querySelector('[data-quantity-reading]')?.textContent,
      }));
      assert.deepEqual(adoptedThree, { qty: '3', unit: 'sachet', plannedTone: 'high', packTone: 'ok',
        badge: 'Au-delà du repère si tout est versé', reading: 'Prévu 3 sachets = 34,5 g : 34,5 g de capacité ouverte.' });
      const threePacksCheck = await readPlannedCheck('packs'), threeDoseCheck = await readPlannedCheck('dose');
      assert.deepEqual(threePacksCheck, { tone: 'ok', label: 'Sachets à ouvrir', text: '3 sachets · dans la plage conseillée 2–3' });
      assert.deepEqual(threeDoseCheck, { tone: 'high', label: 'Si tout est versé', text: '34,5 g · au-delà du repère haut 32 g (+2,5 g)' });
      const threePackShot = await captureReview(page, width, height, `levure-packs-trois-au-dela-${label}-apres`, '.yp-quantity');
      assert.match(threePackShot.visibleText, /Au-delà du repère si tout est versé/);
      await clickSelector(page, '.yp-adopted button');
      await page.waitForFunction(() => !document.querySelector('.yp-adopted'));
      assert.equal(await page.$eval(quantity, element => element.value), '1', 'Undo 3 restaure la quantité manuelle.');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'sachet', 'Undo 3 restaure aussi l’unité.');

      await adoptPacks(2);
      await page.waitForFunction(() => document.querySelector('[role="status"].yp-adopted')?.textContent.includes('1 sachet → 2 sachet'));
      const adoptedTwo = await page.evaluate(() => ({
        qty: document.querySelector('[aria-label="Quantité de levure, en sachet"]')?.value,
        unit: document.querySelector('[aria-label="Unité de la quantité de levure"]')?.value,
        plannedTone: document.querySelector('.yp-quantity')?.getAttribute('data-planned'),
        packTone: document.querySelector('.yp-quantity')?.getAttribute('data-packs-check'),
        badge: document.querySelector('.yp-quantity .yp-head .yp-tag')?.textContent.trim(),
      }));
      assert.deepEqual(adoptedTwo, { qty: '2', unit: 'sachet', plannedTone: 'ok', packTone: 'ok', badge: 'Dans le conseil' });
      const twoPacksCheck = await readPlannedCheck('packs'), twoDoseCheck = await readPlannedCheck('dose');
      assert.deepEqual(twoPacksCheck, { tone: 'ok', label: 'Sachets à ouvrir', text: '2 sachets · dans la plage conseillée 2–3' });
      assert.deepEqual(twoDoseCheck, { tone: 'ok', label: 'Si tout est versé', text: '23 g · dans le repère 20–32 g' });
      const twoPackShot = await captureReview(page, width, height, `levure-packs-deux-dans-le-conseil-${label}-apres`, '.yp-quantity');
      assert.match(twoPackShot.visibleText, /Dans le conseil/);
      await clickSelector(page, '.yp-adopted button');
      await page.waitForFunction(() => !document.querySelector('.yp-adopted'));
      assert.equal(await page.$eval(quantity, element => element.value), '1', 'Undo 2 conserve la quantité manuelle initiale.');
      assert.equal(await page.$eval('[aria-label="Unité de la quantité de levure"]', element => element.value), 'sachet', 'Undo 2 conserve l’unité initiale.');

      await clickStep(page, 'Paliers');
      await page.waitForSelector('[aria-label="Nom du palier 1"]', { visible: true, timeout: 15000 });
      const mashName = await page.$eval('[aria-label="Nom du palier 1"]', element => element.value ?? element.textContent);
      assert.equal(mashName, recipe.mash.steps[0].name, 'Le palier d’empâtage semé reste inchangé.');
      await clickStep(page, 'Levure');
      let latency;
      await clickTextIn(page, '.yp-wort', 'Corriger');
      if (!focusClaude02) {
        const volumeLatency = [], densityLatency = [];
        for (let sample = 0; sample < 20; sample++) {
          const volume = sample % 2 === 0 ? '39.8' : '40';
          volumeLatency.push(await measureMutation(page, '[data-advice-range]', () => page.locator('[aria-label="Volume du moût à ensemencer en litres"]').fill(volume)));
          const sg = sample % 2 === 0 ? '1.051' : '1.050';
          densityLatency.push(await measureMutation(page, '.yp-reading', () => page.locator('[aria-label="Densité du moût à ensemencer en SG"]').fill(sg)));
        }
        await page.locator('[aria-label="Volume du moût à ensemencer en litres"]').fill('40');
        await page.locator('[aria-label="Densité du moût à ensemencer en SG"]').fill('1.050');
        const p95 = samples => {
          const values = [...samples].sort((a, b) => a - b);
          return { n: values.length, p50Ms: values[Math.floor((values.length - 1) * 0.5)],
            p95Ms: values[Math.ceil(values.length * 0.95) - 1], maxMs: values.at(-1), samples: values };
        };
        latency = { method: 'performance.now() + MutationObserver in-page; measured from before Puppeteer fill until target DOM text mutates; no network in the adapter; n=20 per signal and viewport; excludes device/human input, cold start and real Firestore.',
          viewport: label, volumeToAdvice: p95(volumeLatency), densityToReading: p95(densityLatency) };
      }

      await captureReview(page, width, height, `levure-ensemencement-${label}-apres`, '.yp-wort');
      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
      await page.waitForFunction(id => window.__hopQa.storage.getRecipes().some(item => item.id === id
        && item.yeast.pitching?.product?.id === 'fermentis-us05-11_5g'), { timeout: 20000 }, recipe.id);
      await page.waitForFunction(() => !document.querySelector('.recipe-wizard'), { timeout: 15000 });
      const saved = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(saved.yeast.qty, 1);
      assert.equal(saved.yeast.unit, 'sachet');
      assert.equal(saved.yeast.pitching.offer.id, offerId);
      assert.equal(saved.yeast.pitching.wort.volumeL, 40);
      assert.equal(saved.yeast.pitching.wort.volumeBasis, 'measured');
      assert.equal(saved.yeast.pitching.wort.sg, 1.05);
      assert.equal(saved.yeast.pitching.wort.sgBasis, 'measured');
      assert.equal(saved.fermentation.length, 2);
      assert.deepEqual(saved.mash.steps, recipe.mash.steps, 'Le palier commun est sauvegardé sans réécriture.');

      // Remove reset before the reload: this is the local, persisted adapter path, with no live DB.
      await page.evaluate(() => history.replaceState(null, '', location.pathname));
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__hopQa?.ready());
      await openRecipeEditor(page, name);
      await clickStep(page, 'Levure');
      await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.wort?.sgBasis === 'measured',
        { timeout: 15000 }, recipe.id);
      const reopened = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
      assert.equal(reopened.yeast.pitching.product.id, productId);
      assert.equal(reopened.yeast.pitching.offer.id, offerId);
      assert.equal(reopened.yeast.pitching.wort.volumeL, 40);
      assert.equal(reopened.yeast.pitching.wort.sg, 1.05);
      assert.equal(reopened.yeast.qty, 1);
      assert.equal(reopened.fermentation.length, 2);
      assert.deepEqual(reopened.mash.steps, recipe.mash.steps);
      const reopenedShot = await captureReview(page, width, height, `levure-reouverte-${label}-apres`, '.yp-wort');
      assert.match(reopenedShot.visibleText, /40 L/i);
      assert.match(reopenedShot.visibleText, /1,050/i);

      await clickStep(page, 'Récapitulatif');
      await clickTextIn(page, '.recipe-wizard', 'Copier la recette en texte');
      await page.waitForFunction(() => document.body.innerText.includes('Recette copiée'));
      const recipeText = await page.evaluate(() => navigator.clipboard.readText());
      assert(recipeText.startsWith('L’AFFINÉE — RECETTE v1'));
      assert(recipeText.includes(productId));
      assert(recipeText.includes(offerId));
      assert(recipeText.includes('40'));
      assert(recipeText.includes('1.05'));
      assert(recipeText.includes('1'));

      let sourceQualification;
      if (focusClaude02 && !focusClaude03Packs) {
        // Existing local M20 answer: accept one sourced range, then verify the
        // observation citation after a save and offline reload. No new mock.
        await clickStep(page, 'Levure');
        await page.evaluate(() => window.__hopQa.yeast.mockM20Review());
        await page.locator('[aria-label="Chercher une autre levure"]').fill('M20');
        const m20Id = 'yeast-mangrove-jacks-132040951';
        await page.waitForSelector(`.yc-list li[data-candidate-id="${m20Id}"]`, { visible: true, timeout: 15000 });
        await clickSelector(page, `.yc-list li[data-candidate-id="${m20Id}"] button[data-choose="${m20Id}"]`);
        await page.waitForFunction(() => document.querySelector('.yc-strain-station')?.innerText.includes('M20 · Bavarian Wheat'), { timeout: 15000 });
        await clickSelector(page, '.yc-sheet-fold[data-sheet-scope="recipe"] summary');
        const lookupButton = '[aria-label="Autocomplétion des ingrédients"] .yc-sheet-search';
        await page.waitForSelector(lookupButton, { visible: true, timeout: 15000 });
        await clickSelector(page, lookupButton);
        await page.waitForSelector('.yc-review[aria-label="Proposition IA pour M20 · Bavarian Wheat"]', { visible: true, timeout: 15000 });
        const proposalText = await page.$eval('.yc-review', element => element.innerText);
        assert.match(proposalText, /Fixture QA synthétique/);
        assert.match(proposalText, /18–28 °C/);
        assert.match(proposalText, /aucune fiche commerciale/);
        const sourceUrls = await page.$$eval('.yc-review a', links => links.map(link => link.href));
        assert(sourceUrls.includes('https://example.invalid/m20'), 'La source du mock reste visible dans la proposition.');
        const temperatureGap = `[aria-label="Écart · Température de fermentation"]`;
        await page.waitForSelector(`${temperatureGap} button`, { visible: true, timeout: 15000 });
        await clickTextIn(page, temperatureGap, 'Prendre la proposition');
        await page.waitForSelector('.yc-review [data-review-applied]', { visible: true, timeout: 15000 });
        const observationsDetails = '.yc-sheet-fold[data-sheet-scope="recipe"] details[aria-label="Données documentaires conservées"]';
        await page.waitForSelector(observationsDetails, { visible: true, timeout: 15000 });
        await clickSelector(page, `${observationsDetails} summary`);
        await page.waitForSelector(`${observationsDetails} [data-observation="temperature"]`, { visible: true, timeout: 15000 });
        const adoptedObservations = await page.$$eval(`${observationsDetails} [data-observation="temperature"]`, elements => elements.map(element => element.innerText));
        const adoptedText = adoptedObservations.find(text => /18–28 °C/.test(text) && /Recherche IA \[3\]/.test(text));
        assert(adoptedText, `La température sourcée reste parmi les observations après adoption : ${JSON.stringify(adoptedObservations)}`);
        assert.match(await page.$eval(observationsDetails, element => element.innerText), /\[3\] Fixture QA synthétique/);
        await page.waitForSelector(`${observationsDetails} a[href="https://example.invalid/m20"]`, { visible: true, timeout: 15000 });
        await captureReview(page, width, height, `yeast-claude02-source-adoptee-${label}-apres`, observationsDetails);

        await clickStep(page, 'Récapitulatif');
        await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
        await page.waitForFunction(id => {
          const yeast = window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast;
          return yeast?.hopIndexId === 'yeast-mangrove-jacks-132040951' && (yeast.technicalFacts ?? []).some(fact =>
            fact.key === 'temperature' && fact.sourceUrl === 'https://example.invalid/m20' && fact.origin === 'ai');
        }, { timeout: 20000 }, recipe.id);
        const acceptedFacts = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.technicalFacts ?? [], recipe.id);
        const adopted = acceptedFacts.find(fact => fact.key === 'temperature' && fact.sourceUrl === 'https://example.invalid/m20');
        assert(adopted, 'La source adoptée est dans la recette sauvegardée.');

        await page.evaluate(() => history.replaceState(null, '', location.pathname));
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        await openRecipeEditor(page, name);
        await clickStep(page, 'Levure');
        await clickSelector(page, '.yc-sheet-fold[data-sheet-scope="recipe"] summary');
        await page.waitForSelector(observationsDetails, { visible: true, timeout: 15000 });
        await clickSelector(page, `${observationsDetails} summary`);
        await page.waitForSelector(`${observationsDetails} [data-observation="temperature"]`, { visible: true, timeout: 15000 });
        const reopenedObservations = await page.$$eval(`${observationsDetails} [data-observation="temperature"]`, elements => elements.map(element => element.innerText));
        const reopenedText = reopenedObservations.find(text => /18–28 °C/.test(text) && /Recherche IA \[3\]/.test(text));
        assert(reopenedText, `La température sourcée est toujours visible après réouverture : ${JSON.stringify(reopenedObservations)}`);
        assert.match(await page.$eval(observationsDetails, element => element.innerText), /\[3\] Fixture QA synthétique/);
        await page.waitForSelector(`${observationsDetails} a[href="https://example.invalid/m20"]`, { visible: true, timeout: 15000 });
        await captureReview(page, width, height, `yeast-claude02-source-reouverte-${label}-apres`, observationsDetails);
        sourceQualification = { mock: 'window.__hopQa.yeast.mockM20Review()', sourceUrl: 'https://example.invalid/m20',
          proposal: proposalText, adoptedObservation: adoptedText, reloadedObservation: reopenedText,
          observationStoredBeforeAndAfterReload: true };
      }

      assert.deepEqual(remoteRequests, [], `${label}: aucune requête externe.`);
      assert.deepEqual(pageErrors, [], `${label}: aucune erreur JavaScript.`);
      assert.deepEqual(consoleErrors, [], `${label}: aucune erreur ou alerte console.`);
      const calls = await page.evaluate(() => [...window.__hopQa.calls]);
      assert.deepEqual(calls.filter(call => !['getBrewerActivity', 'getBrewerConversation', ...(focusClaude02 ? ['aiTask'] : [])].includes(call)), [],
        `${label}: aucune callable réelle ou correction DB.`);
      if (focusClaude02) assert.equal(calls.filter(call => call === 'aiTask').length, 0, 'La proposition M20 provient du mock de page, sans callable IA.');
      afterRuns.push({ label, recipeId: recipe.id, source: 'tests/fixtures/yeastRecipeFlow.ts + mock rawMaterials qa-us05',
        initialReference: { productId: 'wyeast-1007-xl-unspecified', format: 'unknown', offer: 'out-of-stock' },
        selection: { yeastId: reopened.yeast.hopIndexId, productId, offerId },
        plannedQuantity: { qty: reopened.yeast.qty, unit: reopened.yeast.unit, preservedAfterUndo: true },
        packAdoption: { threePacks: adoptedThree, threePacksCheck, threeDoseCheck,
          twoPacks: adoptedTwo, twoPacksCheck, twoDoseCheck, manualQuantityAndUnitRestoredAfterEachUndo: true },
        wort: { volumeL: reopened.yeast.pitching.wort.volumeL, volumeBasis: reopened.yeast.pitching.wort.volumeBasis,
          sg: reopened.yeast.pitching.wort.sg, sgBasis: reopened.yeast.pitching.wort.sgBasis },
        advice: adviceText, unlinkedHomonym: homonymText, comparisonLeftReferenceUnchanged: true,
        conductionSteps: reopened.fermentation, mashStep: reopened.mash.steps[0], offlineReopen: true,
        textExport: { header: 'L’AFFINÉE — RECETTE v1', includesProductOfferAndWort: true }, latency, sourceQualification,
        remoteRequests, pageErrors, consoleErrors, calls });

      // A second, sourced-liquid branch checks the documented Activator plan and the near-deadline refusal.
      if (!focusClaude02 && width === 1280) {
        // Create a real QA-only batch from the saved recipe, then edit the recipe and
        // verify that the launched batch keeps its original snapshot.
        await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        await clickSelector(page, `[aria-label=${JSON.stringify(`Ouvrir la recette ${name}`)}]`);
        await page.waitForSelector('[aria-label="Modifier la recette"]', { visible: true, timeout: 15000 });
        await clickTextIn(page, 'body', 'Préparer un brassin');
        await page.waitForSelector('[aria-label="Recette à brasser"]', { visible: true, timeout: 15000 });
        assert.equal(await page.$eval('[aria-label="Recette à brasser"]', element => element.value), recipe.id);
        await clickTextIn(page, 'body', 'Créer le brassin à brasser');
        await page.waitForFunction(id => window.__hopQa.storage.getBatches().some(batch => batch.recipeRef === id),
          { timeout: 20000 }, recipe.id);
        const batch = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.recipeRef === id), recipe.id);
        assert(batch.recipeSnapshot, 'Le brassin QA contient une copie figée de la recette.');
        assert.equal(batch.recipeSnapshot.yeast.qty, 1);
        assert.equal(batch.recipeSnapshot.yeast.unit, 'sachet');
        assert.equal(batch.recipeSnapshot.yeast.pitching.product.id, productId);
        assert.equal(batch.recipeSnapshot.yeast.pitching.offer.id, offerId);
        assert.equal(batch.recipeSnapshot.yeast.pitching.wort.volumeL, 40);
        assert.equal(batch.recipeSnapshot.yeast.pitching.wort.volumeBasis, 'measured');
        assert.equal(batch.recipeSnapshot.yeast.pitching.wort.sg, 1.05);
        assert.equal(batch.recipeSnapshot.yeast.pitching.wort.sgBasis, 'measured');
        const brewGuide = await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')]
          .find(element => element.querySelector('.brew-aide-title')?.textContent.includes('SafAle US-05')),
        { timeout: 15000 });
        await brewGuide.asElement().evaluate(element => {
          if (!element.open) element.querySelector('summary')?.click();
          element.scrollIntoView({ block: 'start' });
        });
        await page.waitForFunction(() => [...document.querySelectorAll('.brew-aide')].some(element => element.open
          && element.querySelector('.brew-aide-title')?.textContent.includes('SafAle US-05')
          && element.innerText.includes('Préparer 1 sachet')), { timeout: 15000 });
        await captureReview(page, width, height, 'levure-snapshot-brassin-1280x900-apres', '.brew-aide-title');
        await brewGuide.dispose();
        await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        await openRecipeEditor(page, name);
        await clickStep(page, 'Levure');
        await page.locator('[aria-label="Quantité de levure, en sachet"]').fill('2');
        await clickStep(page, 'Récapitulatif');
        await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
        await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.qty === 2,
          { timeout: 20000 }, recipe.id);
        const frozenBatch = await page.evaluate(id => window.__hopQa.storage.getBatches().find(item => item.recipeRef === id), recipe.id);
        const editedRecipe = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id), recipe.id);
        assert.equal(editedRecipe.yeast.qty, 2);
        assert.equal(frozenBatch.recipeSnapshot.yeast.qty, 1, 'L’édition ultérieure de la recette ne réécrit pas le snapshot du brassin.');
        assert.equal(frozenBatch.recipeSnapshot.yeast.pitching.product.id, productId);
        afterRuns.push({ branch: 'snapshot réel QA', batchId: batch.id, savedRecipeQuantityAfterEdit: editedRecipe.yeast.qty,
          snapshotQuantityAfterEdit: frozenBatch.recipeSnapshot.yeast.qty, productId, offerId,
          measuredWort: frozenBatch.recipeSnapshot.yeast.pitching.wort });

        const activatorName = 'QA Wyeast 1056 Activator';
        const activator = await page.evaluate(name => {
          const seed = window.__hopQa.storage.getRecipes().find(item => item.id === 'qa-poc-yeast');
          const next = structuredClone(seed);
          next.id = 'QA-YEAST-REFONTE-ACTIVATOR'; next.name = name; next.style = 'American Pale Ale';
          next.yeastDesign = undefined; next.yeastGuide = undefined;
          next.yeast = { name: 'Wyeast 1056 American Ale', lab: 'Wyeast Laboratories', strain: '1056 American Ale',
            hopIndexId: 'wyeast-1056', form: 'liquide', qty: 1, unit: 'pack', pitchTempC: 20 };
          window.__hopQa.seedRecipe(next); return next;
        }, activatorName);
        await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__hopQa?.ready());
        await openRecipeEditor(page, activatorName);
        await clickStep(page, 'Levure');
        const activatorProduct = 'wyeast-1056-activator-125ml';
        await page.waitForSelector(`.yp-products li[data-product="${activatorProduct}"]`, { visible: true, timeout: 15000 });
        await clickSelector(page, `.yp-products li[data-product="${activatorProduct}"] button.yp-choose`);
        await page.waitForSelector('.yp-chosen', { visible: true, timeout: 15000 });
        assert.match(await page.$eval('.yp-chosen', element => element.innerText), /Activator Smack Pack 125 mL/);
        const preparationSelector = '.yp-prep';
        await page.waitForSelector(preparationSelector, { visible: true, timeout: 15000 });
        const protocol = await page.$eval(preparationSelector, element => element.innerText);
        assert.match(protocol, /24–36 h/i);
        assert.match(protocol, /SG cible 1,040/i);
        assert.match(protocol, /croissance|rendement/i);
        assert(!/cellules finales\s*[:=]\s*\d/i.test(protocol), 'Aucun rendement cellulaire inventé.');
        await clickTextIn(page, preparationSelector, 'Planifier la préparation');
        const targetPitch = await page.evaluate(() => {
          const date = new Date(Date.now() + 7 * 86400000); date.setHours(12, 0, 0, 0);
          const pad = value => String(value).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        });
        const dateSelector = `${preparationSelector} input[type="datetime-local"]`;
        await page.$eval(dateSelector, (element, value) => {
          element.focus();
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }, targetPitch);
        await page.waitForFunction(({ dateSelector, targetPitch }) => document.querySelector(dateSelector)?.value === targetPitch,
          { timeout: 5000 }, { dateSelector, targetPitch });
        await page.locator(`${preparationSelector} [aria-label="Volume de starter retenu en litres"]`).fill('1');
        await page.locator(`${preparationSelector} input[id$="-inoculum"]`).fill('1 Activator du même produit');
        await page.locator(`${preparationSelector} input[id$="-equipment"]`).fill('Fiole 2 L avec agitateur · QA');
        const filledPreparation = await page.$eval(preparationSelector, element => ({
          date: element.querySelector('input[type="datetime-local"]')?.value,
          volume: element.querySelector('[aria-label="Volume de starter retenu en litres"]')?.value,
          inoculum: element.querySelector('input[id$="-inoculum"]')?.value,
          equipment: element.querySelector('input[id$="-equipment"]')?.value,
        }));
        assert.equal(filledPreparation.volume, '1', 'Le volume du starter reste dans le brouillon du formulaire.');
        assert.equal(filledPreparation.inoculum, '1 Activator du même produit');
        assert.equal(filledPreparation.equipment, 'Fiole 2 L avec agitateur · QA');
        assert.equal(filledPreparation.date, targetPitch, JSON.stringify({ targetPitch, filledPreparation }));
        await clickTextIn(page, preparationSelector, 'Planifier');
        await page.waitForFunction(() => document.querySelector('.yp-prep')?.getAttribute('data-preparation') === 'planned', { timeout: 15000 });
        const preparationBeforeCorrection = await page.$eval('.yp-plan-state', element => element.innerText);
        assert.match(preparationBeforeCorrection, /Starter 1 L/);
        assert.match(preparationBeforeCorrection, /Activ[a-z]* du même produit/);
        await clickTextIn(page, preparationSelector, 'Corriger ou remplacer');
        const tooSoon = await page.evaluate(() => {
          const date = new Date(Date.now() + 12 * 3600000);
          const pad = value => String(value).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        });
        await page.$eval(dateSelector, (element, value) => {
          element.focus();
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }, tooSoon);
        await page.waitForFunction(({ dateSelector, tooSoon }) => document.querySelector(dateSelector)?.value === tooSoon,
          { timeout: 5000 }, { dateSelector, tooSoon });
        await clickTextIn(page, preparationSelector, 'Enregistrer la nouvelle révision');
        await page.waitForSelector(`${preparationSelector} [role="alert"]`, { visible: true, timeout: 10000 });
        const nearDeadlineError = await page.$eval(`${preparationSelector} [role="alert"]`, element => element.textContent);
        assert.match(nearDeadlineError, /Échéance trop proche/i);
        assert.equal(await page.$eval(preparationSelector, element => element.getAttribute('data-preparation')), 'planned');
        assert.equal(await page.$eval('.yp-plan-state', element => element.innerText), preparationBeforeCorrection,
          'Le refus proche de l’échéance garde le plan précédemment saisi dans le brouillon.');
        await captureReview(page, width, height, 'activator-starter-echeance-refusee-1280x900-apres', preparationSelector);
        await clickTextIn(page, preparationSelector, 'Fermer sans changer');
        await clickStep(page, 'Récapitulatif');
        await clickTextIn(page, '.recipe-wizard', 'Enregistrer la recette');
        await page.waitForFunction(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.preparation?.status === 'planned',
          { timeout: 20000 }, activator.id);
        const preparation = await page.evaluate(id => window.__hopQa.storage.getRecipes().find(item => item.id === id)?.yeast?.pitching?.preparation, activator.id);
        assert.equal(preparation.volumeL, 1);
        assert(Date.parse(preparation.startAt) < Date.parse(preparation.targetPitchAt));
        assert(Date.parse(preparation.startAt) > Date.now());
        afterRuns.push({ branch: 'Wyeast 1056 Activator', protocol: activatorProduct, planPersisted: preparation,
          nearDeadlineRefused: nearDeadlineError, previousPlanKept: true });
      }
      failures.push(...consoleErrors.map(error => ({ viewport: label, ...error })));
      await context.close();
    }
    const percentile = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.ceil(sorted.length * 0.95) - 1];
    };
    const renderSamples = afterRuns.filter(run => run.latency).flatMap(run => [
      ...run.latency.volumeToAdvice?.samples ?? [], ...run.latency.densityToReading?.samples ?? [],
      ...run.latency.volumeToComparisonWort?.samples ?? [], ...run.latency.densityToComparisonWort?.samples ?? []
    ]);
    // Keep the raw timings next to the aggregate; the summary never implies a user-performance study.
    const latencySummary = afterRuns.filter(run => run.latency).map(run => ({ viewport: run.label,
      ...(run.latency.volumeToAdvice ? { volumeToAdvice: run.latency.volumeToAdvice } : {}),
      ...(run.latency.densityToReading ? { densityToReading: run.latency.densityToReading } : {}),
      ...(run.latency.volumeToComparisonWort ? { volumeToComparisonWort: run.latency.volumeToComparisonWort } : {}),
      ...(run.latency.densityToComparisonWort ? { densityToComparisonWort: run.latency.densityToComparisonWort } : {}) }));
    manifest.flowResults = afterRuns;
    manifest.latencyMethod = focusClaude02 || focusPreJ0 || focusPreJ0Late || focusClaude03Packs || focusManualSupply || focusM20Source || focusOfferContext || focusWortIdentity || focusFreeLocalWort || focusFlocculationProvenance || focusStarterNotice || focusPerformanceIntegration ? 'Non mesuré dans cette qualification ciblée; voir les runs précédents pour les interactions mesurées.'
      : 'In-page performance.now() with MutationObserver from immediately before a field fill to the corresponding rendered text mutation. Separate p95 per viewport and signal; twenty samples each. Local fixture adapter and blocked outbound HTTP(S); excludes physical keyboard/touch, cold start, real sync, network and human comprehension.';
    manifest.latencySummary = latencySummary.map(row => ({ viewport: row.viewport,
      ...(row.volumeToAdvice ? { volumeToAdviceP95Ms: row.volumeToAdvice.p95Ms, volumeToAdviceN: row.volumeToAdvice.n } : {}),
      ...(row.densityToReading ? { densityToReadingP95Ms: row.densityToReading.p95Ms, densityToReadingN: row.densityToReading.n } : {}),
      ...(row.volumeToComparisonWort ? { volumeToComparisonWortP95Ms: row.volumeToComparisonWort.p95Ms, volumeToComparisonWortN: row.volumeToComparisonWort.n } : {}),
      ...(row.densityToComparisonWort ? { densityToComparisonWortP95Ms: row.densityToComparisonWort.p95Ms, densityToComparisonWortN: row.densityToComparisonWort.n } : {}) }));
    manifest.latencyRawSampleCount = renderSamples.length;
  }

  await writeFile(resolve(evidenceDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
  assert.deepEqual(failures, [], `Erreurs QA: ${JSON.stringify(failures)}`);
} catch (error) {
  for (const [index, page] of (await browser.pages()).entries()) {
    if (!page.url().startsWith(base)) continue;
    await page.screenshot({ path: resolve(evidenceDir, `failure-${index}.png`) }).catch(() => {});
    const text = await page.$eval('body', element => element.innerText).catch(() => '');
    await writeFile(resolve(evidenceDir, `failure-${index}.txt`), `${String(error)}\n\n${text}`).catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
