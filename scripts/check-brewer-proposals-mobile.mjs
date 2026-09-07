// Real recipe wizard + companion, intercepted callable API. Never touches production documents.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve('.codex-remote-attachments/brewer-proposals-mobile');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const report = [],
  errors = [];
try {
  for (const width of [390, 320]) {
    const page = await browser.newPage(),
      asks = [],
      applies = [],
      resets = [];
    let generation = 0,
      turns = [];
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      if (
        !/\/(askBrewer|getBrewerConversation|applyBrewerProposal|resetBrewerConversation)$/.test(
          req.url()
        )
      )
        return req.continue();
      const headers = {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3007',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          req.headers()['access-control-request-headers'] ?? 'content-type, authorization',
        'Content-Type': 'application/json'
      };
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
      const data = JSON.parse(req.postData()).data;
      let result;
      if (req.url().endsWith('/askBrewer')) {
        asks.push(data);
        const turn = {
          id: `fixture-${asks.length}`,
          operationId: data.operationId,
          question: data.question,
          createdAt: Date.now(),
          model: 'gemini-3.8-flash',
          reviewModel: 'gemini-3.8-flash',
          reviewReason: 'fast',
          reviewed: true,
          contextLabel: 'Recette de contrôle',
          evidence: [],
          advice: {
            level: 'info',
            summary:
              asks.length === 1
                ? 'Une ébullition de 70 minutes, à valider.'
                : 'Le brouillon est à jour.',
            action: 'Vérifie les champs proposés avant de valider.',
            why: 'Les valeurs restent celles du formulaire tant que tu ne valides pas.',
            watch: 'Confirme la durée et le nom.',
            question: '',
            evidenceIds: []
          },
          ...(asks.length === 1
            ? {
                proposal: {
                  target: 'recipe',
                  title: 'Ajuster la recette',
                  changes: [
                    {
                      id: 'C1',
                      path: 'boilMin',
                      label: 'Ébullition',
                      before: data.draft.boilMin,
                      value: 70,
                      unit: 'min',
                      reason: 'Durée choisie ensemble.'
                    },
                    {
                      id: 'C2',
                      path: 'name',
                      label: 'Nom de la recette',
                      before: data.draft.name,
                      value: 'NEIPA version 2',
                      reason: 'Nom facultatif pour distinguer la version.'
                    }
                  ]
                }
              }
            : {})
        };
        turns.push(turn);
        result = { turn };
      } else if (req.url().endsWith('/applyBrewerProposal')) {
        applies.push(data);
        const turn = turns.find((t) => t.id === data.turnId),
          value = structuredClone(data.draft);
        if (data.selectedIds.includes('C1')) value.boilMin = 70;
        if (data.selectedIds.includes('C2')) value.name = 'NEIPA version 2';
        result = {
          turn: {
            ...turn,
            proposal: {
              ...turn.proposal,
              status: data.decision === 'apply' ? 'applied' : 'dismissed',
              acceptedIds: data.selectedIds
            }
          },
          value
        };
      } else if (req.url().endsWith('/resetBrewerConversation')) {
        resets.push(data);
        generation++;
        turns = [];
        result = { generation };
      } else result = { turns, generation };
      await req.respond({ status: 200, headers, body: JSON.stringify({ data: result }) });
    });
    await page.goto('http://127.0.0.1:3007/?preview=brew&view=assistant', {
      waitUntil: 'networkidle0'
    });
    await page.waitForSelector('.brewer-chat-launch');
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-chat-welcome');
    await page.type('.brewer-chat-compose textarea', 'Prépare le passage à 70 minutes.');
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForSelector('.brewer-proposal');
    assert.equal(applies.length, 0);
    assert.equal(asks[0].draft.boilMin, 75);
    const checkboxes = await page.$$('.brewer-proposal-change input');
    await checkboxes[1].click();
    await page.$eval('.brewer-proposal', (e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(out, `proposal-${width}.png`) });
    const dimensions = await page.evaluate(() => ({
      body: document.documentElement.scrollWidth,
      sheet: document.querySelector('.brewer-chat-sheet').scrollWidth,
      checkHeights: [...document.querySelectorAll('.brewer-proposal-change label')].map(
        (e) => e.getBoundingClientRect().height
      ),
      buttonHeights: [...document.querySelectorAll('.brewer-proposal-actions button')].map(
        (e) => e.getBoundingClientRect().height
      )
    }));
    assert.ok(dimensions.body <= width + 1 && dimensions.sheet <= width + 1);
    assert.ok(dimensions.checkHeights.every((h) => h >= 44));
    assert.ok(dimensions.buttonHeights.every((h) => h >= 44));
    await page.click('.brewer-proposal-actions button:last-child');
    await page.waitForSelector('.brewer-proposal.is-decided');
    assert.deepEqual(applies[0].selectedIds, ['C1']);
    assert.equal(applies[0].confirmed, true);
    await page.type('.brewer-chat-compose textarea', 'Quel est le temps prévu ?');
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForFunction(() => document.querySelectorAll('.brewer-chat-turn').length === 2);
    assert.equal(asks[1].draft.boilMin, 70);
    assert.equal(asks[1].draft.name, asks[0].draft.name);
    await page.$eval('.brewer-chat-reset', (e) => e.scrollIntoView({ block: 'center' }));
    await page.click('.brewer-chat-reset');
    await page.screenshot({ path: resolve(out, `reset-${width}.png`) });
    assert.equal(resets.length, 0);
    await page.click('.brewer-reset-confirm button:first-child');
    assert.equal(resets.length, 0);
    await page.click('.brewer-chat-reset');
    await page.click('.brewer-reset-confirm button:last-child');
    await page.waitForSelector('.brewer-chat-welcome');
    assert.equal(resets.length, 1);
    assert.equal(await page.$eval('.brewer-chat-compose textarea', (e) => e.value), '');
    await page.screenshot({ path: resolve(out, `empty-${width}.png`) });
    await page.type('.brewer-chat-compose textarea', 'Une nouvelle question.');
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForSelector('.brewer-chat-turn');
    assert.equal(asks[2].generation, 1);
    assert.equal(asks[2].draft.boilMin, 70);
    await page.setViewport({ width, height: 480, isMobile: true, hasTouch: true });
    await page.screenshot({ path: resolve(out, `compact-${width}.png`) });
    assert.ok(
      await page.$eval(
        '.brewer-chat-compose',
        (e) => e.getBoundingClientRect().bottom <= innerHeight + 1
      )
    );
    report.push({
      width,
      approvalRequired: true,
      actualWizardBoilMin: asks[1].draft.boilMin,
      resetGeneration: asks[2].generation,
      ...dimensions
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(report);
} finally {
  await browser.close();
}
