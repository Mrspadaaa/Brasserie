// Captures de p2b (clair, cave) et mesures : débord de chaque fil, vide en bas de cadre, texte sous 12 px.
// Usage : node work/missions/2026-11-14-compagnon/voies/p2b/p2b/capture.mjs [dossier des rangées]
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, '../../../../../..');
const require = createRequire(join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const rangees = process.argv[2];
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
const err = [];
p.on('pageerror', (e) => err.push(e.message));
p.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) err.push('réseau ' + r.url()); });
await p.setViewport({ width: 1672, height: 1000, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(join(ICI, 'etat.html')).href, { waitUntil: 'load' });
for (const theme of ['clair', 'cave']) {
  await p.evaluate((t) => { if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, theme);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(ICI, `p2b-${theme}.png`), fullPage: true });
  if (rangees) {
    const boites = await p.evaluate(() => [...document.querySelectorAll('[data-cadre]')].map((e) => { const r = e.getBoundingClientRect(); return { c: e.dataset.cadre, x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }));
    const lignes = [...new Set(boites.map((x) => Math.round(x.y)))];
    let i = 0;
    for (const y of lignes) {
      const bx = boites.filter((x) => Math.round(x.y) === y);
      const x0 = Math.min(...bx.map((x) => x.x)), x1 = Math.max(...bx.map((x) => x.x + x.w));
      await p.screenshot({ path: join(rangees, `r${++i}-${theme}.png`), clip: { x: x0, y, width: x1 - x0, height: bx[0].h }, captureBeyondViewport: true });
    }
  }
}
const mes = await p.evaluate(() => {
  const out = [];
  for (const cadre of document.querySelectorAll('[data-cadre]')) {
    const fil = cadre.querySelector('.p2b-fil');
    const fe = cadre.querySelector('.p2b-feuille, .p2b-bur-pan');
    const deb = fil ? fil.scrollHeight - fil.clientHeight : 0;
    let vide = 0;
    if (fil) {
      const enf = [...fil.children].filter((e) => e.getBoundingClientRect().height > 0);
      const bas = Math.max(...enf.map((e) => e.getBoundingClientRect().bottom));
      vide = Math.round(fil.getBoundingClientRect().bottom - bas);
    }
    const petits = [...cadre.querySelectorAll('*')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.textContent.trim().slice(0, 20));
    const filH = fil ? fil.getBoundingClientRect().height : 0, feH = fe ? fe.getBoundingClientRect().height : 0;
    out.push(`${cadre.dataset.cadre}: débord ${deb} px · vide bas ${vide} px · fil ${Math.round(100 * filH / feH)} % · <12 px ${petits.length}${petits.length ? ' (' + petits.join(' | ') + ')' : ''}`);
  }
  return out;
});
console.log(mes.join('\n'));
console.log(err.length ? 'ERREURS\n' + err.join('\n') : 'sans erreur ni réseau');
await b.close();
