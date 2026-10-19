// Sonde (19.10) : un seul geste va-t-il de l'extrême haut du rail à l'extrême bas, et retour ?
// « On arrive pas à aller de l'extrême haut, à l'extrême bas » (au téléphone, dans la page partagée :
// la page jouable y a environ 390 × 620 px). Pour chaque hauteur d'écran et chaque défilement, le
// premier houblon est glissé jusqu'au bas de l'écran, le dernier jusqu'en haut ; on lit le moment atteint.
// Usage : node sonde-extremes.mjs <page.html> [hauteur…]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const f = path.resolve(process.argv[2]);
const hauteurs = process.argv.slice(3).map(Number).filter(Boolean);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lignes = (q) => q.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => {
  const h = l.querySelector('[data-role="glisser-moment"]');
  const r = h.getBoundingClientRect();
  return { k: l.querySelector('[data-houblon]')?.getAttribute('data-houblon'), x: r.left + r.width / 2, y: r.top + r.height / 2, quand: l.querySelector('[data-role="quand"]').innerText.trim() };
}));
for (const H of hauteurs.length ? hauteurs : [620, 844]) {
  for (const defile of ['haut', 'bas']) {
    for (const sens of ['descendre', 'monter']) {
      const q = await browser.newPage();
      await q.setViewport({ width: 390, height: H, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await q.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' });
      await wait(300);
      // « bas » : la page défilée pour que le dernier houblon soit en bas de l'écran.
      if (defile === 'bas') await q.evaluate(() => { const ls = [...document.querySelectorAll('[data-role="ligne-houblon"]')]; ls[ls.length - 1].scrollIntoView({ block: 'end' }); scrollBy(0, 40); });
      await wait(200);
      const ls = await lignes(q);
      const l = sens === 'descendre' ? ls[0] : ls[ls.length - 1];
      if (!l || l.y < 0 || l.y > H) { console.log(H, defile, sens, 'houblon hors écran', l && Math.round(l.y)); await q.close(); continue; }
      const t = await q.touchscreen.touchStart(l.x, l.y);
      let y = l.y;
      await t.move(l.x, y + 3); await wait(200);
      const fin = sens === 'descendre' ? H - 4 : 4;
      while (Math.abs(fin - y) > 0.5) { y += Math.sign(fin - y) * Math.min(6, Math.abs(fin - y)); await t.move(l.x, y); await wait(20); }
      await wait(300);
      const m = await q.evaluate(() => {
        const g = document.querySelector('[data-glisse] [data-role="quand"]');
        const tete = document.querySelector('[data-rang="T-ebu"]')?.getBoundingClientRect();
        const axe = document.querySelector('.axe')?.getBoundingClientRect();
        const fr = document.querySelector('.frise').getBoundingClientRect();
        return { quand: g ? g.innerText.trim() : null, tete: tete && Math.round(tete.top), axe: axe && [Math.round(axe.top), Math.round(axe.bottom)], frise: [Math.round(fr.top), Math.round(fr.bottom)], sc: Math.round(scrollY) };
      });
      await t.end(); await wait(400);
      console.log('H' + H, 'défilé ' + defile, sens, l.k, l.quand, '→', m.quand, 'axe', m.axe, 'frise', m.frise, 'tête', m.tete, 'scroll', m.sc);
      await q.close();
    }
  }
}
await browser.close();
