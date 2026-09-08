// Run after check-water-bicarbonate.mjs has created the local Ttt fixture.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const origin = 'http://127.0.0.1:3008';
const output = resolve('.codex-remote-attachments/water-consequences');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const report = [];
async function paint(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function click(page, label) {
  const button = await page.evaluateHandle(label => [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === label || button.textContent.includes(label)), label);
  assert.ok(button.asElement(), `Bouton absent : ${label}`);
  await button.asElement().evaluate(button => button.scrollIntoView({ block: 'center' }));
  await button.asElement().click();
  await button.dispose();
  await paint(page);
}
try {
  for (const width of [320, 390, 768]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height: 844, isMobile: width < 768, hasTouch: true });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const network = await page.createCDPSession();
    await network.send('Network.enable');
    // Fetch interception can pause module-worker imports indefinitely.
    await network.send('Network.setBlockedURLs', { urls: ['https://*'] });
    await page.goto(`${origin}/.codex-remote-attachments/bicarbonate-fixture/index.html`, { waitUntil: 'networkidle0' });
    if (width < 640) await click(page, '2. Sels');
    await click(page, 'Proposer les doses');
    await click(page, 'Ajouter 0.5 g de Gypse');
    const selector = '[aria-label="Conséquences du réglage de Gypse"]';
    await page.waitForSelector(selector);
    await page.click(`${selector} summary`);
    await paint(page);
    const salt = await page.$eval(selector, node => ({ text: node.textContent,
      fits: node.scrollWidth <= node.clientWidth + 1,
      summaryHeight: node.querySelector('summary').getBoundingClientRect().height,
      afterControls: !!(document.querySelector('[data-water-controls]').compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) }));
    assert.match(salt.text, /Ca \+3,6/);
    assert.match(salt.text, /SO₄ \+8,6/);
    assert.equal(salt.afterControls, true);
    assert.ok(salt.fits && salt.summaryHeight >= 44);
    const card = await page.evaluateHandle(selector => document.querySelector(selector), selector);
    await card.asElement().screenshot({ path: resolve(output, `salt-${width}.png`) });
    await card.dispose();
    const acid = 'input[aria-label^="Dose d’acide lactique"][aria-label*="au rinçage"]';
    await page.$eval(acid, input => input.scrollIntoView({ block: 'center' }));
    await page.click(acid);
    await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
    await page.keyboard.type('5,2'); await page.keyboard.press('Tab'); await paint(page);
    const acidImpact = '[aria-label="Conséquences du réglage de Acide rinçage"]';
    assert.match(await page.$eval(acidImpact, node => node.textContent), /HCO₃ \+18,6/);
    await page.click(`${acidImpact} summary`); await paint(page);
    await (await page.$(acidImpact)).screenshot({ path: resolve(output, `acid-${width}.png`) });
    await page.focus('input[name="ratio_slider_range"]');
    await page.keyboard.press('End'); await paint(page);
    await page.waitForSelector('[aria-label="Explication du rapport SO₄/Cl"]', { timeout: 10000 });
    const ratio = await page.$eval('[aria-label="Explication du rapport SO₄/Cl"]', node => node.textContent);
    assert.match(ratio, /SO₄ ≥ 720 ppm/);
    assert.equal(await page.$(acidImpact), null, 'Un nouveau plan efface les conséquences du geste précédent');
    const layout = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll('[aria-label^="Conséquences du réglage"] *')].some(node => node.scrollWidth > node.clientWidth + 1) }));
    assert.ok(layout.documentWidth <= width + 1);
    assert.deepEqual(errors, []);
    report.push({ width, salt, ratio, layout, errors });
    await page.close();
  }
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log('✓ Conséquences sous les commandes, deltas réels, ratio impossible expliqué ; 320/390/768 px, détails tactiles ≥44 px, aucune erreur JavaScript.');
} finally { await browser.close(); }
