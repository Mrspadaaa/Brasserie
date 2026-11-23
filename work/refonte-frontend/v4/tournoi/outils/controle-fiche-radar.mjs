// D115 (23.10, soir, fiche de Cascade, sur « · nommé en premier ») : « Mettre le radargraph avant, cette vue
// est vraiment pas terribles. À revoir... ».
// Neuf (et non une extension de controle-fiche.mjs, M15) : controle-fiche.mjs joue l'appui long sur chaque page d'un
// dossier ; celui-ci regarde seulement l'ordre de la fiche ouverte, `<dossier>/fiche/etat.html`.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-fiche-radar.mjs <dossier construit> [--page=fiche/etat.html]
// Convention de controle-fiche.mjs : la fiche ouverte est data-role="fiche", son radar est
// svg[data-radar][data-objet="fiche"], la liste des familles est data-role="fiche-arome".
// Joué à 390 × 844, sans défiler (tous les conteneurs de la fiche remis en haut) :
//   D115 a : le haut du radar est au-dessus du haut de la liste des familles ;
//   D115 b : le radar est entier dans le premier écran (son bas ≤ 844 px) ;
//   D115 c : le radar est vu en entier à l'œil : sa hauteur dépasse 120 px (une vignette ne compte pas).
// Imprime FICHE-RADAR OK, sinon FICHE-RADAR ECHEC et la liste (lignes « D115 … »).
import fs from 'node:fs';
import path from 'node:path';
import { versUrl, existe } from './lib/cible.mjs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const rel = (args.find((a) => a.startsWith('--page=')) || '').slice(7) || 'fiche/etat.html';
const fichier = path.join(dir, rel);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

if (!existe(fichier)) {
  console.log('FICHE-RADAR ECHEC ' + rel + ' absente dans ' + dir);
  process.exit(1);
}
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(versUrl(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
await wait(500);
const r = await page.evaluate(() => {
  const visible = (e) => {
    const b = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.1;
  };
  const fiche = [...document.querySelectorAll('[data-role="fiche"]')].find((f) => visible(f) && f.getBoundingClientRect().height > 20);
  if (!fiche) return { fiche: false };
  // premier écran : tout conteneur défilant de la fiche, et la page, remis en haut
  window.scrollTo(0, 0);
  for (let e = fiche; e; e = e.parentElement) if (e.scrollTop) e.scrollTop = 0;
  fiche.querySelectorAll('*').forEach((e) => { if (e.scrollTop) e.scrollTop = 0; });
  const radar = [...fiche.querySelectorAll('svg[data-radar][data-objet="fiche"]')].find(visible);
  const liste = [...fiche.querySelectorAll('[data-role="fiche-arome"]')].find(visible);
  const o = { fiche: true, hauteurEcran: innerHeight, radar: null, liste: null };
  if (radar) { const b = radar.getBoundingClientRect(); o.radar = { haut: Math.round(b.top), bas: Math.round(b.bottom), h: Math.round(b.height) }; }
  if (liste) { const b = liste.getBoundingClientRect(); o.liste = { haut: Math.round(b.top), bas: Math.round(b.bottom) }; }
  return o;
});
const p = (m) => problems.push('D115 ' + m);
if (!r.fiche) p('la fiche n\'est pas ouverte dans ' + rel + ' (data-role="fiche" visible)');
else if (!r.radar) p('la fiche n\'a pas de radar visible (svg[data-radar][data-objet="fiche"])');
else {
  if (r.liste && r.radar.haut >= r.liste.haut) p('le radar commence à ' + r.radar.haut + ' px, après le haut de la liste des familles (' + r.liste.haut + ' px) : le radar doit passer avant');
  if (r.radar.bas > r.hauteurEcran) p('le radar n\'est pas entier dans le premier écran : il finit à ' + r.radar.bas + ' px, l\'écran fait ' + r.hauteurEcran + ' px');
  if (r.radar.h < 120) p('le radar ne fait que ' + r.radar.h + ' px de haut (≥ 120 px : une vignette ne compte pas)');
}
console.log('fiche ' + rel + ' à 390 × 844 · radar ' + (r.radar ? r.radar.haut + '–' + r.radar.bas + ' px' : 'absent') + ' · liste des familles ' + (r.liste ? 'dès ' + r.liste.haut + ' px' : 'absente'));
await browser.close();
if (problems.length === 0) console.log('FICHE-RADAR OK');
else { console.log('FICHE-RADAR ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
