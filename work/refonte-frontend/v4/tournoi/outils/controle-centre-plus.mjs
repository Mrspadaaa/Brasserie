#!/usr/bin/env node
// Comparer, le « + » de la colonne « Ta stout ». Ses mots : « Pas centré » (passe 2 de Comparer), puis, sur cmc2g, « le +
// toujours pas centré » (25.10) : un défaut qui revient devient un contrôle (L13).
//
// Pour chaque page, à 390 x 844 : le bouton [data-role="ajouter-colonne"] doit avoir son centre
//   - en x, au centre de sa colonne (son élément parent, la cellule « Ta stout ») ;
//   - en y, au milieu de la rangée des têtes (le parent de cette cellule, la grille des têtes),
// à 2 px près. Un bouton absent est un échec (le repère manque, on ne devine pas).
// Usage : node controle-centre-plus.mjs <dossier> <id...> [--page=etat.html]   (page lue : <dossier>/<id>/<page>)
// Sortie : une ligne par id, puis le nom du contrôle suivi de OK ou « ECHEC (n) ». Ne s'arrête pas au premier échec (M16).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TOLERANCE = 2;
const args = process.argv.slice(2);
const pageNom = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const [dossier, ...ids] = args.filter((a) => !a.startsWith('--'));
if (!dossier || !ids.length) { console.log('Usage : node controle-centre-plus.mjs <dossier> <id...> [--page=etat.html]'); process.exit(2); }

function mesurer() {
  const b = document.querySelector('[data-role="ajouter-colonne"]');
  if (!b) return { absent: 'bouton [data-role="ajouter-colonne"]' };
  const col = b.parentElement, rang = col?.parentElement;
  if (!col || !rang) return { absent: 'colonne ou rangée du bouton' };
  const rb = b.getBoundingClientRect(), rc = col.getBoundingClientRect(), rr = rang.getBoundingClientRect();
  const cx = rb.left + rb.width / 2, cy = rb.top + rb.height / 2;
  return { dx: cx - (rc.left + rc.width / 2), dy: cy - (rr.top + rr.height / 2), w: rc.width, h: rr.height };
}

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let echecs = 0;
for (const id of ids) {
  const fichier = path.resolve(dossier, id, pageNom);
  let ligne;
  if (!fs.existsSync(fichier)) ligne = `ECHEC — page absente (${fichier})`;
  else {
    const p = await navigateur.newPage();
    try {
      await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 800));
      const m = await p.evaluate(mesurer);
      if (m.absent) ligne = `ECHEC — repère manquant : ${m.absent}`;
      else {
        const ok = Math.abs(m.dx) <= TOLERANCE && Math.abs(m.dy) <= TOLERANCE;
        ligne = `${ok ? 'OK' : 'ECHEC'} — écart au centre de la colonne ${m.dx.toFixed(1)} px (colonne ${Math.round(m.w)} px), au milieu des têtes ${m.dy.toFixed(1)} px (rangée ${Math.round(m.h)} px)`;
      }
    } catch (e) { ligne = `ECHEC — plantage ${String(e.message ?? e).slice(0, 80)}`; } finally { await p.close(); }
  }
  if (!ligne.startsWith('OK')) echecs += 1;
  console.log(`${id} : ${ligne}`);
}
await navigateur.close();
const jeton = ['CEN', 'TRE'].join('');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
