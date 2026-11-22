// Voie t1 : pour chaque état, la maquette choisie (son cadre) à gauche et l'app à droite (390 clair, 390 cave, 1280 clair, 1280 cave).
//   node work/missions/2026-11-09-levure-port/critique/montage.mjs
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = resolve('work/missions/2026-11-09-levure-port/critique');
const arg = (nom, defaut) => process.argv.find((a) => a.startsWith('--' + nom + '='))?.slice(nom.length + 3) ?? defaut;
const caps = resolve(racine, arg('captures', 'captures'));
const sortie = resolve(racine, arg('sortie', 'montages'));
const p2 = resolve('work/missions/2026-11-09-ecran-levure/p2');
await mkdir(sortie, { recursive: true });
const url = (p) => pathToFileURL(p).href;

// maquette : { fichier, part: [index, total, sens] } — un tiers horizontal (h) ou vertical (v) d'une planche de cadres
const ETATS = [
  ['l1-repos', 'Ma levure · repos (l5b cadre 1)', { f: 'l5b/l5b-c1.png' }],
  ['l2-palier2-touche', 'Ma levure · palier 2 touché, son × (l5b cadre 4)', { f: 'l5b/l5b-c4.png' }],
  ['l3-croix', 'Ma levure · × touché, 3 paliers (l5b cadre 5)', { f: 'l5b/l5b-c5.png' }],
  ['l4-plus-entre', 'Ma levure · + entre deux paliers (l5b cadre 6 : + sur fin)', { f: 'l5b/l5b-c6.png' }],
  ['l5-plus-fin', 'Ma levure · + sur la fin (l5b cadre 6)', { f: 'l5b/l5b-c6.png' }],
  ['l6b-loupe-issue', 'Ma levure · ⌕, issue de la recherche (réseau bloqué)', { f: 'l5b/l5b-c1.png' }],
  ['m3b-loupe-issue', 'Comparer · ⌕ phénols, issue (s5a cadre 2)', { f: 's5a/s5a-cadres.png', part: [1, 3, 'v'] }],
  ['l6-loupe', 'Ma levure · ⌕ d’une donnée (l5b : « se touche pour chercher »)', { f: 'l5b/l5b-c1.png' }],
  ['c1-1056', 'Chercher · « 1056 » tapé (c6b cadre 1)', { f: 'c6b/c6b-cadres.png', part: [0, 3, 'h'] }],
  ['c2-feuille', 'Chercher · feuille des filtres (c6b cadre 2)', { f: 'c6b/c6b-cadres.png', part: [1, 3, 'h'] }],
  ['c3-feuille-3filtres', 'Chercher · feuille, 3 filtres posés (c6b cadre 3)', { f: 'c6b/c6b-cadres.png', part: [2, 3, 'h'] }],
  ['c3-3filtres', 'Chercher · 3 filtres posés (c6b cadre 3)', { f: 'c6b/c6b-cadres.png', part: [2, 3, 'h'] }],
  ['m1-repos', 'Comparer · repos (s5a cadre 1)', { f: 's5a/s5a-cadres.png', part: [0, 3, 'v'] }],
  ['m1-plus-feuille', 'Comparer · ⊕ touché (s5a cadre 3 : ⊕)', { f: 's5a/s5a-cadres.png', part: [2, 3, 'v'] }],
  ['m1-feuille-tape-verdant', 'Comparer · ⊕, « Verdant » tapé', { f: 's5a/s5a-cadres.png', part: [0, 3, 'v'] }],
  ['m1-verdant-ajoute', 'Comparer · Verdant ajoutée (s5a cadre 1)', { f: 's5a/s5a-cadres.png', part: [0, 3, 'v'] }],
  ['m2-trois-colonnes', 'Comparer · trois colonnes (s5a cadre 1)', { f: 's5a/s5a-cadres.png', part: [0, 3, 'v'] }],
  ['m2-croix', 'Comparer · × de Verdant (s5a cadre 3)', { f: 's5a/s5a-cadres.png', part: [2, 3, 'v'] }],
  ['m3-loupe', 'Comparer · ⌕ phénols US-05 (s5a cadre 2)', { f: 's5a/s5a-cadres.png', part: [1, 3, 'v'] }],
  ['m1c-pied-malevure-bas', 'Pied « Retour · Comparer (1) · Suivant » au bas de Ma levure (l5b cadre 1, s7a : Comparer (1))', { f: 's7a/s7a-cadres.png', part: [0, 3, 'h'] }],
  ['s1-repos', 'Suggérer · repos (s7a cadre 1)', { f: 's7a/s7a-cadres.png', part: [0, 3, 'h'] }],
  ['s2-moins-attenuation', 'Suggérer · − atténuation (s7a cadre 2)', { f: 's7a/s7a-cadres.png', part: [1, 3, 'h'] }],
  ['s3-deux-axes', 'Suggérer · + thiols, + clarté (s7a cadre 3)', { f: 's7a/s7a-cadres.png', part: [2, 3, 'h'] }],
];
const VARIANTES = ['390-clair', '390-cave', '1280-clair', '1280-cave'];
const H = 760;

const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await navigateur.newPage();
for (const [id, titre, maq] of ETATS) {
  const apps = VARIANTES.map((v) => resolve(caps, `${id}-${v}.png`)).filter((f) => existsSync(f));
  if (!apps.length) { console.log('ABSENT', id); continue; }
  const mf = resolve(p2, maq.f);
  let maqHtml;
  if (maq.part) {
    const [i, n, sens] = maq.part;
    // la planche est affichée à la hauteur H (ou à la largeur 390 pour une planche verticale) et rognée à son tiers
    maqHtml = sens === 'h'
      ? `<div class="maq" style="height:${H}px;width:${Math.round(H * 1300 / 916 / n)}px;overflow:hidden;position:relative"><img src="${url(mf)}" style="height:${H}px;position:absolute;left:${-Math.round(H * 1300 / 916 * i / n)}px"></div>`
      : `<div class="maq" style="height:${H}px;width:${Math.round(H * 390 / (2725 / n))}px;overflow:hidden;position:relative"><img src="${url(mf)}" style="width:${Math.round(H * 390 / (2725 / n))}px;position:absolute;top:${-Math.round(H * i)}px"></div>`;
  } else maqHtml = `<img class="maq" src="${url(mf)}" style="height:${H}px">`;
  const appsHtml = apps.map((f) => `<figure><img src="${url(f)}" style="height:${H}px"><figcaption>${f.split(/[\\/]/).pop()}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e8e4df;font:13px system-ui;padding:10px}h1{font-size:16px;margin:0 0 8px}.row{display:flex;gap:14px;align-items:flex-start}figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:4px}figcaption{color:#444}.maqw{border:3px solid #b45309;border-radius:4px;padding:2px;background:#fff}</style>
  <h1>${titre} — maquette choisie (cadre orange) · app servie</h1><div class="row"><figure><div class="maqw">${maqHtml}</div><figcaption>maquette ${maq.f}</figcaption></figure>${appsHtml}</div>`;
  const hf = resolve(sortie, `${id}.html`);
  await writeFile(hf, html);
  await page.goto(url(hf), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  const taille = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  await page.setViewport({ width: Math.min(taille.w, 4000), height: taille.h, deviceScaleFactor: 1 });
  await page.screenshot({ path: resolve(sortie, `${id}.png`), fullPage: true });
  console.log('MONTAGE', id, taille.w + 'x' + taille.h);
}
await navigateur.close();
