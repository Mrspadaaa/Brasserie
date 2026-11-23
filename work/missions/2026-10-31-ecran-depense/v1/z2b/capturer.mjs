// z2b : captures des 9 états (11 écrans : 4a/4b, 7a/7b) à 390 × 844 et à 1280 × 800, puis le repos (etat 3) en « haut ».
// Usage : node work/missions/2026-10-31-ecran-depense/v1/z2b/capturer.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const page = path.join(ici, 'etat.html');
const url = `file:///${page.split(path.sep).join('/')}`;
const ETATS = ['1', '2', '3', '4a', '4b', '5', '6', '7a', '7b', '8', '9'];

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const erreurs = [];
try {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(e.message));
  for (const [w, h, suffixe, mobile] of [[390, 844, '390', true], [1280, 800, '1280', false]]) {
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    for (const e of ETATS) {
      await p.goto(`${url}?etat=${e}`, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, e === '7a' || e === '4a' ? 300 : 120));
      await p.screenshot({ path: path.join(ici, `z2b-etat${e}-${suffixe}.png`) });
    }
    await p.goto(url, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ici, `z2b-haut-${suffixe}.png`) });
    if (mobile) {
      await p.evaluate(() => { document.querySelector('#z2b-l1 [data-ouvre]').click(); });
      await new Promise((r) => setTimeout(r, 120));
      await p.screenshot({ path: path.join(ici, 'z2b-plateau-390.png') });
      await p.goto(url, { waitUntil: 'networkidle0' });
      await p.evaluate(() => { document.getElementById('z2b-tampon').click(); });
      await new Promise((r) => setTimeout(r, 120));
      await p.screenshot({ path: path.join(ici, 'z2b-preuve-390.png') });
      await p.goto(url, { waitUntil: 'networkidle0' });
      await p.evaluate(() => { document.querySelector('.z2b-pt[data-k="mout"]').click(); });
      await new Promise((r) => setTimeout(r, 700));
      await p.screenshot({ path: path.join(ici, 'z2b-moutures-390.png') });
    }
  }
} finally { await nav.close(); }
console.log(erreurs.length ? `CAPTURES ECHEC : ${erreurs.join(' | ')}` : `CAPTURES OK (${ETATS.length} états × 2 largeurs + haut + plateau + preuve + moutures)`);
process.exitCode = erreurs.length ? 1 : 0;
