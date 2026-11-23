// D5 (18.10) : « mais ça doit pas être surchargé ». Un écran d'étape tient dans un écran à 390 × 844 (1,05 écran
// au plus). Le contrôle de D5, controle-lot.mjs, ne lit plus le format actuel (« a-adapter » dans
// portee-defauts.json) : le 24.10 l'étape Houblons de la maquette faisait 960 px pour 844 (1,14 écran), sans que
// personne ne le voie. Ce contrôle mesure le rendu, au repos, tactile.
// Mesure : la hauteur du contenu = la place des éléments fixes (en-tête, pied) + la hauteur défilante du contenu.
//   - si la page défile dans un conteneur (le main de [data-page-shell], ou le plus haut des conteneurs overflow auto /
//     scroll) : (844 − sa hauteur visible) + son scrollHeight ;
//   - sinon : la hauteur du document. On garde la plus grande des deux.
// Rapport à 844 ; échec au-delà de --max (1,05 par défaut).
// Usage : node controle-hauteur.mjs <dossier> <route> [--max=1.05] [--page=etat.html]
//   page lue : <dossier>/<route>/<page>, sinon <dossier>/<page> (la base : « . » ou rien, --page=index.html).
// Sortie : HAUTEUR OK (1,0x écran) ou HAUTEUR ECHEC (1,xx écran > 1,05) et les lignes « - D5 … ».
// Témoins : temoins/hauteur-trop/ma-biere/etat.html (960 px) → ECHEC ; hauteur-ok (840 px) → OK.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve(pos[0] || '.');
const route = pos[1] || '';
const opt = (n, d) => ((args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3)) || d;
const max = Number(opt('max', '1.05').replace(',', '.'));
const page = opt('page', 'etat.html');
const candidats = [path.join(dir, route, page), path.join(dir, page)];
const fichier = candidats.find((f) => fs.existsSync(f));
const virgule = (v) => v.toFixed(2).replace('.', ',');
if (!fichier) { console.log('HAUTEUR ECHEC (page absente)'); console.log('- D5 page absente : ' + candidats.join(' ni ')); process.exit(1); }
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'load', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
  const m = await p.evaluate(() => {
    const H = innerHeight;
    const defile = (e) => e.scrollHeight > e.clientHeight + 4 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY);
    const coque = document.querySelector('[data-page-shell]');
    let conteneur = coque ? [...coque.querySelectorAll('main')].find(defile) || (defile(coque) ? coque : null) : null;
    if (!conteneur) conteneur = [...document.querySelectorAll('body *')].filter(defile).sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || null;
    const doc = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const dansConteneur = conteneur ? (H - conteneur.clientHeight) + conteneur.scrollHeight : 0;
    return { H, doc, dansConteneur, conteneur: conteneur ? conteneur.tagName.toLowerCase() + (coque && coque.contains(conteneur) ? ' de [data-page-shell]' : '') : null, fixe: conteneur ? H - conteneur.clientHeight : 0, defilant: conteneur ? conteneur.scrollHeight : 0 };
  });
  const haut = Math.max(m.doc, m.dansConteneur);
  const ratio = haut / m.H;
  console.log('hauteur du contenu : ' + haut + ' px pour ' + m.H + ' (' + (m.conteneur ? m.conteneur + ' : ' + m.fixe + ' px fixes + ' + m.defilant + ' px défilants ; ' : 'pas de conteneur défilant ; ') + 'document ' + m.doc + ' px) · ' + path.relative(process.cwd(), fichier));
  if (ratio > max + 1e-9) {
    console.log('HAUTEUR ECHEC (' + virgule(ratio) + ' écran > ' + virgule(max) + ')');
    console.log('- D5 le contenu fait ' + haut + ' px à 390 × ' + m.H + ', soit ' + virgule(ratio) + ' écran (' + virgule(max) + ' au plus) : « mais ça doit pas être surchargé »');
    process.exitCode = 1;
  } else console.log('HAUTEUR OK (' + virgule(ratio) + ' écran)');
} finally {
  await nav.close();
}
