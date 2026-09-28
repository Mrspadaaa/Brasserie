import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import puppeteer from 'puppeteer-core';

const stage = process.argv[2] || 'after';
const evidence = resolve(tmpdir(), 'laffinee-finance-ux-20260924', stage);
const buildRoot = resolve(tmpdir(), 'laffinee-finance-ux-build');
await mkdir(evidence, { recursive: true });

async function elementByText(page, selector, text, partial = false) {
  const handle = await page.waitForFunction((selector, text, partial) => [...document.querySelectorAll(selector)].find(element => {
    if (!element.getClientRects().length) return false;
    const label = (element.getAttribute('aria-label') || element.innerText || element.textContent || '').trim();
    return partial ? label.includes(text) : label === text;
  }), {}, selector, text, partial);
  return handle.asElement();
}
async function clickText(page, selector, text, partial = false) {
  const element = await elementByText(page, selector, text, partial);
  await element.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await element.click();
}
async function captureCompare(element, path) {
  await element.evaluate(element => element.scrollIntoView({ block: 'start' }));
  await element.screenshot({ path });
}
async function dialogContains(page, text) {
  return page.waitForFunction(text => [...document.querySelectorAll('[role="dialog"]')]
    .some(dialog => dialog.innerText.includes(text)), {}, text);
}
async function activateChartPeriod(page, index, month, mobile) {
  const point = await page.waitForSelector(`[data-finance-chart-period="${month}"][data-finance-series="expense"] circle`);
  const bounds = await point.boundingBox();
  assert(bounds, `Point graphique inaccessible pour ${month} (rang ${index}).`);
  if (mobile) await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  else await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.waitForFunction(month => document.querySelector('[data-finance-period-filter]')?.getAttribute('data-finance-period-filter') === month, {}, month);
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(buildRoot, pathname === '/' ? 'finance.fixture.html' : `.${pathname}`);
    if (file !== buildRoot && !file.startsWith(buildRoot + sep)) { response.writeHead(403).end(); return; }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(file)] || 'application/octet-stream';
    response.setHeader('Content-Type', mime);
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, timeout: 10_000, args: ['--mute-audio', '--no-sandbox', '--disable-gpu']
});
let checkpoint = 'création de la page';
let activePage;
let browserErrors = [];
let failedRequests = [];

