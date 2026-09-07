// Real UI + recovery transport, deterministic supplier fixtures. Live availability is evaluated separately.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const out = resolve('.codex-remote-attachments/brewer-shopping-mobile');
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
      requests = [];
    let checks = 0,
      latest;
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      if (!/\/(askBrewer|getBrewerConversation)$/.test(req.url())) return req.continue();
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
        requests.push(data);
        latest = data;
        result = {
          pending: {
            operationId: requests.length === 1 ? 'previous-operation-123456' : data.operationId,
            question: data.question,
            until: Date.now() + 30000
          }
        };
      } else if (!data.operationId) result = { turns: [] };
      else if (++checks === 1)
        result = {
          pending: {
            operationId: 'previous-operation-123456',
            question: 'Question précédente',
            until: Date.now() + 30000
          }
        };
      else if (checks === 2) result = {};
      else
        result = {
          turn: {
            id: 'fixture-turn',
            operationId: latest.operationId,
            question: latest.question,
            mode: latest.mode,
            model: latest.mode === 'deep' ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash',
            reviewModel: latest.mode === 'deep' ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash',
            reviewReason: latest.mode === 'deep' ? 'requested' : 'fast',
            reviewed: true,
            createdAt: Date.now(),
            contextLabel: 'Stout de contrôle · Recette',
            advice: {
              level: 'info',
              summary: 'Deux pistes pour conserver le caractère de ta stout.',
              action:
                'Cherche de l’orge torréfiée pour la Röstgerste et du malt Pale Ale pour remplacer le Maris Otter.',
              why: 'Le Pale Ale conserve le rôle de malt de base, avec un profil différent. La couleur seule ne garantit pas le même goût.',
              watch: 'Vérifie le conditionnement et le concassage avant de commander.',
              question: '',
              evidenceIds: ['E1']
            },
            evidence: [
              {
                id: 'E1',
                name: 'find_brewing_suppliers',
                label: 'Fournisseurs suisses',
                facts: ['Disponibilité de contrôle simulée pour cette capture.'],
                limits: ['Les contrôles serveur réels sont séparés.'],
                data: {},
                products: [
                  {
                    name: 'Röstgerste, Kg',
                    supplier: 'Brau- und Rauchshop',
                    url: 'https://www.brauundrauchshop.ch/r%C3%B6stgerste',
                    availability: 'in_stock',
                    availabilityText: 'En stock',
                    checkedAt: Date.now()
                  },
                  {
                    name: 'Pale Ale – EBC 5.5–7.5 (100gr)',
                    supplier: 'Brewstore Suisse',
                    url: 'https://brewstore.ch/ingredients-de-brassage-fr/pale-ale-ebc-5.5-7.5-100gr-fr/',
                    availability: 'in_stock',
                    availabilityText: 'En stock',
                    checkedAt: Date.now()
                  },
                  {
                    name: '1kg, Röstgerste, EBC 1100–1200',
                    supplier: 'Sevibräu',
                    url: 'https://www.bierbrauzubehoer.ch/produktkategorien/braumalz-flocken-malzextrakt/roestmalze/250/1kg-roestgerste-ebc-1100-1200',
                    availability: 'unknown',
                    availabilityText: 'Stock non confirmé',
                    checkedAt: Date.now()
                  }
                ]
              }
            ]
          }
        };
      await req.respond({ status: 200, headers, body: JSON.stringify({ data: result }) });
    });
    await page.goto('http://127.0.0.1:3007/?preview=brew&view=brassage', {
      waitUntil: 'networkidle0'
    });
    await page.waitForSelector('.brewer-chat-launch');
    await page.click('.brewer-chat-launch');
    await page.waitForSelector('.brewer-chat-welcome');
    if (width === 390) await page.click('.brewer-chat-mode label');
    await page.screenshot({ path: resolve(out, `mode-${width}.png`) });
    await page.type(
      '.brewer-chat-compose textarea',
      'Plus en stock chez mon fournisseur, une alternative ?'
    );
    await page.click('.brewer-chat-compose button[type=submit]');
    await page.waitForFunction(() =>
      document.querySelector('.brewer-chat-status')?.textContent.includes('précédente')
    );
    await page.screenshot({ path: resolve(out, `waiting-${width}.png`) });
    await page.waitForSelector('.brewer-chat-product');
    assert.equal(requests.length, 2);
    assert.equal(requests[0].operationId, requests[1].operationId);
    assert.equal(requests[1].mode, width === 390 ? 'deep' : 'auto');
    await page.$eval('.brewer-chat-suppliers', (e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: resolve(out, `shopping-${width}.png`) });
    const measure = () =>
      page.evaluate(() => ({
        width: innerWidth,
        body: document.documentElement.scrollWidth,
        sheet: document.querySelector('.brewer-chat-sheet').scrollWidth,
        composerBottom: document.querySelector('.brewer-chat-compose').getBoundingClientRect()
          .bottom,
        height: innerHeight,
        modeHeight: document.querySelector('.brewer-chat-mode label').getBoundingClientRect()
          .height,
        links: [...document.querySelectorAll('.brewer-chat-product')].map(
          (e) => e.getBoundingClientRect().height
        ),
        error: document.querySelector('.brewer-chat-error')?.textContent
      }));
    let dimensions = await measure();
    assert.ok(dimensions.body <= width + 1 && dimensions.sheet <= width + 1);
    assert.ok(dimensions.modeHeight >= 44);
    assert.ok(dimensions.links.every((h) => h >= 44));
    assert.ok(!dimensions.error);
    report.push({ width, recovery: true, ...dimensions });
    await page.setViewport({ width, height: 480, isMobile: true, hasTouch: true });
    await page.screenshot({ path: resolve(out, `compact-${width}.png`) });
    dimensions = await measure();
    assert.ok(dimensions.composerBottom <= dimensions.height + 1);
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(report);
} finally {
  await browser.close();
}
