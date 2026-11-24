import { ouvrir, sleep, photo, log, taper, boutons, APP } from './outil.mjs';
import { etat } from './lire.mjs';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
// onglet existant (lecture seule) : quel paquet sert-il ?
const b0 = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
for (const t of b0.targets().filter((t) => t.type() === 'page' && /brasserie-l-affinee/.test(t.url()))) { const p = await t.page(); log('onglet existant', t._targetId, await p.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s)))); }
b0.disconnect();
const { page, cdp, lacher } = await ouvrir();
const t0 = Date.now();
await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(2500);
log('paquet mon onglet', await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))), (Date.now() - t0) + ' ms');
await taper(page, cdp, 'Calendrier', 'nav button, nav a, [role=tab], button'); await sleep(3000);
await photo(page, 'E0-cal');
log('état', await etat(page));
log('boutons', await boutons(page));
lacher();
