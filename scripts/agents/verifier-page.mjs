#!/usr/bin/env node
// Vérifie une page de lot avant publication (leçon L12) : rendu réel dans Chrome au format téléphone,
// aucune erreur de script, chaque image du contenu chargée, pas de défilement horizontal.
// Usage : node scripts/agents/verifier-page.mjs <page.html> [--page-lot] [--captures <préfixe>] [--min-images N]
// Le 22.10, la page du lot 22 a été publiée avec une apostrophe qui cassait son script : les
// variantes n'apparaissaient pas, et rien ne l'avait vérifié.
// Lisibilité, pour une page montrée au brasseur seulement (--page-lot, ou une source sous outils/pages/ ou
// outils/page-lot/) : 23.10, « Problème avec les artefacts, c'est assez dur à lire et chaque version devrait en
// créé des nouveaux ». Une page cumulait quatre sujets et ~100 captures de 277 px, où le texte de l'écran tombait
// à 7 px. Une page = une version d'un sujet, avec la date dans son titre et ce qu'il choisit au premier écran
// (#a-choisir) ; chaque capture à 340 px au moins (le téléphone fait 390), aucun texte sous 14 px, aucun
// paragraphe de plus de 45 mots, au téléphone comme sur ordinateur. Sans ce mode, une maquette (etat.html) est
// seulement rendue : 23 voies du lot 21 s'en servent ainsi dans leurs GATES.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : defaut; };
const page = path.resolve(args[0] ?? '');
const captures = option('--captures', null);
const minImages = Number(option('--min-images', 1));
const pageLot = args.includes('--page-lot') || /outils[\\/](?:pages|page-lot)[\\/]/.test(page);
const LARGEUR_CAPTURE = 340;
const TEXTE_MIN = 14;
const MOTS_MAX = 45;

// Mesures de lisibilité, dans la page : captures (images de 600 px de large au moins), tailles de texte, longueur des blocs.
// vignettes (D126 : « j'ai pas du coté à cote » ; puis « J'aime beaucoup cette disposition. Utilise là pour les artefacts
// comme ça je peux voir rapidement plusieurs versions d'un coup », 24.10) : une planche pose ses mini maquettes en
// vignettes serrées ; une image dans `[data-vignette]` qui s'ouvre en grand au toucher (lien, bouton, `data-agrandir`)
// peut être plus étroite que la capture lisible, à toutes les largeurs. Les autres captures : 340 px (« dur à lire », 23.10).
function lisibilite({ largeurCapture, texteMin, motsMax, vignettes }) {
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden], dialog:not([open])'); };
  const court = (t) => t.replace(/\s+/g, ' ').trim().slice(0, 50);
  const vignette = (i) => vignettes && i.closest('[data-vignette]') && i.closest('a[href], button, [data-agrandir]');
  const etroites = [...document.images]
    .filter((i) => i.getAttribute('src') && Number(i.getAttribute('width') || i.naturalWidth) >= 600 && visible(i) && !vignette(i))
    .filter((i) => i.getBoundingClientRect().width < largeurCapture)
    .map((i) => `${i.getAttribute('src')} (${Math.round(i.getBoundingClientRect().width)} px)`);
  const petits = new Map();
  const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = marche.nextNode(); n; n = marche.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName) || !visible(el)) continue;
    const taille = parseFloat(getComputedStyle(el).fontSize);
    if (taille < texteMin) petits.set(`${court(n.textContent)} (${taille.toFixed(1)} px)`, true);
  }
  const longs = [...document.querySelectorAll('p, li, figcaption, td, dd, summary, .legende')]
    .filter((el) => visible(el) && el.textContent.trim().split(/\s+/).length > motsMax)
    .map((el) => `« ${court(el.textContent)}… » (${el.textContent.trim().split(/\s+/).length} mots)`);
  const choix = document.getElementById('a-choisir');
  return {
    etroites, petits: [...petits.keys()], longs,
    titre: document.title,
    choixHaut: choix && visible(choix) ? Math.round(choix.getBoundingClientRect().top + scrollY) : null,
  };
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const erreurs = [];
try {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(`erreur de script : ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(`console : ${m.text()}`); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await p.goto(`file:///${page.split(path.sep).join('/')}`, { waitUntil: 'networkidle0' });
  const r = await p.evaluate(() => {
    // Les images sans source (une visionneuse fermée) ne font pas partie du contenu.
    const imgs = [...document.images].filter((i) => i.getAttribute('src'));
    return {
      images: imgs.length,
      ratees: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')),
      debord: document.documentElement.scrollWidth - innerWidth,
    };
  });
  if (r.ratees.length) erreurs.push(`images non chargées : ${r.ratees.join(', ')}`);
  if (r.images < minImages) erreurs.push(`${r.images} images (${minImages} au moins)`);
  if (r.debord > 0) erreurs.push(`défilement horizontal de ${r.debord} px à 390 px`);
  const seuils = { largeurCapture: LARGEUR_CAPTURE, texteMin: TEXTE_MIN, motsMax: MOTS_MAX };
  const tel = pageLot ? await p.evaluate(lisibilite, { ...seuils, vignettes: true }) : null;
  if (captures) {
    await p.screenshot({ path: `${captures}-haut.png` });
    await p.screenshot({ path: `${captures}-page.png`, fullPage: true });
  }
  if (pageLot) {
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    const ordi = await p.evaluate(lisibilite, { ...seuils, vignettes: true });
    if (captures) await p.screenshot({ path: `${captures}-ordinateur.png` });
    const liste = (xs) => `${xs.slice(0, 4).join(' ; ')}${xs.length > 4 ? ` ; et ${xs.length - 4} de plus` : ''}`;
    if (!/\b\d{1,2}\.\d{2}\b/.test(tel.titre)) erreurs.push(`titre sans date (« ${tel.titre} ») : une page par version, datée (23.10)`);
    if (tel.choixHaut === null) erreurs.push('aucun bloc #a-choisir : ce qu\'il choisit, en tête de page');
    else if (tel.choixHaut > 844) erreurs.push(`#a-choisir à ${tel.choixHaut} px, sous le premier écran du téléphone (844 px)`);
    for (const [nom, m] of [['téléphone 390 px', tel], ['ordinateur 1280 px', ordi]]) {
      if (m.etroites.length) erreurs.push(`${nom} : ${m.etroites.length} captures sous ${LARGEUR_CAPTURE} px, texte de l'écran illisible : ${liste(m.etroites)}`);
      if (m.petits.length) erreurs.push(`${nom} : texte sous ${TEXTE_MIN} px : ${liste(m.petits)}`);
    }
    if (tel.longs.length) erreurs.push(`blocs de plus de ${MOTS_MAX} mots : ${liste(tel.longs)}`);
  }
  for (const e of erreurs) console.log(`  - ${e}`);
  const rendu = pageLot ? 'lisible à 390 et 1280 px' : '390 px';
  console.log(erreurs.length ? 'PAGE ECHEC' : `PAGE OK (${r.images} images chargées, ${rendu}, sans erreur)`);
  if (captures) console.log(`Captures à ouvrir avant de publier : ${captures}-haut.png, ${captures}-page.png${pageLot ? `, ${captures}-ordinateur.png` : ''}`);
} finally {
  await nav.close();
}
process.exitCode = erreurs.length ? 1 : 0;
