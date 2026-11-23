#!/usr/bin/env node
// Comparer, le « + » de la colonne « Ta stout ». Ses mots : « Pas centré » (passe 2), « le + toujours pas centré » (cmc2g),
// puis, sur cmc2h : « Le + doit juste être au centre du rond du bouton ??? » (25.10). Le défaut est le SIGNE dans son rond :
// le SVG du + était posé à gauche d'un bouton de 44 px (9 px de décalage), sans flex qui le centre.
//
// Pour chaque page, à 390 x 844 :
//   1. le signe : le centre de la boîte des tracés du SVG (path, line, circle, rect, polyline, polygon) du bouton
//      [data-role="ajouter-colonne"] est au centre du bouton (son rond), à 0,5 px près, en x et en y ;
//   2. les autres boutons ronds de la vue, même mesure à 0,5 px : ⇄ (.pq-comparer-remplacer), × (.pq-comparer-retirer),
//      le « ? » des étapes ([data-role="aide-etapes"]) ; le « ? » de la légende ([data-role="legende-bouton"]) est un
//      caractère de police : on mesure la boîte de son texte, en x à 0,5 px et en y à 1 px (la boîte de ligne n'est pas
//      l'encre) ;
//   3. second critère, la place du bouton : son centre au centre de sa colonne (son parent) en x et au milieu de la rangée
//      des têtes (le parent de la colonne) en y, à 2 px près.
// Un repère absent est un échec pour le + (on ne devine pas) ; un autre bouton absent est seulement signalé.
// Usage : node controle-centre-plus.mjs <dossier> <id...> [--page=etat.html]   (page lue : <dossier>/<id>/<page>)
// Sortie : une ligne par id, puis le nom du contrôle suivi de OK ou « ECHEC (n) ». Ne s'arrête pas au premier échec (M16).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const pageNom = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const [dossier, ...ids] = args.filter((a) => !a.startsWith('--'));
if (!dossier || !ids.length) { console.log('Usage : node controle-centre-plus.mjs <dossier> <id...> [--page=etat.html]'); process.exit(2); }

function mesurer() {
  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const signe = (b) => {
    const traces = [...b.querySelectorAll('svg path, svg line, svg circle, svg rect, svg polyline, svg polygon')];
    if (traces.length) {
      const rs = traces.map((t) => t.getBoundingClientRect());
      const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top));
      const r = Math.max(...rs.map((x) => x.right)), bo = Math.max(...rs.map((x) => x.bottom));
      return { genre: 'svg', c: [(l + r) / 2, (t + bo) / 2] };
    }
    const n = [...b.childNodes].find((x) => x.nodeType === 3 && x.textContent.trim());
    if (!n) return null;
    const rg = document.createRange(); rg.selectNodeContents(n);
    return { genre: 'texte', c: centre(rg.getBoundingClientRect()) };
  };
  const ecart = (b) => { const s = signe(b); if (!s) return null; const c = centre(b.getBoundingClientRect()); return { genre: s.genre, dx: s.c[0] - c[0], dy: s.c[1] - c[1] }; };
  const plus = document.querySelector('[data-role="ajouter-colonne"]');
  const autres = [['⇄', '.pq-comparer-remplacer'], ['×', '.pq-comparer-retirer'], ['? étapes', '[data-role="aide-etapes"]'], ['? légende', '[data-role="legende-bouton"]']]
    .map(([nom, sel]) => { const b = document.querySelector(sel); return { nom, e: b ? ecart(b) : null, absent: !b }; });
  if (!plus) return { absent: 'bouton [data-role="ajouter-colonne"]', autres };
  const s = ecart(plus);
  const col = plus.parentElement, rang = col?.parentElement;
  const rb = plus.getBoundingClientRect(), rc = col.getBoundingClientRect(), rr = rang.getBoundingClientRect();
  return { s, place: { dx: rb.left + rb.width / 2 - (rc.left + rc.width / 2), dy: rb.top + rb.height / 2 - (rr.top + rr.height / 2) }, autres };
}

const f = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
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
      const m = await p.evaluate(mesurer);
      if (m.absent) fautes.push(`repère manquant : ${m.absent}`);
      else {
        if (!m.s) fautes.push('le + n\'a pas de signe mesurable');
        else {
          const ok = Math.abs(m.s.dx) <= 0.5 && Math.abs(m.s.dy) <= 0.5;
          (ok ? notes : fautes).push(`signe + au centre de son rond : ${f(m.s.dx)} / ${f(m.s.dy)} px`);
        }
        const okP = Math.abs(m.place.dx) <= 2 && Math.abs(m.place.dy) <= 2;
        (okP ? notes : fautes).push(`bouton dans sa colonne : ${f(m.place.dx)} / ${f(m.place.dy)} px`);
      }
      for (const a of m.autres) {
        if (a.absent) { notes.push(`${a.nom} absent`); continue; }
        if (!a.e) { fautes.push(`${a.nom} : signe non mesurable`); continue; }
        const tolY = a.e.genre === 'texte' ? 1 : 0.5;
        const ok = Math.abs(a.e.dx) <= 0.5 && Math.abs(a.e.dy) <= tolY;
        (ok ? notes : fautes).push(`${a.nom}${a.e.genre === 'texte' ? ' (texte)' : ''} : ${f(a.e.dx)} / ${f(a.e.dy)} px`);
      }
    } catch (e) { fautes.push(`plantage ${String(e.message ?? e).slice(0, 80)}`); } finally { await p.close(); }
  }
  if (fautes.length) echecs += 1;
  console.log(`${id} : ${fautes.length ? 'ECHEC — ' + fautes.join(' ; ') + (notes.length ? ' (ok : ' + notes.join(' ; ') + ')' : '') : 'OK — ' + notes.join(' ; ')}`);
}
await navigateur.close();
const jeton = ['CEN', 'TRE'].join('');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
