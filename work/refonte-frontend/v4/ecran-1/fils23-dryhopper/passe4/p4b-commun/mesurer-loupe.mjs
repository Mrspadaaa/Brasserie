// Mesure, au DOM, l'intersection de la loupe avec la figure (conseil dh4, 24.10 : « la loupe à 0 px d'intersection
// avec la figure, à 20′, au whirlpool et à après · 7 j »). Usage : node mesurer-loupe.mjs p4b1 … ; écrit loupe-figure.json.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PASSE4, ici } from './socle-p4b.mjs';

const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const MOMENTS = ['b20', 'wp', 'dryPost|7'];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const out = {};
for (const id of ids) {
  out[id] = {};
  for (const m of MOMENTS) {
    const pg = await b.newPage();
    await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await pg.goto(pathToFileURL(path.join(PASSE4, id, 'etat.html')).href + '?moment=' + encodeURIComponent(m) + '&touche=1', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    const r = await pg.evaluate(() => {
      const l = document.querySelector('.p4r-loupe');
      if (!l || getComputedStyle(l).display === 'none') return { loupe: null };
      const L = l.getBoundingClientRect();
      const inter = (R) => Math.max(0, Math.min(L.right, R.right) - Math.max(L.left, R.left)) * Math.max(0, Math.min(L.bottom, R.bottom) - Math.max(L.top, R.top));
      // La figure de chaque variante : ses blocs de barres, son graphique, sa bande, son agenda (le bloc qui contient le rail de p4b2 n'est pas une figure : la loupe y est en flux, sous le rail).
      const SEL = { p4b1: '#p4b1-fig, .p4b1-strip', p4b2: '.p4b2-svg, .p4b2-seg, #p4b2-bars', p4b3: '#p4b3-fig, .p4b3-ag', p4b4: '#p4b4-fig', p4b5: '.p4b5-grille' }[document.body.className.split(' ')[0]];
      const figures = [...document.querySelectorAll(SEL)].map((e) => ({ nom: (e.id || e.className.baseVal || e.className).toString().slice(0, 40), px: Math.round(inter(e.getBoundingClientRect())) }));
      return { loupe: { top: Math.round(L.top), bottom: Math.round(L.bottom) }, figures, max: Math.max(...figures.map((f) => f.px)) };
    });
    out[id][m] = r;
    console.log(id + ' · ' + m + ' · ' + (r.loupe ? 'loupe ' + r.loupe.top + '–' + r.loupe.bottom + ' · intersection max ' + r.max + ' px² (' + r.figures.map((f) => f.nom.slice(0, 18) + ' ' + f.px).join(' ; ') + ')' : 'loupe absente'));
    await pg.close();
  }
}
await b.close();
fs.writeFileSync(path.join(ici, 'loupe-figure.json'), JSON.stringify(out, null, 1));
