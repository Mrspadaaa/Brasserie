import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Uses real components with the development fixture, without an account or live data.
const output = resolve(process.env.BREW_CAPTURE_DIR || '.codex-remote-attachments/brew-ux-v2');
const url = `${process.env.BREW_PREVIEW_URL || 'http://127.0.0.1:3007'}/?preview=brew&view=brassage`;
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const report = { screenshots: [], layouts: [], checks: [], fold: {}, errors: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => report.errors.push(error.message));
  const settle = () =>
    page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
    );
  const click = async (label, scope = '.brew-page') => {
    await page.waitForFunction(
      (label, scope) =>
        [...document.querySelectorAll(`${scope} button`)].some(
          (b) =>
            b.getClientRects().length &&
            (b.getAttribute('aria-label') || b.textContent.trim()) === label
        ),
      {},
      label,
      scope
    );
    const handle = await page.evaluateHandle(
      (label, scope) =>
        [...document.querySelectorAll(`${scope} button`)].find(
          (b) =>
            b.getClientRects().length &&
            (b.getAttribute('aria-label') || b.textContent.trim()) === label
        ),
      label,
      scope
    );
    await handle.asElement().click();
    await handle.dispose();
    await settle();
  };
  const phase = async (label) => {
    if (
      !['Conduite', 'Recette', 'Journal'].includes(label) &&
      (await page.$eval('.brew-navigation', (el) => el.hidden))
    )
      await click('Conduite');
    await click(label);
  };
  const chooseStep = async (label) => {
    await click('Choisir une étape');
    await click(label, '.brew-choice-dialog[open]');
    await page.waitForSelector('.brew-choice-dialog[open]', { hidden: true });
  };
  const top = async () => {
    await page.$eval('.brew-page main', (el) => el.scrollTo(0, 0));
    await settle();
  };
  const layout = async (name) => {
    const result = await page.evaluate(() => {
      const roots = [...document.querySelectorAll('.brew-page, .brew-confirm')];
      const shown = (el) =>
        el.getClientRects().length &&
        !(el.closest('details:not([open])') && !el.closest('summary')) &&
        !el.closest('dialog:not([open])');
      const describe = (el) => ({
        tag: el.tagName,
        label: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 65)
      });
      const overflow = roots
        .flatMap((root) => [...root.querySelectorAll('*')])
        .filter((el) => {
          if (!shown(el)) return false;
          const box = el.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.right > innerWidth + 1 || box.left < -1);
        })
        .slice(0, 8)
        .map(describe);
      const smallTargets = roots
        .flatMap((root) => [
          ...root.querySelectorAll('button, summary, select, input[type="checkbox"]')
        ])
        .filter((el) => {
          if (!shown(el)) return false;
          const box = (el.closest('label') ?? el).getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.height < 43 || box.width < 43);
        })
        .map(describe);
      return { overflow, smallTargets };
    });
    report.layouts.push({ name, ...result });
    assert.deepEqual(result.overflow, [], `${name}: horizontal overflow`);
    assert.deepEqual(result.smallTargets, [], `${name}: touch target below 44 px`);
  };
  const screenshot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await settle();
    await page.$$eval('.brew-confirm', (els) =>
      Promise.allSettled(
        els
          .flatMap((el) => el.getAnimations({ subtree: true }))
          .map((animation) => animation.finished)
      )
    );
    await layout(name);
    const file = resolve(output, `${name}.png`);
    await page.screenshot({ path: file });
    report.screenshots.push(file);
  };
  const viewport = async (width, height) => {
    await page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await settle();
  };
  const measure = async () => {
    await click('Relever une mesure');
    await page.waitForSelector('dialog[open][aria-label="Mesurer"]');
  };
  const closeCapture = async () => {
    await click('Retour à l’étape', 'dialog[open]');
    assert.equal(await page.$('dialog.is-mobile[open]'), null);
    assert(await page.$('.brew-page > footer'));
  };

  await viewport(390, 844);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await screenshot('01-mobile-preparation');
  report.fold = await page.evaluate(() => ({
    firstDoseY: document.querySelector('.brew-amount').getBoundingClientRect().top,
    completeIngredients: [...document.querySelectorAll('.brew-ingredient')].filter((el) => {
      const box = el.getBoundingClientRect();
      return (
        box.top >= document.querySelector('.brew-page header').getBoundingClientRect().bottom &&
        box.bottom <= document.querySelector('.brew-page > footer').getBoundingClientRect().top
      );
    }).length
  }));
  assert(report.fold.completeIngredients >= 3);
  await page.click('input[aria-label="Ajouté : Eau d’empâtage"]');
  assert(await page.$('.brew-page > footer'), 'Checking an addition keeps actions available');
  await click('Modifier la quantité de Chlorure de calcium au mash');
  await click('Augmenter Chlorure de calcium');
  await screenshot('02-mobile-dose');
  await click('Fermer l’ajustement');
  await page.click('input[aria-label="Ajouté : Chlorure de calcium"]');
  await click('Ajouter une note');
  await page.type('#brew-note', 'Recirculation régulière. Eau préparée et doses vérifiées.');
  await screenshot('03-mobile-note');
  await closeCapture();
  await phase('Empâter');
  await click('Ajouter une note');
  assert.match(
    await page.$eval('dialog[aria-label="Note"] header', (el) => el.textContent),
    /Eau et sels/
  );
  await click('Noter', 'dialog[aria-label="Note"]');
  assert.equal(await page.$('dialog.is-mobile[open]'), null);
  report.checks.push('Note draft keeps its original step when closing and changing phase');

  await click('Démarrer');
  await measure();
  await page.type('#brew-reading', '5,4');
  await page.click('[aria-label="Mesures de cette étape"] input[type="checkbox"]');
  await page.click('[aria-label="Mesures de cette étape"] button[type="submit"]');
  await screenshot('04-mobile-measure');
  await closeCapture();
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    'Relever une mesure',
    'Modal restores focus to its trigger'
  );
  await top();
  await screenshot('05-mobile-mash');
  assert.match(await page.$eval('.brew-readings-summary', (el) => el.textContent), /5,4/);
  await measure();
  await page.type('#brew-reading', '5,');
  const previousTick = await page.$eval('[aria-label="Temps restant"]', (el) => el.textContent);
  await page.waitForFunction(
    (before) => document.querySelector('[aria-label="Temps restant"]').textContent !== before,
    {},
    previousTick
  );
  assert.equal(await page.$eval('#brew-reading', (el) => el.value), '5,');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'brew-reading');
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog.is-mobile[open]', { hidden: true });
  assert(await page.$('.brew-page'), 'Escape closes only the capture');
  await phase('Recette');
  await screenshot('06-mobile-recipe');
  await click('Revenir au brassage');
  await measure();
  assert.equal(await page.$eval('#brew-reading', (el) => el.value), '5,');
  await closeCapture();
  await chooseStep('Mashout');
  await measure();
  assert.equal(await page.$eval('#brew-reading', (el) => el.value), '');
  await closeCapture();
  await chooseStep('Empâtage');
  await measure();
  assert.equal(await page.$eval('#brew-reading', (el) => el.value), '5,');
  await closeCapture();
  report.checks.push(
    'Measurement draft and focus survive ticks, closing, consultation and step changes'
  );
  await click('Terminer le palier');
  await page.waitForSelector('[role="dialog"]:not(.brew-capture)');
  await screenshot('07-mobile-confirm-timer');
  await click('Annuler', '[role="dialog"]:not(.brew-capture)');
  await page.waitForSelector('[role="dialog"]:not(.brew-capture)', { hidden: true });
  await click('Mettre le minuteur en pause');
  report.checks.push('Early timer completion asks for confirmation; cancelling keeps it running');

  await phase('Ébullition');
  assert(await page.$('[aria-label="Minuteurs actifs"]'));
  await click('Ébullition atteinte');
  await click('Ajuster la durée');
  await click('Ajouter 5 minutes');
  assert.equal(await page.$eval('[aria-label="Durée totale en minutes"]', (el) => el.value), '80');
  await click('Ajuster la durée');
  await top();
  await screenshot('08-mobile-boil');
  assert.equal(await page.$('input[aria-label="Ajouté : Citra"]'), null);
  await chooseStep('Whirlpool');
  await screenshot('09-mobile-whirlpool');
  assert(await page.$('input[aria-label="Ajouté : Citra"]'));
  await phase('Refroidir');
  await screenshot('10-mobile-cooling');
  await chooseStep('Ensemencement');
  await screenshot('11-mobile-pitch');
  await click('Clôturer le brassage');
  await page.waitForSelector('[role="dialog"]:not(.brew-capture)');
  await screenshot('12-mobile-finish-review');
  await click('Annuler', '[role="dialog"]:not(.brew-capture)');
  await page.waitForSelector('[role="dialog"]:not(.brew-capture)', { hidden: true });
  report.checks.push(
    'Boil and whirlpool additions stay separate; pitching and final review remain accessible'
  );

  await phase('Journal');
  await screenshot('13-mobile-journal');
  assert.match(
    await page.$eval('.brew-journal-timeline', (el) => el.textContent),
    /Chlorure de calcium/
  );
  await page.$$eval('[aria-label="Filtrer le journal"] button', (els) =>
    els.find((b) => b.textContent.startsWith('Ajouts')).click()
  );
  assert.equal(await page.$$eval('.brew-journal-event', (els) => els.length), 2);
  const session = await page.createCDPSession();
  await session.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: output });
  await click('Exporter .txt');
  await viewport(1440, 1050);
  await phase('Empâter');
  await screenshot('14-desktop-mash');
  await phase('Préparer');
  await screenshot('15-desktop-preparation');
  await phase('Journal');
  await page.$eval('[aria-label="Filtrer le journal"] button', (el) => el.click());
  await screenshot('16-desktop-journal');
  const exported = await readFile(resolve(output, 'carnet-brassage.txt'), 'utf8');
  assert.match(exported, /Recirculation régulière/);
  assert.match(exported, /Chlorure de calcium/);
  assert.match(exported, /5.4/);
  report.checks.push('Filtered journal exports all actual additions, notes and readings');

  await viewport(320, 740);
  for (const name of ['Préparer', 'Empâter', 'Ébullition', 'Refroidir', 'Recette', 'Journal']) {
    await phase(name);
    await layout(`320-${name}`);
  }
  await phase('Empâter');
  await click('Ajuster la durée');
  await screenshot('17-small-mobile-duration');
  await measure();
  await screenshot('18-small-mobile-measure');
  await closeCapture();
  await viewport(844, 390);
  await click('Ajuster la durée');
  await top();
  await screenshot('19-landscape');
  const instrumentBounds = await page.$eval('.brew-instruments', (el) => ({
    top: el.getBoundingClientRect().top,
    bottom: el.getBoundingClientRect().bottom,
    footerTop: document.querySelector('.brew-page > footer').getBoundingClientRect().top
  }));
  assert(
    instrumentBounds.top > 0 && instrumentBounds.bottom < instrumentBounds.footerTop,
    'Landscape keeps current temperature and clock above the footer'
  );
  await measure();
  await screenshot('20-landscape-measure');
  await closeCapture();
  await viewport(390, 844);
  await page.goto(`${url}&keyboard=300`, { waitUntil: 'networkidle0' });
  await phase('Empâter');
  await measure();
  await page.type('#brew-reading', '5,7');
  await page.click('[aria-label="Mesures de cette étape"] input[type="checkbox"]');
  await screenshot('21-mobile-keyboard');
  const bounds = await page.$eval('dialog[open][aria-label="Mesurer"]', (el) => ({
    top: el.getBoundingClientRect().top,
    bottom: el.getBoundingClientRect().bottom,
    actionBottom: el.querySelector('footer').getBoundingClientRect().bottom
  }));
  assert(bounds.top >= 0 && bounds.bottom <= 544 && bounds.actionBottom <= 544);
  await page.click('[aria-label="Mesures de cette étape"] button[type="submit"]');
  await closeCapture();
  assert.match(await page.$eval('.brew-readings-summary', (el) => el.textContent), /5,7/);
  report.checks.push(
    'Capture scrolls above a simulated 300 px keyboard and saves with return action accessible'
  );
  await phase('Préparer');
  await click('Modifier la quantité de Chlorure de calcium au mash');
  await page.click('input[aria-label="Quantité réelle de Chlorure de calcium au mash"]');
  await page.type('input[aria-label="Quantité réelle de Chlorure de calcium au mash"]', '6,2');
  await screenshot('22-mobile-dose-keyboard');
  assert(
    await page.$eval(
      'input[aria-label="Quantité réelle de Chlorure de calcium au mash"]',
      (el) => el.getBoundingClientRect().bottom <= 544
    )
  );
  await click('Fermer l’ajustement');
  report.checks.push('Inline dose input remains above the simulated keyboard');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
