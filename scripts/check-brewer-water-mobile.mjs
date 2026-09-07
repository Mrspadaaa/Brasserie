// Local UI and compiled server proposal logic. All callable requests intercepted; no Gemini cost.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prepareProposal, applyProposal } from '../functions/lib/brewerProposals.js';
const out = resolve('.codex-remote-attachments/brewer-water-mobile');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const report = [],
  errors = [];
try {
  for (const width of [320, 390]) {
    const page = await browser.newPage(),
      asks = [],
      applies = [],
      turns = [];
    let context, prepared, expected;
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      if (
        !/\/(askBrewer|getBrewerConversation|applyBrewerProposal|getBrewerActivity|markBrewerRead)$/.test(
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
      try {
        if (req.url().endsWith('/getBrewerActivity')) result = { jobs: [] };
        else if (req.url().endsWith('/markBrewerRead')) result = { ok: true };
        else if (req.url().endsWith('/askBrewer')) {
          asks.push(data);
          if (asks.length === 1) {
            context = {
              recipe: data.draft,
              inventory: [],
              material: [],
              waterSources: [data.draft.waterPlan.sourceSnapshot],
              editableTargets: ['recipe'],
              provenance: [],
              now: Date.now(),
              phase: 'Recette'
            };
            prepared = prepareProposal(context, {
              target: 'recipe',
              title: 'Brasser avec 10 L d’osmosée',
              changes: [
                {
                  path: 'waterPlan.roLimitL',
                  valueJson: '10',
                  reason: 'Deux packs disponibles, empâtage et rinçage réunis.'
                }
              ]
            });
            expected = applyProposal(
              context,
              prepared,
              prepared.changes.map((ch) => ch.id)
            );
          }
          const turn = {
            id: `test-${asks.length}`,
            operationId: data.operationId,
            question: data.question,
            createdAt: Date.now(),
            reviewed: true,
            model: 'gemini-3.8-flash',
            reviewModel: 'gemini-3.8-flash',
            reviewReason: 'fast',
            evidence: [],
            contextLabel: 'Recette de contrôle',
            advice: {
              level: 'info',
              summary:
                asks.length === 1
                  ? 'Le plan tient dans tes deux packs d’osmosée.'
                  : 'Le brouillon est à jour.',
              action: 'Valide l’eau et son traitement ensemble.',
              why: 'Le réseau complète le volume prévu ; les sels et l’acide suivent la nouvelle coupe.',
              watch: 'Contrôle le pH sur un échantillon refroidi.',
              question: '',
              evidenceIds: []
            },
            ...(asks.length === 1 ? { proposal: prepared } : {})
          };
          turns.push(turn);
          result = { turn };
        } else if (req.url().endsWith('/applyBrewerProposal')) {
          applies.push(data);
          const value = applyProposal(
            { ...context, recipe: data.draft },
            prepared,
            data.selectedIds
          );
          result = {
            value,
            turn: {
              ...turns[0],
              proposal: { ...prepared, status: 'applied', acceptedIds: data.selectedIds }
            }
          };
        } else result = { turns, generation: 0 };
        return req.respond({ status: 200, headers, body: JSON.stringify({ data: result }) });
      } catch (e) {
        errors.push(e.message);
        return req.respond({
          status: 400,
          headers,
          body: JSON.stringify({ error: { status: 'FAILED_PRECONDITION', message: e.message } })
        });
      }
    });
    await page.goto('http://127.0.0.1:3007/?preview=brew&view=assistant', {
      waitUntil: 'networkidle0'
    });
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-chat-welcome');
    await page.type(
      '.brewer-chat-compose textarea',
      'Je n’ai que 10 L d’eau osmosée, adapte la recette.'
    );
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForSelector('.brewer-proposal');
    assert.equal(applies.length, 0);
    const boxes = await page.$$('.brewer-proposal-change input');
    await boxes[0].click();
    assert.equal(await page.$$eval('.brewer-proposal-change input:checked', (es) => es.length), 0);
    await boxes[0].click();
    await page.$eval('.brewer-proposal', (e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(out, `proposal-${width}.png`) });
    const bounds = await page.evaluate(() => ({
      body: document.documentElement.scrollWidth,
      sheet: document.querySelector('.brewer-chat-sheet').scrollWidth,
      labels: [...document.querySelectorAll('.brewer-proposal-change label')].map(
        (e) => e.getBoundingClientRect().height
      )
    }));
    assert.ok(bounds.body <= width + 1 && bounds.sheet <= width + 1);
    assert.ok(bounds.labels.every((h) => h >= 44));
    await page.click('.brewer-proposal-actions button:last-child');
    await page.waitForSelector('.brewer-proposal.is-decided');
    await page.type('.brewer-chat-compose textarea', 'Vérifie les champs appliqués.');
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForFunction(() => document.querySelectorAll('.brewer-chat-turn').length === 2);
    assert.equal(asks[1].draft.waterPlan.roLimitL, 10);
    assert.deepEqual(asks[1].draft.waterPlan.mash, expected.waterPlan.mash);
    assert.deepEqual(asks[1].draft.waterPlan.acid, expected.waterPlan.acid);
    assert.deepEqual(asks[1].draft.waterPlan.wortIons, expected.waterPlan.wortIons);
    assert.equal(asks[1].draft.waterPlan.saltOverrides ?? undefined, undefined);
    await page.click('.brewer-chat-sheet button[aria-label="Fermer"]');
    await page.waitForSelector('.brewer-chat-sheet', { hidden: true });
    await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .find((e) => e.textContent.trim() === 'Eau et sels')
        .click()
    );
    await page.evaluate(() => {
      const summary = [...document.querySelectorAll('summary')].find((e) =>
        e.textContent.includes('10 L disponibles')
      );
      summary.click();
      summary.scrollIntoView({ block: 'start' });
    });
    await page.screenshot({ path: resolve(out, `water-${width}.png`) });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    report.push({
      width,
      proposalFields: prepared.changes.map((ch) => ch.path),
      approvedTogether: true,
      matchesServerCalculation: true,
      ...bounds
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(report);
} finally {
  await browser.close();
}
