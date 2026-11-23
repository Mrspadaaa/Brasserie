#!/usr/bin/env node
// Comparer, « Ses mots » (D151). Ses mots, sur cmc2k (25.10) : « Le +2 de idao7 ça va pas du tout, il doit tout y avoir
// avec en ordre décroissant du plus fort au plus faible. »
//
// Pour chaque page, à 390 x 844, dans la section « Ses mots » (.pq-comparer-mots), colonne par colonne ([data-col]) :
//   1. aucun « +n » (un reste caché derrière un compte) ;
//   2. le nombre de mots rendus ([data-mot]) égal à sa liste : data-n-mots, la longueur de la liste du moteur (sesMots)
//      écrite par l'écran ; absente, la liste est inconnue : échec (on ne devine pas) ;
//   3. l'ordre décroissant de la force, en deux clés : (a) le nombre de fiches qui citent le mot, lu dans son title
//      (« mot : fiche1, fiche2 ; … »), et égal à data-fiches s'il existe ; (b) data-force, l'apport de sa famille chez ce
//      houblon selon le moteur (un nombre ; vide = sans force moteur, rangé après tous ceux qui en ont une, à égalité de (a)).
//      Sans data-force sur un mot, l'ordre ne se juge que sur (a).
// Usage : node controle-mots-tous.mjs <dossier> [id...] [--page=etat.html]   (page lue : <dossier>/<id>/<page> ; sans id :
//         « comparer », la maquette construite, comme l'appelle controle-choix avec {dossier})
// Sortie : une ligne par id, puis MOTS-TOUS OK ou MOTS-TOUS ECHEC (n). Ne s'arrête pas au premier échec (M16).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const pageNom = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const [dossier, ...idsDonnes] = args.filter((a) => !a.startsWith('--'));
const ids = idsDonnes.length ? idsDonnes : ['comparer'];
if (!dossier) { console.log('Usage : node controle-mots-tous.mjs <dossier> [id...] [--page=etat.html]'); process.exit(2); }

function lire() {
  const sec = document.querySelector('.pq-comparer-mots');
  if (!sec) return { absent: true };
  return {
    cols: [...sec.querySelectorAll('[data-col]')].map((c) => ({
      cle: c.getAttribute('data-col'),
      n: c.hasAttribute('data-n-mots') ? Number(c.getAttribute('data-n-mots')) : null,
      plus: [...c.childNodes].map((x) => x.textContent ?? '').filter((t) => /^\s*\+\s*\d+\s*$/.test(t)),
      mots: [...c.querySelectorAll('[data-mot]')].map((m) => ({ mot: m.getAttribute('data-mot'), title: m.getAttribute('title') ?? '', fiches: m.getAttribute('data-fiches'), force: m.getAttribute('data-force') })),
    })),
    plusSection: /(^|\s)\+\d+(\s|$)/.test(sec.textContent ?? ''),
  };
}
/** La force lue dans le title : les fiches entre « mot : » et le premier « ; ». */
const forceDe = (m) => {
  const t = m.title.startsWith(`${m.mot} : `) ? m.title.slice(m.mot.length + 3) : null;
  if (t == null) return null;
  const fiches = t.split(' ; ')[0].split(', ').filter(Boolean);
  return fiches.length || null;
};

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let echecs = 0;
for (const id of ids) {
  const fichier = path.resolve(dossier, id, pageNom);
  const fautes = [], notes = [];
  if (!fs.existsSync(fichier)) fautes.push(`page absente (${fichier})`);
  else {
    const p = await navigateur.newPage();
    try {
      await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 800));
      const m = await p.evaluate(lire);
      if (m.absent) fautes.push('section « Ses mots » (.pq-comparer-mots) absente');
      else if (!m.cols.length) fautes.push('aucune colonne [data-col] dans « Ses mots »');
      else {
        if (m.plusSection) fautes.push('un « +n » dans la section');
        for (const c of m.cols) {
          if (c.plus.length) fautes.push(`${c.cle} : « ${c.plus[0].trim()} »`);
          if (c.n == null) fautes.push(`${c.cle} : liste inconnue (data-n-mots absent), ${c.mots.length} mots rendus`);
          else if (c.n !== c.mots.length) fautes.push(`${c.cle} : ${c.mots.length} mots rendus sur ${c.n}`);
          const forces = c.mots.map(forceDe);
          if (forces.some((f) => f == null)) fautes.push(`${c.cle} : force illisible (title) pour ${c.mots.filter((_, i) => forces[i] == null).map((x) => x.mot).join(', ')}`);
          c.mots.forEach((x, i) => { if (x.fiches != null && forces[i] != null && Number(x.fiches) !== forces[i]) fautes.push(`${c.cle} : ${x.mot}, data-fiches ${x.fiches} ≠ ${forces[i]} fiches`); });
          const moteur = c.mots.map((x) => (x.force == null ? undefined : x.force === '' ? null : Number(x.force)));
          if (moteur.some((v) => typeof v === 'number' && !Number.isFinite(v))) fautes.push(`${c.cle} : data-force illisible`);
          // a avant b ? -1 si a plus fort, 1 si b plus fort, 0 à égalité
          const cmp = (i, j) => {
            if (forces[i] !== forces[j]) return forces[i] > forces[j] ? -1 : 1;
            const a = moteur[i], b = moteur[j];
            if (a === undefined || b === undefined || a === b) return 0;
            if (a === null) return 1; if (b === null) return -1;
            return a > b ? -1 : 1;
          };
          const casse = forces.findIndex((f, i) => i > 0 && f != null && forces[i - 1] != null && cmp(i - 1, i) > 0);
          const dit = (i) => `${forces[i]} fiche${forces[i] > 1 ? 's' : ''}, force ${moteur[i] === null ? '—' : moteur[i] ?? '?'}`;
          if (casse > 0) fautes.push(`${c.cle} : ordre cassé, « ${c.mots[casse - 1].mot} » (${dit(casse - 1)}) avant « ${c.mots[casse].mot} » (${dit(casse)})`);
          notes.push(`${c.cle} ${c.mots.length}${c.n != null ? '/' + c.n : ''} [${c.mots.map((x, i) => `${x.mot}:${forces[i]}/${moteur[i] === null ? '—' : moteur[i] ?? '?'}`).join(' ')}]`);
        }
      }
    } catch (e) { fautes.push(`plantage ${String(e.message ?? e).slice(0, 80)}`); } finally { await p.close(); }
  }
  if (fautes.length) echecs += 1;
  console.log(`${id} : ${fautes.length ? 'ECHEC — ' + fautes.join(' ; ') + (notes.length ? ' (lu : ' + notes.join(' ; ') + ')' : '') : 'OK — ' + notes.join(' ; ')}`);
}
await navigateur.close();
const jeton = ['MOTS', 'TOUS'].join('-');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
