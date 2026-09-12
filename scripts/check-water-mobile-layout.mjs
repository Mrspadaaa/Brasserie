import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = process.env.WATER_PREVIEW_URL ?? 'http://127.0.0.1:3008';
const output = resolve('.codex-remote-attachments/water-mobile-layout');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const report = [];
const painted = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function check(page, width, height, stage) {
  await painted(page);
  const result = await page.evaluate(() => {
    const controls = document.querySelector('[data-water-controls]');
    const bounds = node => { const rect = node.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height }; };
    const main = controls.closest('main');
    const grid = controls.querySelector('.water-salt-grid');
    const inputs = [...controls.querySelectorAll('input[type="text"]')];
    const obscured = [...controls.querySelectorAll('button:not(:disabled), input[type="text"]:not(:disabled)')].filter(node => {
      const rect = node.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return !hit || !node.contains(hit);
    }).map(node => node.getAttribute('aria-label') ?? node.textContent.trim());
    return { core: bounds(controls), viewport: bounds(main), radar: bounds(controls.querySelector('svg[role="img"]')),
      slider: bounds(controls.querySelector('.water-ratio-compact')), grid: bounds(grid), acids: bounds(controls.querySelector('[data-water-acids]')),
      rows: new Set([...grid.children].map(node => Math.round(node.getBoundingClientRect().top))).size,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, count: grid.children.length,
      inputs: inputs.map(node => ({ name: node.getAttribute('aria-label'), ...bounds(node) })), obscured,
      diagnosticsAfterControls: !!(controls.compareDocumentPosition(document.querySelector('[aria-label="Bilan des objectifs de l’eau"]')) & Node.DOCUMENT_POSITION_FOLLOWING),
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  const context = `${width}×${height}, ${stage}`;
  assert.equal(result.rows, 3, context + ': three salt rows');
  assert.equal(result.columns, 3, context + ': three salt columns');
  assert.equal(result.count, 9, context + ': all nine salts');
  assert.equal(result.inputs.length, 11, context + ': nine salts and both acids');
  assert.ok(result.radar.height >= 159, context + ': readable radar');
  assert.ok(result.radar.bottom <= result.slider.top && result.slider.bottom <= result.grid.top && result.grid.bottom <= result.acids.top, context + ': radar, slider, salts, acids in that order');
  assert.ok(result.core.top >= result.viewport.top && result.core.bottom <= result.viewport.bottom + 1, context + ': complete controls visible without scrolling');
  assert.ok(result.inputs.every(input => input.width >= 43.9 && input.height >= (height <= 790 ? 40 : 44)), context + ': usable numeric fields');
  assert.equal(result.diagnosticsAfterControls, true, context + ': explanations follow the controls');
  assert.deepEqual(result.obscured, [], context + ': no floating control obscures a dose');
  assert.ok(result.scrollWidth <= width, context + ': no horizontal overflow');
  return { stage, ...result };
}
try {
  for (const view of ['eau', 'assistant']) for (const [width, height] of [[320,740],[390,740],[390,844],[414,896]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height, isMobile: true, hasTouch: true });
    await page.goto(`${origin}/?preview=brew&view=${view}`, { waitUntil: 'networkidle0' });
    if (view === 'assistant') await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(button => button.textContent.includes('Eau')).click());
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('2. Sels')).click());
    const stages = [await check(page, width, height, 'opening')];
    await page.screenshot({ path: resolve(output, `${view}-${width}-${height}-initial.png`) });
    await page.click('button[aria-label="Ajouter 0.5 g de Gypse"]');
    stages.push(await check(page, width, height, 'manual salt'));
    const sparge = await page.$('input[aria-label^="Dose d’"][aria-label*="au rinçage"]');
    await sparge.click();
    await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
    await page.keyboard.type('5,2'); await page.keyboard.press('Tab');
    stages.push(await check(page, width, height, 'manual acid'));
    await page.focus('input[name="ratio_slider_range"]'); await page.keyboard.press('End');
    stages.push(await check(page, width, height, 'constrained ratio'));
    // Exercise the existing notification pill's layout without creating an AI job.
    await page.evaluate(() => {
      const companion = document.querySelector('.brewer-global-companion');
      if (companion && !document.querySelector('.brewer-activity-pill')) {
        const pill = companion.cloneNode(true);
        pill.className = 'brewer-activity-pill has-answer';
        pill.setAttribute('aria-label', 'Compagnon : une réponse prête');
        const label = document.createElement('span'); label.textContent = 'Mes conversations';
        pill.append(label); companion.after(pill);
      }
    });
    stages.push(await check(page, width, height, 'notification visible'));
    await page.screenshot({ path: resolve(output, `${view}-${width}-${height}.png`) });
    await page.click('button[aria-label="Détail des minéraux de Gypse"]');
    await page.waitForSelector('section[aria-label="Détail des minéraux de Gypse"]', { visible: true });
    assert.deepEqual(errors, [], `${view} ${width}×${height}: runtime errors`);
    report.push({ view, width, height, stages });
    await page.close();
  }
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log('✓ Atelier et assistant : radar, slider, 9 sels et 2 acides visibles ensemble à 320×740, 390×740, 390×844 et 414×896, y compris après saisie. Aucun contrôle masqué ; minéraux accessibles.');
} finally { await browser.close(); }
