// Local browser regression: external API requests are blocked, including Gemini.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:3007';
const out = resolve('.codex-remote-attachments/water-acid-mobile');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const report = [], errors = [];
try {
  for (const width of [390, 320]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      return url.origin === origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)
        ? request.continue() : request.abort();
    });
    await page.goto(`${origin}/?preview=brew&view=eau`, { waitUntil: 'networkidle0' });
    const step = async (name) => {
      const button = await page.evaluateHandle(name => [...document.querySelectorAll('button')]
        .find(e => e.textContent.includes(name)), name);
      await button.asElement().click();
      await button.dispose();
    };
    const dose = async (side, value) => {
      const input = await page.$(`input[aria-label*="Dose d’"][aria-label*="${side}"]`);
      await input.click({ clickCount: 3 });
      await page.keyboard.type(String(value));
      await page.keyboard.press('Tab');
    };
    const reading = () => page.evaluate(() => ({
      mash: document.querySelector('[aria-label="HCO₃ après acide — empâtage"] strong').textContent,
      sparge: document.querySelector('[aria-label="HCO₃ après acide — rinçage"] strong').textContent,
      radar: document.querySelector('svg[aria-label^="Profil ionique"]').getAttribute('aria-label'),
      width: document.documentElement.scrollWidth
    }));
    await step('2. Sels');
    await dose('empâtage', 0);
    await dose('rinçage', 0);
    const before = await reading();
    assert.equal(before.mash, '84');
    assert.equal(before.sparge, '84');
    await dose('rinçage', 1);
    const after = await reading();
    assert.equal(after.mash, '84');
    assert.equal(after.sparge, '36');
    assert.match(after.radar, /Alcalinité .*65 ppm/);
    await page.$eval('[aria-label="HCO₃ après acide — rinçage"]', e => e.scrollIntoView({ block: 'end' }));
    await page.screenshot({ path: resolve(out, `acid-profile-${width}.png`) });
    await page.click('[aria-label="Ajouter 0.5 mL — rinçage"]');
    assert.equal((await reading()).sparge, '12');
    await step('1. Eau');
    await page.click('[role="tab"]:last-child');
    const panel = await page.evaluateHandle(() => [...document.querySelectorAll('span')]
      .find(e => e.textContent === 'Alcalinité restante après acide').closest('.panel'));
    assert.match(await panel.evaluate(e => e.textContent), /10 ppm CaCO₃/);
    assert.match(await panel.evaluate(e => e.textContent), /HCO₃ : 84 → 12 ppm/);
    await panel.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: resolve(out, `sparge-panel-${width}.png`) });
    await step('2. Sels');
    await page.click('[aria-label="Ajouter 0.5 mL — rinçage"]');
    const exhausted = await reading();
    assert.equal(exhausted.sparge, '0');
    assert.match(exhausted.radar, /Alcalinité .*50 ppm/);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('ne diminue plus le HCO₃')));
    assert.ok([before, after, exhausted].every(r => r.width <= width + 1));
    report.push({ width, before, after, exhausted, spargePanelAfterAcid: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log('✓ HCO₃ reactive in both waters, graph and sparge panel at 390/320px; no AI calls.');
} finally {
  await browser.close();
}
