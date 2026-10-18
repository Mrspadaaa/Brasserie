// Glissement 60′ → 10′ au doigt sur l'étape consolidée : capture avant, pendant, après.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const OUT = path.join(BASE, 'captures');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(BASE, 'consolide', 'index.html')).href, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
const pos = await p.evaluate(() => {
  const c = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  return { poignee: c(document.querySelector('[data-role="ligne-houblon"] [data-role="glisser-moment"]')), cible: c(document.querySelector('[data-etape="b10"]')) };
});
const ligne = () => p.$eval('[data-role="ligne-houblon"]', (e) => e.innerText.replace(/\s+/g, ' '));
console.log('avant :', await ligne());
await p.screenshot({ path: path.join(OUT, 'consolide-glisser-1-avant.png') });
const t = await p.touchscreen.touchStart(pos.poignee.x, pos.poignee.y);
const pas = 14;
for (let i = 1; i <= pas; i++) { await t.move(pos.poignee.x, pos.poignee.y + ((pos.cible.y - pos.poignee.y) * i) / pas); await new Promise((r) => setTimeout(r, 30)); }
await new Promise((r) => setTimeout(r, 150));
console.log('pendant :', await ligne(), '| étape éclairée :', await p.$$eval('.survol', (e) => e.map((x) => x.dataset.etape).join(',')));
await p.screenshot({ path: path.join(OUT, 'consolide-glisser-2-pendant.png') });
await t.end();
await new Promise((r) => setTimeout(r, 500));
console.log('après :', await p.$$eval('[data-role="ligne-houblon"]', (els) => els.map((e) => e.closest('ul').getAttribute('aria-label') + ' → ' + e.innerText.replace(/\s+/g, ' ')).join(' || ')));
await p.screenshot({ path: path.join(OUT, 'consolide-glisser-3-apres.png') });
await b.close();
