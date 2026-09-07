// Actual mobile UI with a deterministic server simulation, no production writes or notifications.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve('.codex-remote-attachments/brewer-jobs-mobile');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--mute-audio']
});
const results = [],
  errors = [];
try {
  for (const width of [390, 320]) {
    const page = await browser.newPage(),
      jobs = [],
      turns = [],
      inputs = [];
    const budget = {
      paused: false,
      day: '2026-09-07',
      usage: { calls: 4, proCalls: 1, tokens: 4200 },
      limits: {
        dailyCalls: 120,
        dailyProCalls: 40,
        dailyTokens: 1500000,
        questionCalls: 12,
        questionTokens: 240000
      }
    };
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      const endpoint =
        /\/(askBrewer|getBrewerConversation|getBrewerActivity|markBrewerRead|getBrewerAiBudget|setBrewerAiBudget)$/.exec(
          req.url()
        )?.[1];
      if (!endpoint) return req.continue();
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
      if (endpoint === 'getBrewerAiBudget') result = budget;
      else if (endpoint === 'setBrewerAiBudget') {
        if (data.paused != null) budget.paused = data.paused;
        Object.assign(budget.limits, data.limits);
        result = budget;
      } else if (endpoint === 'askBrewer') {
        inputs.push(data);
        const job = {
          id: String(inputs.length).repeat(64),
          operationId: data.operationId,
          scope: data.scope,
          generation: 0,
          question: data.question,
          label: data.draft.name,
          status: inputs.length === 1 ? 'running' : 'queued',
          stage: inputs.length === 1 ? 'research' : 'queued',
          detail:
            inputs.length === 1 ? 'Recherche d’alternatives chez les fournisseurs suisses' : '',
          model: inputs.length === 1 ? 'gemini-3.1-pro-preview' : '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          attempt: inputs.length === 1 ? 1 : 0
        };
        jobs.push(job);
        result = { job };
      } else if (endpoint === 'getBrewerActivity') result = { jobs };
      else if (endpoint === 'markBrewerRead') {
        const job = jobs.find((j) => j.id === data.jobId);
        if (job) job.readAt = Date.now();
        result = { ok: true };
      } else if (data.operationId)
        result = turns.find((t) => t.operationId === data.operationId)
          ? { turn: turns.find((t) => t.operationId === data.operationId) }
          : { job: jobs.find((j) => j.operationId === data.operationId) };
      else
        result = { turns, generation: 0, ...(inputs[0]?.draft ? { draft: inputs[0].draft } : {}) };
      await req.respond({ status: 200, headers, body: JSON.stringify({ data: result }) });
    });
    await page.goto('http://127.0.0.1:3007/?preview=brew&view=assistant', {
      waitUntil: 'networkidle0'
    });
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-chat-welcome');
    await page.click('.brewer-budget > summary');
    await page.waitForSelector('.brewer-budget .is-stop');
    await page.screenshot({ path: resolve(out, `budget-${width}.png`) });
    await page.click('.brewer-budget .is-stop');
    await page.waitForSelector('.brewer-budget .is-resume');
    assert.equal(budget.paused, true);
    await page.click('.brewer-budget .is-resume');
    await page.waitForSelector('.brewer-budget .is-stop');
    assert.equal(budget.paused, false);
    await page.click('.brewer-budget > summary');
    await page.click('.brewer-chat-mode input[value="fast"]');
    assert.equal(await page.$eval('.brewer-chat-mode input[value="fast"]', (e) => e.checked), true);
    await page.type(
      '.brewer-chat-compose textarea',
      'Trouve-moi un nom et des ajustements pour cette bière.'
    );
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForFunction(() =>
      document.querySelector('.brewer-work-card')?.textContent.includes('Gemini 3.1 Pro')
    );
    assert.equal(await page.$eval('.brewer-chat-compose textarea', (e) => e.value), '');
    assert.equal(await page.$eval('.brewer-chat-compose textarea', (e) => e.readOnly), false);
    await page.type('.brewer-chat-compose textarea', 'Et un nom plus amusant ?');
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForFunction(
      () => document.querySelectorAll('.brewer-chat-question').length === 2
    );
    await page.screenshot({ path: resolve(out, `queued-${width}.png`) });
    assert.equal(inputs.length, 2);
    assert.equal(inputs[0].mode, 'fast');
    assert.equal(inputs[1].mode, 'fast');
    await page.click('.brewer-chat-sheet button[aria-label="Fermer"]');
    await page.waitForSelector('.brewer-activity-pill', { visible: true });
    const visiblePill = await page.$eval('.brewer-activity-pill', (el) => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + 10, r.y + 10));
    });
    assert.equal(visiblePill, true, 'The global status must be above full-screen recipe pages');
    // Response completes while the chat is closed. The partial composer text must stay untouched.
    jobs[0].status = 'done';
    jobs[0].finishedAt = Date.now();
    turns.push({
      id: jobs[0].id,
      operationId: jobs[0].operationId,
      question: jobs[0].question,
      createdAt: Date.now(),
      model: 'gemini-3.1-pro-preview',
      reviewed: true,
      contextLabel: 'Recette de contrôle',
      evidence: [],
      advice: {
        level: 'info',
        summary: 'Appelle-la La Mousse Vagabonde.',
        action: 'Vérifie les champs avant de les modifier.',
        why: 'Une proposition pour ta prochaine bière.',
        watch: '',
        question: '',
        evidenceIds: []
      }
    });
    await page.waitForFunction(() =>
      document.querySelector('.brewer-activity-pill')?.textContent.includes('réponse prête')
    );
    await page.screenshot({ path: resolve(out, `notification-${width}.png`) });
    await page.click('.brewer-activity-pill');
    await page.waitForSelector('.brewer-activity-list button');
    await page.$$eval('.brewer-activity-list button', (buttons) =>
      buttons.find((b) => b.textContent.includes('Trouve-moi'))?.click()
    );
    await page.waitForSelector('.brewer-chat-answer');
    assert.ok(
      await page.$eval('.brewer-chat-answer', (e) => e.textContent.includes('La Mousse Vagabonde'))
    );
    jobs[1].status = 'error';
    jobs[1].error = {
      code: 'review-rejected',
      message: 'La réponse a été écartée à la relecture. Aucun champ n’a changé.',
      retryable: true
    };
    jobs[1].finishedAt = Date.now();
    await page.waitForSelector('.brewer-work-card.is-error');
    await page.$eval('.brewer-work-card.is-error', (e) => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: resolve(out, `error-${width}.png`) });
    assert.equal(await page.$eval('.brewer-chat-compose textarea', (e) => e.value), '');
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      page: document.documentElement.scrollWidth,
      sheet: document.querySelector('.brewer-chat-sheet').scrollWidth,
      actions: [...document.querySelectorAll('.brewer-work-actions button')].map(
        (e) => e.getBoundingClientRect().height
      ),
      modes: [...document.querySelectorAll('.brewer-chat-mode label')].map(
        (e) => e.getBoundingClientRect().height
      )
    }));
    assert.ok(dimensions.page <= width + 1 && dimensions.sheet <= width + 1);
    assert.ok(dimensions.actions.every((h) => h >= 44));
    assert.ok(dimensions.modes.every((h) => h >= 44));
    await page.reload({ waitUntil: 'networkidle0' });
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-work-card.is-error');
    assert.equal(await page.$eval('.brewer-chat-mode input[value="fast"]', (e) => e.checked), true);
    assert.equal(inputs.length, 2, 'Reload must not resend acknowledged questions');
    await page.setViewport({ width, height: 480, isMobile: true, hasTouch: true });
    await page.screenshot({ path: resolve(out, `compact-${width}.png`) });
    assert.ok(
      await page.$eval(
        '.brewer-chat-compose',
        (e) => e.getBoundingClientRect().bottom <= innerHeight + 1
      )
    );
    results.push({
      width,
      messages: inputs.length,
      backgroundReply: true,
      reloadRecovered: true,
      visibleGlobalStatus: true,
      ...dimensions
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
