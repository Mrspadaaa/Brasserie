// Glissement au doigt sur l'étape consolidée, capturé avant, pendant et après :
// 60′ d'ébullition (index.html, Nugget de 60′ vers 45′) et 120′ (cas-ebu120.html, de 60′ vers 90′).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const OUT = path.join(BASE, 'captures');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [page, cible, nom] of [['index', 'b45', 'consolide-glisser-60'], ['cas-ebu120', 'b90', 'consolide-glisser-120']]) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(BASE, 'consolide', page + '.html')).href, { waitUntil: 'networkidle0' });
  await pause(300);
  const pos = await p.evaluate((cible) => {
    const c = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const poignee = c(document.querySelector('[data-role="ligne-houblon"] [data-role="glisser-moment"]'));
    const depart = c(document.querySelector('.marque[data-etape="b60"]'));
    const visee = c(document.querySelector('.marque[data-etape="' + cible + '"]'));
    // Le doigt se déplace de l'écart entre le repère de départ et le repère visé.
    return { x: poignee.x, y0: poignee.y, y1: poignee.y + (visee.y - depart.y) };
  }, cible);
  const ligne = () => p.$eval('[data-role="ligne-houblon"]', (e) => e.innerText.replace(/\s+/g, ' '));
  console.log(page, 'avant :', await ligne());
  await p.screenshot({ path: path.join(OUT, nom + '-1-avant.png') });
  const t = await p.touchscreen.touchStart(pos.x, pos.y0);
  for (let i = 1; i <= 16; i++) { await t.move(pos.x, pos.y0 + ((pos.y1 - pos.y0) * i) / 16); await pause(30); }
  await pause(150);
  console.log(page, 'pendant :', await ligne(), '| data-glisse :', !!(await p.$('[data-glisse]')));
  await p.screenshot({ path: path.join(OUT, nom + '-2-pendant.png') });
  await t.end();
  await pause(500);
  console.log(page, 'après :', await ligne(), '| IBU total :', await p.$eval('#ibu', (e) => e.textContent));
  await p.screenshot({ path: path.join(OUT, nom + '-3-apres.png') });
  await p.close();
}
await b.close();
