import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Real browser, real controls and rendered audio. Chrome is muted during this check.
const output = resolve('.codex-remote-attachments/brew-controls');
const url = `${process.env.BREW_PREVIEW_URL || 'http://127.0.0.1:3007'}/?preview=brew&view=brassage`;
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const report = { screenshots: [], layouts: [], checks: [], audio: {}, errors: [] };
try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.evaluateOnNewDocument(() => {
    const originalNow = Date.now;
    window.brewClockOffset = 0;
    Date.now = () => originalNow() + window.brewClockOffset;
  });
  const settle = () =>
    page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    );
  const click = async (label, scope = '.brew-page') => {
    const handle = await page.evaluateHandle(
      (label, scope) =>
        [...document.querySelectorAll(`${scope} button`)].find(
          (button) =>
            button.getClientRects().length &&
            !button.closest('dialog:not([open])') &&
            (button.getAttribute('aria-label') || button.textContent.trim()) === label
        ),
      label,
      scope
    );
    assert(handle.asElement(), `Missing button: ${label}`);
    await handle.asElement().click();
    await handle.dispose();
    await settle();
  };
  const shot = async (name) => {
    await settle();
    const layout = await page.evaluate(() => {
      const modal = document.querySelector('dialog[open]');
      const root = modal ?? document.querySelector('.brew-page');
      const shown = (el) =>
        el.getClientRects().length &&
        !el.closest('dialog:not([open])') &&
        !(el.closest('details:not([open])') && !el.closest('summary'));
      const label = (el) => el.getAttribute('aria-label') || el.textContent.trim().slice(0, 70);
      const overflow = [...root.querySelectorAll('*')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return shown(el) && b.width > 0 && (b.right > innerWidth + 1 || b.left < -1);
        })
        .map(label);
      const smallTargets = [
        ...root.querySelectorAll('button,summary,input[type="radio"],input[type="checkbox"]')
      ]
        .filter((el) => {
          const b = (el.closest('label') ?? el).getBoundingClientRect();
          return shown(el) && b.width > 0 && (b.width < 43 || b.height < 43);
        })
        .map(label);
      return { overflow, smallTargets };
    });
    report.layouts.push({ name, ...layout });
    assert.deepEqual(layout.overflow, [], `${name}: overflow`);
    assert.deepEqual(layout.smallTargets, [], `${name}: touch target under 44 px`);
    const file = resolve(output, `${name}.png`);
    await page.screenshot({ path: file });
    report.screenshots.push(file);
  };
  const viewport = async (width, height) => {
    await page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await settle();
  };
  const top = async () => {
    await page.$eval('.brew-page main', (el) => el.scrollTo(0, 0));
    await settle();
  };
  const choose = async (name) => {
    await click('Choisir une étape');
    await click(name, '.brew-choice-dialog[open]');
  };

  await viewport(390, 844);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await click('Choisir une étape');
  await shot('01-mobile-step-menu');
  assert.equal(
    await page.$eval('dialog[open] [aria-pressed="true"]', (el) => el.getAttribute('aria-label')),
    'Eau et sels'
  );
  await page.keyboard.press('ArrowDown');
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
    'Concassage'
  );
  await page.keyboard.press('Escape');
  assert.equal(await page.$('dialog[open]'), null);
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
    'Choisir une étape'
  );
  report.checks.push('Step choices support keyboard navigation, Escape and focus return');

  await click('Autre sel ou acide à consigner');
  await shot('02-mobile-ingredient-menu');
  const client = await page.createCDPSession();
  const swipe = await page.$eval('.brew-choice-dialog[open] .brew-choice-options', (el) => {
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.bottom - 30, height: b.height };
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: swipe.x, y: swipe.y }]
  });
  for (let i = 1; i <= 6; i++)
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: swipe.x, y: swipe.y - i * Math.min(45, (swipe.height - 70) / 6) }]
    });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert(
    await page.$('.brew-choice-dialog[open]'),
    'Swiping an ingredient list must not select a row'
  );
  assert(
    (await page.$eval('.brew-choice-dialog[open] .brew-choice-options', (el) => el.scrollTop)) > 0,
    'Ingredient list scrolls by touch'
  );
  await page.type('input[aria-label="Rechercher un ingrédient"]', 'ACIDE');
  assert(
    (await page.$$eval('.brew-choice-dialog[open] [data-brew-choice]', (els) => els.length)) > 0
  );
  assert(
    await page.$$eval('.brew-choice-dialog[open] [data-brew-choice]', (els) =>
      els.every((el) => /acide/i.test(el.textContent))
    )
  );
  await shot('03-mobile-ingredient-search');
  await page.$eval('input[aria-label="Rechercher un ingrédient"]', (el) => {
    el.select();
  });
  await page.type('input[aria-label="Rechercher un ingrédient"]', 'potassium');
  await click('Chlorure de potassium', '.brew-choice-dialog[open]');
  assert.equal(await page.$('dialog[open]'), null);
  assert.match(
    await page.$eval('.brew-ingredients', (el) => el.textContent),
    /Chlorure de potassium/
  );
  report.checks.push(
    'Ingredient sheet scrolls by touch without selecting; search and product selection work'
  );

  await click('Empâter');
  await click('Démarrer');
  assert.equal(await page.$eval('.brew-step-meta .brew-tag', (el) => el.textContent), 'En cours');
  assert.equal(
    await page.$eval('.brew-step-meta .brew-tag svg', (el) => getComputedStyle(el).animationName),
    'brew-turn'
  );
  await click('Choisir une étape');
  await shot('04-mobile-active-tags');
  await viewport(320, 740);
  await shot('05-small-mobile-step-menu');
  await viewport(844, 390);
  await shot('06-landscape-step-menu');
  await click('Mashout', '.brew-choice-dialog[open]');
  assert.equal(await page.$eval('.brew-step-meta .brew-tag', (el) => el.textContent), 'À faire');
  await choose('Empâtage');
  await click('Mettre le minuteur en pause');
  assert.equal(await page.$eval('.brew-step-meta .brew-tag', (el) => el.textContent), 'En pause');
  await viewport(390, 844);
  await top();
  await shot('07-mobile-paused-tag');
  await click('Reprendre');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  assert.equal(
    await page.$eval('.brew-step-meta .brew-tag svg', (el) => getComputedStyle(el).animationName),
    'none'
  );
  await page.emulateMediaFeatures([]);
  report.checks.push(
    'Tags track actual timer state; consultation does not start or stop a timer; reduced motion is respected'
  );

  await click('Relever une mesure');
  await page.type('#brew-reading', '5,8');
  await page.click('[aria-label="Mesures de cette étape"] input[type="checkbox"]');
  const context = await page.evaluateHandle(() =>
    [...document.querySelectorAll('dialog[open] summary')].find((el) =>
      el.textContent.includes('Maische')
    )
  );
  await context.asElement().click();
  await page.click('input[type="radio"][value="phosphorique"]');
  await page.$eval('.brew-acid-choice', (el) => el.scrollIntoView({ block: 'center' }));
  await shot('08-mobile-acid-choice');
  assert(await page.$eval('input[type="radio"][value="phosphorique"]', (el) => el.checked));
  assert.equal(await page.$('dialog[open] select'), null);
  await page.keyboard.press('Escape');
  report.checks.push(
    'Acid concentration choices are large radio rows and preserve explicit dose confirmation'
  );

  await page.click('.brew-options > summary');
  await page.click('.brew-sound-settings > summary');
  await click('Tester la sonnerie');
  await page.waitForSelector('.brew-ringing');
  await top();
  await shot('09-mobile-test-alarm');
  await click('Arrêter la sonnerie', '.brew-ringing');
  assert.equal(await page.$('.brew-ringing'), null);
  assert.equal(
    await page.$eval('button[aria-label="Couper les alertes sonores"]', (el) =>
      el.getAttribute('aria-pressed')
    ),
    'true'
  );
  await click('Recette');
  await page.evaluate(() => {
    window.brewClockOffset = 61 * 60000;
  });
  await page.waitForSelector('.brew-ringing');
  await viewport(320, 740);
  await top();
  await shot('10-small-mobile-due-alarm');
  assert.match(await page.$eval('.brew-ringing-reason', (el) => el.textContent), /Fin · Empâtage/);
  await page.click('.brew-ringing-reason');
  assert.equal(
    await page.$eval('.brew-step-meta .brew-tag', (el) => el.textContent),
    'Temps écoulé'
  );
  await click('Arrêter la sonnerie', '.brew-ringing');
  assert.equal(await page.$('.brew-ringing'), null);
  assert(
    await page.$('.brew-next-alarm.is-due'),
    'Stopping the sound does not mark the brewing action done'
  );
  report.checks.push(
    'Test and real expiry ring; visible alarm identifies the action and opens its step; stop keeps future alerts active'
  );

  await viewport(390, 844);
  await page.goto(`${url}&keyboard=300`, { waitUntil: 'networkidle0' });
  await click('Autre sel ou acide à consigner');
  await page.type('input[aria-label="Rechercher un ingrédient"]', 'acide');
  await shot('11-mobile-search-keyboard');
  assert(
    (await page.$eval('.brew-choice-dialog[open]', (el) => el.getBoundingClientRect().bottom)) <=
      545
  );
  await viewport(1440, 1050);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await click('Choisir une étape');
  await shot('12-desktop-step-menu');
  report.checks.push('Menus fit 320 px, landscape, desktop and a simulated 300 px keyboard');

  report.audio = await page.evaluate(async () => {
    const { scheduleBrewAlarm } = await import('/src/services/brewSound.ts');
    const rate = 22050;
    const ctx = new OfflineAudioContext(1, 31 * rate, rate);
    scheduleBrewAlarm(ctx);
    const data = (await ctx.startRendering()).getChannelData(0);
    let peak = 0,
      last = 0;
    for (let i = 0; i < data.length; i++) {
      const n = Math.abs(data[i]);
      peak = Math.max(peak, n);
      if (n > 0.01) last = i / rate;
    }
    const frequency = (from, to) => {
      let crossings = 0;
      for (let i = Math.ceil(from * rate); i < to * rate; i++)
        if (data[i] <= 0 && data[i + 1] > 0) crossings++;
      return Math.round(crossings / (to - from));
    };
    const ctxStop = new OfflineAudioContext(1, 2 * rate, rate);
    const stop = scheduleBrewAlarm(ctxStop);
    const suspended = ctxStop.suspend(1);
    const rendering = ctxStop.startRendering();
    await suspended;
    stop();
    stop();
    await ctxStop.resume();
    const stopped = (await rendering).getChannelData(0);
    let afterStopPeak = 0;
    for (let i = Math.ceil(1.05 * rate); i < stopped.length; i++)
      afterStopPeak = Math.max(afterStopPeak, Math.abs(stopped[i]));
    return {
      peak,
      lastAudibleSecond: last,
      firstFrequencyHz: frequency(0.1, 0.3),
      secondFrequencyHz: frequency(0.75, 0.95),
      afterStopPeak
    };
  });
  assert(report.audio.peak > 0.4 && report.audio.peak < 1, 'Stronger signal without clipping');
  assert(
    report.audio.lastAudibleSecond > 29 && report.audio.lastAudibleSecond <= 30.1,
    'Thirty-second alarm'
  );
  assert(Math.abs(report.audio.firstFrequencyHz - 880) < 15);
  assert(Math.abs(report.audio.secondFrequencyHz - 1175) < 15);
  assert.equal(report.audio.afterStopPeak, 0, 'Stop silences already scheduled audio');
  report.checks.push(
    'Offline audio rendering verifies duration, gain, alternating notes and immediate silence after stop'
  );
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
