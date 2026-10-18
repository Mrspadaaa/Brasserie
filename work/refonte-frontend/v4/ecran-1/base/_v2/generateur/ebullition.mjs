// Durée d'ébullition réglée sur l'étape : 200′ puis 45′ (captures dans base/captures).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(BASE, 'consolide', 'index.html')).href, { waitUntil: 'networkidle0' });
const lire = () => p.$eval('[data-role="ebullition"]', (e) => Number(e.dataset.minutes));
for (const cible of [200, 45]) {
  while ((await lire()) !== cible) { await (await p.$('[data-action="' + ((await lire()) < cible ? 'ebullition-plus' : 'ebullition-moins') + '"]')).tap(); }
  await new Promise((r) => setTimeout(r, 300));
  const m = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, tete: document.querySelector('.marque.ebu')?.dataset.etape, ligne: document.querySelector('[data-role="ligne-houblon"]').innerText.replace(/\s+/g, ' '), ibu: document.querySelector('#ibu').textContent }));
  console.log(cible, JSON.stringify(m));
  await p.screenshot({ path: path.join(BASE, 'captures', 'consolide-ebullition-' + cible + '.png') });
}
await b.close();
