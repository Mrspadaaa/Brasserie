import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('.codex-remote-attachments/brew-adaptive');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const report = { screenshots: [], layouts: [], checks: [], errors: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.evaluateOnNewDocument(() => {
    const original = Date.now;
    window.brewOffset = 0;
    Date.now = () => original() + window.brewOffset;
  });
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1
  });
  await page.goto('http://127.0.0.1:3007/?preview=brew&view=brassage');
  await page.waitForSelector('.brew-assist');
  const settle = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  const click = async (label, scope = '.brew-page') => {
    const h = await page.evaluateHandle(
      (label, scope) =>
        [...document.querySelectorAll(`${scope} button`)].find(
          (b) =>
            (b.getAttribute('aria-label') || b.textContent.trim()) === label &&
            b.getClientRects().length &&
            !b.closest('dialog:not([open])')
        ),
      label,
      scope
    );
    assert(h.asElement(), `Missing ${label}`);
    await h.asElement().click();
    await h.dispose();
    await settle();
  };
  const input = async (label, value) => {
    const el = await page.$(`input[aria-label="${label}"]`);
    assert(el, `Input ${label}`);
    await el.click({ clickCount: 3 });
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.type(String(value));
    await page.keyboard.press('Tab');
    await settle();
  };
  const helper = async () => {
    if (!(await page.$eval('.brew-assist', (e) => e.open)))
      await page.click('.brew-assist>summary');
    await page.$eval('.brew-assist', (e) => e.scrollIntoView({ block: 'start' }));
    await settle();
  };
  const measure = async (value) => {
    await page.waitForSelector('.brew-capture[open]');
    await page.click('#brew-reading', { clickCount: 3 });
    await page.keyboard.type(String(value));
    await click('Noter', '.brew-capture[open]');
    await page.keyboard.press('Escape');
    await settle();
  };
  const shot = async (name) => {
    const layout = await page.evaluate(() => {
      const modal = document.querySelector('dialog[open]'),
        root = modal ?? document.querySelector('.brew-page');
      const shown = (e) =>
        e.getClientRects().length &&
        !e.closest('dialog:not([open])') &&
        !(e.closest('details:not([open])') && !e.closest('summary'));
      const label = (e) => e.getAttribute('aria-label') || e.textContent.trim().slice(0, 80);
      const overflow = [...root.querySelectorAll('*')]
        .filter((e) => {
          const b = e.getBoundingClientRect();
          return shown(e) && b.width > 0 && (b.right > innerWidth + 1 || b.left < -1);
        })
        .map(label);
      const small = [...root.querySelectorAll('button,summary,input')]
        .filter((e) => {
          const b = (e.closest('label') ?? e).getBoundingClientRect();
          return shown(e) && b.width > 0 && (b.width < 43 || b.height < 43);
        })
        .map(label);
      return { overflow, small };
    });
    report.layouts.push({ name, ...layout });
    assert.deepEqual(layout.overflow, [], `${name} overflow`);
    assert.deepEqual(layout.small, [], `${name} touch targets`);
    const path = resolve(output, `${name}.png`);
    await page.screenshot({ path });
    report.screenshots.push(path);
  };
  assert.equal(await page.$eval('.brew-options', (e) => e.open), false);
  assert.equal(await page.$eval('.brew-sound-settings', (e) => e.open), false);
  await helper();
  await input('Osmosée réellement disponible (L)', 2);
  await shot('01-water-mobile');
  await click('Consigner cette coupe');
  assert.match(await page.$eval('.brew-water-split', (e) => e.textContent), /2 L.*osmosée/);
  await click('Rinçage · 76 °C');
  await shot('02-sparge-water');
  await click('Empâter');
  await helper();
  await click('Commencer la montée');
  await measure(67);
  await helper();
  await shot('03-ramp-mobile');
  await click('Démarrer');
  await page.evaluate(() => (window.brewOffset = 16 * 3600000));
  await page.waitForSelector('.brew-recovery');
  await page.$eval('.brew-station', (e) => e.scrollIntoView({ block: 'start' }));
  await shot('04-old-timer-recovery');
  assert.match(await page.$eval('.brew-clock output', (e) => e.textContent), /00:00/);
  await click('Consigner la fin maintenant');
  await click('Ébullition');
  await helper();
  await input('Ébullition totale (min)', 70);
  await input('Ajout à +… min depuis le début', 30);
  await input('Évaporation mesurée (L/h)', 4);
  await shot('05-boil-simulation');
  await click('Appliquer au programme');
  assert.match(await page.$eval('.brew-clock output', (e) => e.textContent), /1 h 10/);
  await click('Refroidir');
  await helper();
  await input('Eau de refroidissement (°C)', 15);
  await click('Commencer le suivi');
  await measure(100);
  await page.evaluate(() => (window.brewOffset += 10 * 60000));
  await helper();
  await click('Relever la température');
  await measure(60);
  await helper();
  await page.waitForFunction(() =>
    document.querySelector('.brew-assist')?.textContent.includes('Encore ≈')
  );
  assert.match(await page.$eval('.brew-assist', (e) => e.textContent), /Encore ≈/);
  await shot('06-cooling-estimate');
  await input('Eau de refroidissement (°C)', 30);
  assert.match(await page.$eval('.brew-assist', (e) => e.textContent), /ne permet pas/);
  await shot('07-cooling-unreachable');
  for (const [width, height] of [
    [320, 740],
    [844, 390],
    [1440, 1000]
  ]) {
    await page.setViewport({
      width,
      height,
      isMobile: width < 900,
      hasTouch: width < 900,
      deviceScaleFactor: 1
    });
    await helper();
    await shot(`08-cooling-${width}`);
  }
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1
  });
  await click('Recette');
  await page.click('.brew-disclosure>summary');
  assert.match(await page.$eval('.brew-program', (e) => e.textContent), /60 min/);
  await shot('09-recipe-original');
  report.checks.push(
    'Options hidden by default; RO recorded separately; sparge temperature displayed; ramp separate from hold; old timer recovery; 70-minute boil simulation; nonlinear cooling ETA and unreachable setpoint; recipe program unchanged.'
  );
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify({
    screenshots: report.screenshots.length,
    layouts: report.layouts.length,
    checks: report.checks,
    errors: report.errors
  })
);
