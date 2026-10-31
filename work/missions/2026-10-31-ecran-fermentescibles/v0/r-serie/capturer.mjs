// Captures de la série r (r1..r4) : premier écran et page entière à 390, états #couleurs, #sucre, #vide, #huit,
// ordinateur 1280, et deux gestes joués (teinte « ? » → 3,5 EBC ; ajout au clavier : nom, Entrée, masse, Entrée).
// Mesure aussi la hauteur avec 8 grains (bas du pied / 844) et cherche les valeurs brutes.
// Usage : node capturer.mjs [r1 r2…]. Imprime une ligne par concept, puis CAPTURES OK ou CAPTURES ECHEC n.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const V0 = path.dirname(ICI);
const require = createRequire(path.resolve(V0, '../../../../package.json'));
const puppeteer = require('puppeteer-core');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['r1', 'r2', 'r3', 'r4'];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
let echecs = 0;
const pret = (p) => p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150))));
for (const id of ids) {
  const dir = path.join(V0, id);
  const url = 'file:///' + path.join(dir, 'etat.html').split(path.sep).join('/');
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const err = []; p.on('pageerror', (e) => err.push(e.message));
  const brut = async (nom) => { const t = await p.evaluate(() => document.body.innerText); if (/NaN|null|undefined|\[object/.test(t)) err.push(nom + ' : valeur brute'); };
  for (const h of ['', 'couleurs', 'sucre', 'vide', 'huit']) {
    await p.goto(url + (h ? '#' + h : '')); await pret(p);
    await p.screenshot({ path: path.join(dir, `${id}-${h || 'haut'}.png`) });
    await brut(h || 'repos');
  }
  const haut = await p.evaluate(() => { const e = document.querySelector('[data-commun="pied"]').getBoundingClientRect(); return (e.bottom + window.scrollY) / 844; });
  await p.goto(url); await pret(p);
  await p.screenshot({ path: path.join(dir, `${id}-page.png`), fullPage: true });
  // Geste 1 : la pastille « ? » du Pilsner, 3,5, Entrée.
  await p.click('[data-teinte="0"]'); await p.keyboard.type('3,5'); await p.keyboard.press('Enter'); await pret(p);
  const t1 = await p.evaluate(() => document.querySelector('[data-teinte="0"]')?.getAttribute('aria-label') || '');
  if (!/3,5 EBC/.test(t1)) err.push('teinte : ' + t1);
  await p.screenshot({ path: path.join(dir, `${id}-geste-teinte.png`) });
  // Geste 2 : au clavier, « Cara », Entrée, 0,3, Entrée.
  await p.focus('[data-role="ajout"]'); await p.keyboard.type('Cara'); await pret(p);
  await p.screenshot({ path: path.join(dir, `${id}-geste-saisie.png`) });
  await p.keyboard.press('Enter'); await pret(p);
  const focus = await p.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');
  if (!/Masse de Carapils/.test(focus)) err.push('après Entrée, le focus est sur « ' + focus + ' »');
  await p.keyboard.type('0,3'); await p.keyboard.press('Enter'); await pret(p);
  const t2 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  if (!/Carapils/.test(t2)) err.push('Carapils absent');
  await p.screenshot({ path: path.join(dir, `${id}-geste-ajout.png`) });
  await brut('gestes');
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(url + '#sucre'); await pret(p);
  await p.screenshot({ path: path.join(dir, `${id}-ordinateur.png`) });
  console.log(`${id} : hauteur à 8 grains ${haut.toFixed(2)} écran${haut > 1.05 ? ' (TROP)' : ''} ; ${err.length ? 'ERREURS ' + err.join(' | ') : 'sans erreur'}`);
  if (err.length || haut > 1.05) echecs++;
  await p.close();
}
await b.close();
console.log(echecs ? 'CAPTURES ECHEC ' + echecs : 'CAPTURES OK');
