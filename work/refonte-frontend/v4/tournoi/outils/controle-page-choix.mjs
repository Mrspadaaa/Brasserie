#!/usr/bin/env node
// D126 (24.10, soir), sur la page « Choix de vues · 24.10 » : « Mais il y a très peu de mini maquettes ??? J'ai pratiquement
// aucun choix ?? Et j'ai pas du coté à cote ». La page cumulait sept sujets ; pour tenir sous le plafond de hauteur de
// verifier-page, chaque choix était une bande qui défile, une variante visible à la fois, et les jeux courts n'en avaient
// que trois. Ses mots d'avant : « Plus de mini maquettes que juste 11, fait en qqch comme 30 » ; « Il me faut des mini
// maquettes avec un nouvel artefacts comme pour les mini maquettes côté à côté ».
//
// Ce contrôle joue la page d'un choix (ou chaque section marquée d'une page) dans Chrome et refuse :
//   C1 une variante cachée : toute image de mini maquette doit tenir dans la largeur de la page, sans défilement horizontal
//      (aucun conteneur `overflow-x` qui en cache une) ;
//   C2 pas de côte à côte : à 1280 px, au moins 3 mini maquettes sur une même rangée, la référence comprise ; à 390 px, au
//      moins 2 sur une rangée (vignettes, agrandies au toucher) ;
//   C3 trop peu de choix : au moins --min variantes par choix (11 par défaut : « Je dirais 11 par vue », 24.10), sans compter la référence ;
//   C4 pas de référence : la mini maquette de référence (son choix ou le plancher) est marquée `data-reference` ;
//   C5 pas d'agrandissement : chaque vignette s'ouvre en grand au toucher (lien vers l'image, ou `data-agrandir`).
// Une section de choix : un élément `[data-choix]` ; ses mini maquettes : les `img` dans `[data-variante]` ou
// `[data-reference]`. Sans `[data-choix]`, chaque `section` qui contient des images compte comme un choix.
//
// Usage : node controle-page-choix.mjs <page.html> [--min=11]
// Sortie : une ligne par choix, puis « PAGE-CHOIX OK (n choix) » ou « PAGE-CHOIX ECHEC (k/n) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const page = args.find((a) => !a.startsWith('--'));
const min = Number((args.find((a) => a.startsWith('--min=')) ?? '--min=11').slice(6));
if (!page || !fs.existsSync(path.resolve(RACINE, page))) { console.log('Usage : node controle-page-choix.mjs <page.html> [--min=11]'); process.exit(2); }

const MESURER = () => {
  const vue = innerWidth;
  const sections = [...document.querySelectorAll('[data-choix]')];
  const choix = sections.length ? sections : [...document.querySelectorAll('section')].filter((s) => s.querySelector('img'));
  return choix.map((s) => {
    const nom = s.getAttribute('data-choix') || s.id || (s.querySelector('h2,h3')?.textContent ?? '').trim().slice(0, 40);
    const marquees = [...s.querySelectorAll('[data-variante] img, [data-reference] img')];
    const imgs = (marquees.length ? marquees : [...s.querySelectorAll('img')]).filter((i) => !i.closest('dialog'));
    const refs = imgs.filter((i) => i.closest('[data-reference]'));
    const variantes = imgs.filter((i) => !i.closest('[data-reference]'));
    // C1 : cachée hors de la largeur, ou dans un conteneur qui défile en largeur.
    const cachees = imgs.filter((i) => {
      const r = i.getBoundingClientRect();
      if (r.width === 0) return true;
      if (r.right > vue + 1 || r.left < -1) return true;
      for (let p = i.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth + 2) return true;
      }
      return false;
    }).length;
    // C2 : la plus grande rangée (mêmes hauts à 8 px près).
    const hauts = imgs.map((i) => Math.round(i.getBoundingClientRect().top / 8));
    const parRangee = new Map();
    for (const h of hauts) parRangee.set(h, (parRangee.get(h) ?? 0) + 1);
    const rangee = Math.max(0, ...parRangee.values());
    // C5 : un lien vers l'image, ou data-agrandir, sur la vignette ou son parent.
    const sansAgrandir = imgs.filter((i) => !i.closest('a[href], [data-agrandir], button')).length;
    // C3 compte des variantes : une variante marquée peut porter deux captures (au repos, au toucher).
    const nVariantes = marquees.length ? s.querySelectorAll('[data-variante]').length : variantes.length;
    return { nom, n: nVariantes, refs: refs.length, cachees, rangee, sansAgrandir };
  });
};

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
// Sans isMobile, comme verifier-page : la source n'a pas la balise viewport que la publication ajoute, et un rendu
// « mobile » l'afficherait à 980 px de large.
const mesurer = async (largeur, hauteur) => {
  const p = await navigateur.newPage();
  await p.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(path.resolve(RACINE, page)).href, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 400));
  const m = await p.evaluate(MESURER);
  await p.close();
  return m;
};
const ordi = await mesurer(1280, 900);
const tel = await mesurer(390, 844);
await navigateur.close();

let ko = 0;
for (const [i, o] of ordi.entries()) {
  const t = tel[i] ?? o;
  const p = [];
  if (o.cachees || t.cachees) p.push(`C1 ${Math.max(o.cachees, t.cachees)} mini maquette(s) cachée(s) (bande qui défile ou hors largeur)`);
  if (o.rangee < 3) p.push(`C2 ${o.rangee} par rangée à 1280 px (3 au moins)`);
  if (t.rangee < 2) p.push(`C2 ${t.rangee} par rangée à 390 px (2 au moins)`);
  if (o.n < min) p.push(`C3 ${o.n} variante(s) (${min} au moins)`);
  if (!o.refs) p.push('C4 aucune référence marquée (data-reference)');
  if (o.sansAgrandir) p.push(`C5 ${o.sansAgrandir} vignette(s) sans agrandissement`);
  if (p.length) ko++;
  console.log(`${o.nom} : ${p.length ? 'ECHEC — ' + p.join(' ; ') : `OK (${o.n} variantes, ${o.rangee} par rangée à 1280, ${t.rangee} à 390)`}`);
}
if (!ordi.length) { console.log('PAGE-CHOIX ECHEC (0/0) : aucune section de choix'); process.exit(1); }
console.log(ko ? `PAGE-CHOIX ECHEC (${ko}/${ordi.length})` : `PAGE-CHOIX OK (${ordi.length} choix)`);
process.exit(ko ? 1 : 0);