try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage();
    activePage = page;
    browserErrors = [];
    failedRequests = [];
    let visiblePeriods = [];
    const mobile = width < 600;
    await page.setViewport({ width, height: mobile ? 844 : 900, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    page.setDefaultTimeout(8_000);
    page.setDefaultNavigationTimeout(12_000);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); browserErrors.push(error.message); });
    page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); browserErrors.push(message.text()); } });
    page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
    page.on('requestfailed', request => failedRequests.push(`${request.failure()?.errorText} ${request.url()}`));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      return ['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(base).origin ? request.abort() : request.continue();
    });
    checkpoint = 'chargement de la fixture';
    await page.goto(`${base}/finance.fixture.html`, { waitUntil: 'domcontentloaded' });
    checkpoint = 'montage FinancesTab';
    await page.waitForSelector('.finance');
    checkpoint = 'navigation Prévisions';
    await clickText(page, 'button[role="tab"]', 'Prévisions');
    const compareHandle = await page.waitForFunction(() => [...document.querySelectorAll('details.finance-disclosure')]
      .find(details => details.innerText.includes('Comparer les mois')));
    const compare = compareHandle.asElement();
    checkpoint = 'ouverture du graphique';
    await compare.$eval('summary', summary => summary.click());
    await page.waitForSelector('.recharts-surface');
    checkpoint = 'chargement du tableau des mois';
    await page.waitForFunction(() => document.querySelectorAll('.finance-table tbody tr').length >= 3);

    if (stage === 'before') {
      assert.equal(await page.$$eval('[data-finance-period]', nodes => nodes.length), 0, 'Le témoin avant ne doit pas avoir les commandes de sélection de période.');
      await captureCompare(compare, resolve(evidence, `finances-${width}-avant.png`));
    } else {
      const periods = await page.$$eval('[data-finance-period]', buttons => buttons.map(button => button.getAttribute('data-finance-period')));
      visiblePeriods = periods;
      assert.equal(periods.length >= 3, true, 'Le tableau doit offrir une sélection clavier des périodes.');
      assert(new Set(periods).size >= 3, `Au moins trois périodes distinctes attendues, trouvé : ${periods.join(', ')}`);

      // Utilise d'abord une touche réelle sur le tableau, solution accessible de la même courbe.
      await page.focus(`[data-finance-period="${periods[1]}"]`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-finance-period-filter]');
      const firstSelected = await page.$eval('[data-finance-period-filter]', button => button.getAttribute('data-finance-period-filter'));
      assert.equal(firstSelected, periods[1]);

      await page.click(`[data-finance-period="${periods[2]}"]`);
      await page.waitForFunction(month => document.querySelector('[data-finance-period-filter]')?.getAttribute('data-finance-period-filter') === month, {}, periods[2]);
      await page.click('[data-clear-finance-period]');
      assert.equal(await page.$$eval('[data-finance-period-filter]', nodes => nodes.length), 0, 'Le filtre actif doit pouvoir être retiré.');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-finance-period')), periods[2], 'Après retrait, le focus revient au mois choisi.');

      const invoiceMonth = await page.evaluate(() => {
        const fixture = window.__financeFixture;
        const due = new Date(`${fixture.today}T12:00:00Z`);
        due.setUTCDate(due.getUTCDate() + 18);
        return due.toISOString().slice(0, 7);
      });
      const invoicePeriodIndex = periods.indexOf(invoiceMonth);
      assert(invoicePeriodIndex >= 0, `La période de la facture doit figurer dans la courbe : ${invoiceMonth}`);
      await compare.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await activateChartPeriod(page, invoicePeriodIndex, invoiceMonth, mobile);
      const operationText = await page.$eval('[data-finance-period-operations]', element => element.innerText);
      assert(operationText.includes('Facture de malt à régler'));
      assert(operationText.includes('Estimation levures'));
      assert(operationText.includes('CHF'));

      await captureCompare(compare, resolve(evidence, `finances-${width}-periode-selectionnee.png`));
      await clickText(page, '[data-finance-period-operations] button.finance-row', 'Facture de malt à régler', true);
      await dialogContains(page, 'Facture de malt à régler');
      const beforeProof = await page.evaluate(() => window.scrollY);
      await clickText(page, 'button', 'Justificatif');
      await dialogContains(page, 'Justificatif');
      await page.waitForSelector('img[alt="FACTURE-MALT.svg"]');
      await page.screenshot({ path: resolve(evidence, `finances-${width}-piece-ouverte.png`) });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('img[alt="FACTURE-MALT.svg"]'));
      const invoiceStillOpen = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].some(dialog => dialog.innerText.includes('Facture de malt à régler')));
      if (invoiceStillOpen) await page.click('[role="dialog"] button[aria-label="Fermer"]');
      await page.waitForFunction(() => ![...document.querySelectorAll('[role="dialog"]')].some(dialog => dialog.innerText.includes('Facture de malt à régler')));
      assert.equal(await page.$eval('[data-finance-period-filter]', button => button.getAttribute('data-finance-period-filter')), invoiceMonth);
      assert.equal(await page.evaluate(() => window.scrollY), beforeProof, 'La fermeture de la pièce ne doit pas déplacer la page.');

      // Le branchement préexistant de la légende de catégorie reste un parcours séparé.
      await clickText(page, 'button[role="tab"]', 'Synthèse');
      await clickText(page, '.finance-subnav button', 'Coûts');
      await clickText(page, '.finance-legend button', 'Brassage', true);
      await page.waitForFunction(() => document.querySelector('select')?.value === 'brassage');
      assert.equal(await page.$eval('select', select => select.value), 'brassage');
      await page.screenshot({ path: resolve(evidence, `finances-${width}-categorie-existante.png`) });
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `Défilement horizontal de page à ${width}px.`);
    assert.deepEqual(errors, [], `Erreurs navigateur à ${width}px.`);
    const captures = stage === 'before'
      ? [resolve(evidence, `finances-${width}-avant.png`)]
      : [resolve(evidence, `finances-${width}-periode-selectionnee.png`), resolve(evidence, `finances-${width}-piece-ouverte.png`), resolve(evidence, `finances-${width}-categorie-existante.png`)];
    console.log(JSON.stringify({ stage, width, captures, periods: stage === 'after' ? visiblePeriods : undefined, errors }));
    await page.close();
  }
} catch (error) {
  console.error(`Échec du contrôle navigateur (${stage}, ${checkpoint}) :`, error);
  if (activePage && !activePage.isClosed()) console.error(JSON.stringify(await activePage.evaluate(() => ({ title: document.title, url: location.href, body: document.body.innerText, root: document.querySelector('#finance-fixture-root')?.innerHTML.slice(0, 600) })), null, 2));
  console.error(JSON.stringify({ browserErrors, failedRequests }, null, 2));
  throw error;
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
