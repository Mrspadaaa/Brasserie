import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import react from '@vitejs/plugin-react';
import { build } from 'vite';

const label = process.argv[2] ?? 'after';
const output = resolve(tmpdir(), 'laffinee-fermentation-poc');
await mkdir(output, { recursive: true });
const root = fileURLToPath(new URL('../../', import.meta.url));
const buildDir = resolve(tmpdir(), `laffinee-fermentation-poc-build-${process.pid}-${Date.now()}`);
await build({ configFile: false, root, plugins: [react()], logLevel: 'error',
  build: { outDir: buildDir, emptyOutDir: true, rollupOptions: { input: resolve(root, 'tests/ux-mobile/fermentation.fixture.html') } } });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = resolve(buildDir, `.${pathname === '/' ? '/tests/ux-mobile/fermentation.fixture.html' : pathname}`);
    if (!file.startsWith(buildDir + sep)) { response.writeHead(403); response.end(); return; }
    const type = ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[extname(file)] ?? 'application/octet-stream';
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': type });
    response.end(content);
  } catch (error) {
    if (!response.headersSent) { response.writeHead(404); response.end(); }
    if (error?.code !== 'ENOENT') console.error(`Erreur de lecture ${request.url}:`, error);
  }
});
await new Promise(resolveListening => server.listen(0, '127.0.0.1', resolveListening));
let browser;
try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  console.log('Build terminé · lancement de Chrome');
  browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    pipe: true,
    timeout: 15000,
    dumpio: false,
    args: ['--mute-audio', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  console.log('Chrome connecté · navigation vers la fixture');
  const results = [];
  const errors = [];
  for (const width of [390, 1280]) {
    const page = await browser.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => errors.push(`Requête échouée : ${request.url()} · ${request.failure()?.errorText ?? 'inconnue'}`));
    await page.setViewport({ width, height: width < 900 ? 844 : 900, isMobile: width < 900, hasTouch: width < 900, deviceScaleFactor: 1 });
    const response = await page.goto(`${base}/tests/ux-mobile/fermentation.fixture.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`Page ${width}px ouverte · HTTP ${response?.status()}`);
    const rendered = await page.waitForSelector('.yc-plan', { timeout: 5000 }).catch(async error => {
      throw Error(`${error.message}; HTTP ${response?.status()}; page=${await page.evaluate(() => location.href)}; body=${JSON.stringify(await page.evaluate(() => document.body.innerText))}; errors=${JSON.stringify(errors)}`);
    });
    assert.ok(rendered);
    console.log(`Composant monté · ${width}px`);
    let duration;
    if (label === 'after') {
      const phase = await page.waitForFunction(() => [...document.querySelectorAll('[data-phase-select="1"]')].find(button => button.getClientRects().length > 0));
      const phaseButton = phase.asElement();
      const bounds = await phaseButton.boundingBox();
      assert.ok(bounds);
      if (width < 900) await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      else await phaseButton.click();
      await page.waitForFunction(() => { const proposal = document.querySelector('.yc-proposal'); return !!proposal && !proposal.hidden; });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: resolve(output, `after-selected-${width}.png`), timeout: 8000 });
      await page.waitForSelector('[aria-label^="Durée du palier 2"]', { visible: true });
      duration = await page.$('[aria-label^="Durée du palier 2"]');
      assert.ok(duration);
      await duration.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type('3');
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => document.querySelector('[data-following-shift]')?.textContent?.includes('+1 j'));
      await page.evaluate(() => {
        const root = document.documentElement, prior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); root.style.scrollBehavior = prior;
        return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
    }
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      figure: document.querySelector('.yc-proposal figure')?.getBoundingClientRect().width ?? null,
      proposalHidden: document.querySelector('.yc-proposal')?.hidden ?? null,
      editor: (() => { const rect = document.querySelector('[aria-label="Modifier le palier sélectionné"]')?.getBoundingClientRect(); return rect ? { top: rect.top, bottom: rect.bottom } : null; })(),
      activeElement: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName ?? null,
    }));
    console.log(`Mesures DOM · ${width}px`);
    assert.ok(layout.document <= layout.viewport, `Document horizontal overflow at ${width}px: ${JSON.stringify(layout)}`);
    assert.ok(layout.body <= layout.viewport, `Body horizontal overflow at ${width}px: ${JSON.stringify(layout)}`);
      const file = resolve(output, `${label}-${width}.png`);
      await page.screenshot({ path: file, timeout: 8000 });
      console.log(`Capture · ${file}`);
    let unknownFile;
    if (label === 'after' && width < 900) {
      await duration.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => {
        const field = [...document.querySelectorAll('input,textarea')].find(element => element.getAttribute('aria-label')?.startsWith('Durée du palier 2'));
        const unpositioned = document.querySelector('[aria-label="Paliers sans largeur temporelle"]');
        return field?.getAttribute('aria-invalid') === 'true' && unpositioned?.textContent?.includes('position non calculable') &&
          !document.querySelector('.yc-proposal figure [data-phase-select="2"]');
      });
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0);
        return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      unknownFile = resolve(output, 'after-unknown-390.png');
      await page.screenshot({ path: unknownFile, timeout: 8000 });
      await duration.click({ clickCount: 3 });
      await page.keyboard.press('Backspace'); await page.keyboard.type('2'); await page.keyboard.press('Tab');
      await page.waitForFunction(() => document.querySelector('[data-following-shift]')?.textContent?.includes('gardent leurs jours'));
    }
    results.push({ width, file, unknownFile, layout });
    await page.close();
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(JSON.stringify({ label, screenshots: results, errors }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolveClosing => server.close(resolveClosing));
}
