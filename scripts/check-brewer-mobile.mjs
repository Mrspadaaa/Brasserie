// Visual fixture test: real UI, deterministic transport; live-model/server checks run separately.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const out = resolve('.codex-remote-attachments/brewer-mobile');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const errors = [],
  report = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  // Intercept the callable too: Vite hot refresh may retain a timestamped service module.
  // This keeps the test at the network boundary instead of relying on module identity.
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    if (!/\/(askBrewer|getBrewerConversation)$/.test(req.url())) {
      await req.continue();
      return;
    }
    const headers = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:3007',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        req.headers()['access-control-request-headers'] ?? 'content-type, authorization',
      'Content-Type': 'application/json'
    };
    if (req.method() === 'OPTIONS') {
      await req.respond({ status: 204, headers });
      return;
    }
    const input = JSON.parse(req.postData()).data;
    const data = req.url().endsWith('/askBrewer')
      ? { turn: await page.evaluate((input) => window.__brewerTransportFixture(input), input) }
      : { turns: [] };
    await req.respond({ status: 200, headers, body: JSON.stringify({ data }) });
  });
  for (const width of [390, 320]) {
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://127.0.0.1:3007/?preview=brew&view=brassage', {
      waitUntil: 'networkidle0'
    });
    await page.waitForSelector('.brewer-chat-launch');
    await page.screenshot({ path: resolve(out, `launch-${width}.png`) });
    await page.evaluate(async () => {
      const { BrewerChat } = await import('/src/services/brewerChat.ts');
      BrewerChat.userKey = async () => 'visual-fixture';
      BrewerChat.history = async () => [];
      BrewerChat.ask = async (input) => ({
        id: 'visual-fixture',
        operationId: input.operationId,
        question: input.question,
        model: 'Gemini · scénario de contrôle',
        createdAt: Date.now(),
        contextLabel: 'Cuve de contrôle · Saccharification',
        reviewed: true,
        advice: {
          level: 'attention',
          summary: 'À1000W, la chauffe peut être nettement plus lente.',
          action:
            'Pour28L de67 à80°C, compte au moins25,4min sans pertes. Homogénéise et mesure la température réelle avant de démarrer le maintien.',
          why: 'Ce minimum ne compte ni la cuve ni les déperditions. La durée réelle sera plus longue ; la consigne peut même rester hors d’atteinte.',
          watch: 'Relève la température dans5 à10min pour mesurer la progression.',
          question: 'Le palier de saccharification est-il terminé ?',
          evidenceIds: ['E1']
        },
        evidence: [
          {
            id: 'E1',
            name: 'heating_power',
            label: 'Chauffe · minimum théorique',
            facts: ['28L · 67→80°C · 1000W', '25,4min au minimum'],
            limits: ['Eau seule, aucune perte : cette valeur n’est pas une heure d’arrivée.'],
            data: {}
          }
        ]
      });
      window.__brewerTransportFixture = BrewerChat.ask;
    });
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-chat-welcome');
    await page.waitForFunction(
      () =>
        document.querySelector('.brewer-chat-compose').getBoundingClientRect().bottom <= innerHeight
    );
    await page.screenshot({ path: resolve(out, `welcome-${width}.png`) });
    await page.type('.brewer-chat-compose textarea', 'Ma chauffe est bloquée à1000W, que faire ?');
    await page.waitForFunction(
      () => !document.querySelector('.brewer-chat-compose button[type=submit]').disabled
    );
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForSelector('.brewer-chat-answer').catch(async (error) => {
      console.log(
        await page.evaluate(() => document.querySelector('.brewer-chat-sheet')?.innerText)
      );
      await page.screenshot({ path: resolve(out, 'failure.png') });
      throw error;
    });
    await page.screenshot({ path: resolve(out, `answer-${width}.png`) });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      body: document.documentElement.scrollWidth,
      dialog: document.querySelector('.brewer-chat-sheet').getBoundingClientRect().width,
      textarea: document.querySelector('.brewer-chat-compose textarea').getBoundingClientRect()
        .width,
      button: document
        .querySelector('.brewer-chat-compose button[type=submit]')
        .getBoundingClientRect().height
    }));
    assert.ok(dimensions.body <= width + 1);
    assert.ok(dimensions.dialog <= width + 1);
    assert.ok(dimensions.button >= 44);
    assert.ok(dimensions.textarea >= 190);
    await page.click('.brewer-chat-proof summary');
    await page.screenshot({ path: resolve(out, `evidence-${width}.png`) });
    await page.setViewport({ width, height: 480, isMobile: true, hasTouch: true });
    await page.screenshot({ path: resolve(out, `compact-${width}.png`) });
    const compose = await page.$eval('.brewer-chat-compose', (e) => ({
      bottom: e.getBoundingClientRect().bottom,
      top: e.getBoundingClientRect().top
    }));
    assert.ok(compose.bottom <= 480 && compose.top >= 0);
    report.push(dimensions);
  }
  for (const view of ['recette', 'assistant']) {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`http://127.0.0.1:3007/?preview=brew&view=${view}`, {
      waitUntil: 'networkidle0'
    });
    await page.waitForSelector('.brewer-chat-launch');
    await page.evaluate(async () => {
      const { BrewerChat } = await import('/src/services/brewerChat.ts');
      BrewerChat.history = async () => [];
      BrewerChat.userKey = async () => 'visual-fixture';
    });
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-chat-welcome');
    await page.waitForFunction(
      () =>
        document.querySelector('.brewer-chat-compose').getBoundingClientRect().bottom <= innerHeight
    );
    await page.screenshot({ path: resolve(out, `${view}-390.png`) });
    await page.click('.brewer-chat-sheet button[aria-label="Fermer"]');
    await page.waitForFunction(() => !document.querySelector('.brewer-chat-sheet'));
  }
  await page.evaluate(async () => {
    const { mountBatchProbe } = await import('/scripts/fixtures/brewerSheetProbe.tsx');
    mountBatchProbe();
  });
  await page.waitForSelector('.brewer-chat-launch');
  await page.evaluate(() =>
    [...document.querySelectorAll('.brewer-chat-launch')]
      .find((e) => e.getBoundingClientRect().width > 0)
      .click()
  );
  await page.waitForSelector('.brewer-chat-welcome');
  await page.waitForFunction(
    () =>
      document.querySelector('.brewer-chat-compose').getBoundingClientRect().bottom <= innerHeight
  );
  await page.screenshot({ path: resolve(out, 'fermentation-sheet-390.png') });
  await page.click('.brewer-chat-sheet button[aria-label="Fermer"]');
  await page.waitForFunction(() => !document.querySelector('.brewer-chat-sheet'));
  assert.equal(
    await page.$eval('[role=dialog]', (e) => e.textContent.includes('Fermentation de contrôle')),
    true
  );
  assert.equal(await page.$('[data-closed=true]'), null);
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(out, 'report.json'),
    JSON.stringify({ report, errors, transport: 'synthetic' }, null, 2)
  );
  console.log({ report, errors });
} finally {
  await browser.close();
}
