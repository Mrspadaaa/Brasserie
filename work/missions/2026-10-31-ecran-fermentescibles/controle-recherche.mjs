// D220 : « et maintenant la recherche, comment elle s'affiche ? Dans la liste ? ». La recherche du champ d'ajout, quelle que soit sa forme
// (puces sous le champ, lignes dans la liste, menu ancré) : depuis le repos à 390 px, au doigt, le champ touché puis le texte tapé :
//  R1 « mu » : un résultat Münchner Malz visible au-dessus du clavier (bas ≤ 844 − 300 px) ; le toucher ajoute la ligne, en un geste ;
//  R2 « Munich » (le nom courant, D220 : aujourd'hui il crée « Munich ») : Entrée ajoute Münchner Malz, pas « Munich » ;
//  R3 « pils » : le résultat Pilsner Malz dit qu'il est déjà là, avec sa masse (« 5,0 ») ; Entrée n'ajoute aucune ligne ;
//  R4 « Abbey Malt » (inconnu) : « Créer » visible ; Entrée ajoute la ligne « Abbey Malt » ;
//  R5 « cara 0,3 » : Entrée ajoute Carapils à 0,3 kg ;
//  R6 chaque résultat et « Créer » font 24 px au moins.
// Un résultat : [data-role~="resultat"][data-nom] ou une puce [data-pu] ; déjà là : [data-deja] ; créer : [data-role~="creer"] ou [data-cree].
// Usage : node controle-recherche.mjs <etat.html>... ; imprime RECHERCHE OK ou RECHERCHE ECHEC n.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../package.json'));
const puppeteer = require('puppeteer-core');
const pages = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pages.length) { console.log('RECHERCHE ECHEC 1 (aucune maquette)'); process.exit(1); }
const CLAVIER = 300, H = 844;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
let echecs = 0;
const ko = (m) => { echecs++; console.log('ECHEC ' + m); };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const lignes = () => p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => ({ nom: li.querySelector('[data-role="nom"]')?.textContent.trim(), kg: li.querySelector('[data-role="kg-ligne"]')?.value })));
const resultats = () => p.evaluate(() => [...document.querySelectorAll('[data-role~="resultat"], [data-pu], [data-deja], [data-role~="creer"], [data-cree]')]
  .filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect();
    return { nom: e.dataset.nom || e.dataset.pu || '', deja: e.hasAttribute('data-deja'), creer: /(^|\s)creer(\s|$)/.test(e.dataset.role || '') || e.hasAttribute('data-cree'), texte: e.textContent.replace(/\s+/g, ' ').trim(), haut: r.top, bas: r.bottom, l: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
async function taper(url, texte) {
  await p.goto(url); await p.evaluate(() => document.fonts.ready); await pause(100);
  const champ = await p.$('[data-role="ajout"]');
  if (!champ) return false;
  await champ.tap(); await p.keyboard.type(texte, { delay: 15 }); await pause(250);
  return true;
}
for (const f of pages) {
  const nom = path.basename(path.dirname(path.resolve(f))) + '/' + path.basename(f);
  const url = 'file:///' + path.resolve(f).split(path.sep).join('/');
  if (!(await taper(url, 'mu'))) { ko(`${nom} : pas de champ d'ajout [data-role="ajout"]`); continue; }
  const avant = (await lignes()).length;
  let rs = await resultats(), mun = rs.find((r) => /münchner/i.test(r.nom) && !r.creer);
  if (!mun) ko(`${nom} R1 : « mu » ne montre pas Münchner Malz (${rs.map((r) => r.texte).join(' | ') || 'rien'})`);
  else {
    if (mun.haut < 0 || mun.bas > H - CLAVIER) ko(`${nom} R1 : Münchner Malz hors de la vue au-dessus du clavier (${Math.round(mun.haut)}–${Math.round(mun.bas)} px)`);
    await p.touchscreen.tap(mun.x, mun.y); await pause(250);
    const ls = await lignes();
    if (ls.length !== avant + 1 || !ls.some((l) => /münchner/i.test(l.nom))) ko(`${nom} R1 : le toucher sur Münchner Malz n'ajoute pas sa ligne`);
  }
  for (const r of rs) if (r.l < 24 || r.h < 24) ko(`${nom} R6 : « ${r.texte} » ${Math.round(r.l)} × ${Math.round(r.h)} px`);
  await taper(url, 'Munich'); await p.keyboard.press('Enter'); await pause(250);
  let ls = await lignes();
  if (!ls.some((l) => /münchner/i.test(l.nom)) || ls.some((l) => /^munich$/i.test(l.nom))) ko(`${nom} R2 : « Munich », Entrée → ${ls.slice(avant).map((l) => l.nom).join(', ') || 'rien'} (Münchner Malz attendu)`);
  await taper(url, 'pils'); rs = await resultats();
  const pil = rs.find((r) => /pilsner/i.test(r.nom + ' ' + r.texte) && r.deja);
  if (!pil) ko(`${nom} R3 : « pils » ne dit pas que Pilsner Malz est déjà là`);
  else if (!/5,0/.test(pil.texte)) ko(`${nom} R3 : « ${pil.texte} » sans sa masse (5,0)`);
  await p.keyboard.press('Enter'); await pause(250);
  if ((await lignes()).length !== avant) ko(`${nom} R3 : « pils », Entrée ajoute une ligne`);
  await taper(url, 'Abbey Malt'); rs = await resultats();
  const cr = rs.find((r) => r.creer);
  if (!cr) ko(`${nom} R4 : « Abbey Malt » sans « Créer »`); else if (cr.l < 24 || cr.h < 24) ko(`${nom} R6 : « Créer » ${Math.round(cr.l)} × ${Math.round(cr.h)} px`);
  await p.keyboard.press('Enter'); await pause(250);
  ls = await lignes();
  if (!ls.some((l) => /^abbey malt$/i.test(l.nom))) ko(`${nom} R4 : « Abbey Malt », Entrée n'ajoute pas sa ligne`);
  await taper(url, 'cara 0,3'); await p.keyboard.press('Enter'); await pause(250);
  ls = await lignes();
  const ca = ls.find((l) => /carapils/i.test(l.nom));
  if (!ca || Math.abs(parseFloat(String(ca.kg).replace(',', '.')) - 0.3) > 1e-6) ko(`${nom} R5 : « cara 0,3 », Entrée → ${ca ? ca.nom + ' ' + ca.kg : 'rien'} (Carapils 0,3 kg attendu)`);
  console.log(`INFO ${nom} : R1 à R6 joués`);
}
await b.close();
console.log(echecs ? `RECHERCHE ECHEC ${echecs}` : 'RECHERCHE OK');
