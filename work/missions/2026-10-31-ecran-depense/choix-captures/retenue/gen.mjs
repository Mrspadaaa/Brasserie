#!/usr/bin/env node
// Voie c-captures, maquette retenue (02.11, D291) : son choix B, « dans la première vue, pouvoir choisir entre envoyé 1 ou plusieurs
// documents, dans 99% des cas c'est que 1 document » ; « Le bouton noir est splitter en 2 ».
// Reprend les pièces de ../outils/gen.mjs (mêmes jetons, mêmes valeurs fictives). Écrit les états en HTML à 390 px et les capture.
// Usage : node gen.mjs [--sans-captures]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CSS, X, DOC, FILES, CAM, pg, P, tete, frise, apresLecture, rangeePages, lue, page } from '../outils/gen.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const MAQ = path.join(ICI, 'maquettes');
const IMG = path.join(ICI, 'img');
fs.mkdirSync(MAQ, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

// Le bouton noir coupé en deux. Préfixe rt- (L26).
const CSS_RT = `
.rt-split{display:flex;min-height:32px;border-radius:10px;background:#111;color:#fff;overflow:hidden}
.rt-split > span{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:600}
.rt-split .un{flex:1}
.rt-split .plu{flex:none;border-left:1px solid rgb(255 255 255/.38)}
.rt-split .plu.f1{width:96px;font-weight:500}
.rt-split .plu.f2{width:52px;position:relative}
.rt-split .plu.f3{width:124px}
.rt-pile{position:relative;width:20px;height:20px}
.rt-pile i{position:absolute;width:11px;height:14px;border:1.5px solid currentColor;border-radius:2px;background:#111}
.rt-pile b{position:absolute;right:-7px;top:-2px;min-width:14px;height:14px;border-radius:7px;background:#fff;color:#111;font-size:11px;line-height:14px;text-align:center;font-weight:700}
`;
const pile = (badge = '') => `<span class="rt-pile"><i style="left:0;top:0"></i><i style="left:3px;top:3px"></i><i style="left:6px;top:6px"></i>${badge}</span>`;

// Trois formes de la coupe : f1 = libellé d'aujourd'hui + « plusieurs » en petit ; f2 = « Un document » + une pile seule (sans mot) ;
// f3 = « Un document » + « Plusieurs », deux libellés, la première moitié plus large.
const FORMES = {
  f1: `<div class="rt-split"><span class="un">${DOC(16)}Choisir le document</span><span class="plu f1">${FILES(15)}plusieurs</span></div>`,
  f2: `<div class="rt-split"><span class="un">${DOC(16)}Un document</span><span class="plu f2" aria-label="plusieurs">${pile('<b>+</b>')}</span></div>`,
  f3: `<div class="rt-split"><span class="un">${DOC(16)}Un document</span><span class="plu f3">${FILES(15)}Plusieurs</span></div>`,
};
const entree = (f) => `${tete()}<section class="cp-depot">${FORMES[f]}<div class="cp-sec">${CAM(16)}Photographier le ticket</div>`
  + `<p class="cp-note">PDF ou image · lecture automatique · 4 Mo max.</p><span class="cp-lien">Saisir sans justificatif</span></section>`;

// « Un document » : l'état « lecture » d'aujourd'hui, tel quel (ExpenseSheet, data-dp="lecture").
const unDocument = `${tete()}<div class="cp-lect"><div class="nom"><b>commande-malzhaus.png</b><span class="m">0,6 Mo</span></div>${frise}</div>${apresLecture}`;

// Après « Lire » : la lecture des pages, la rangée compacte au-dessus de la frise (comme c-pendant, sans le glisser).
const lecturePages = `${tete()}<div class="cp-lect"><div class="nom"><b>3 pages</b><span class="m">2,1 Mo</span></div>`
  + `<div class="cp-rang" style="padding:4px 0 2px;gap:6px">${P.map((p, i) => pg({ w: 30, h: 56, ...p, lignes: Math.min(p.lignes, 4), n: i + 1 })).join('')}</div>${frise}</div>${apresLecture}`;

const ETATS = [
  ['1-entree-f1', 'Entrée, forme 1', () => entree('f1'), 300, 'gris'],
  ['1-entree-f2', 'Entrée, forme 2', () => entree('f2'), 300, 'gris'],
  ['1-entree-f3', 'Entrée, forme 3', () => entree('f3'), 300, 'gris'],
  ['2-un-document', 'Un document (= aujourd’hui)', () => unDocument, 520, 'gris'],
  ['3-plusieurs-1', 'Plusieurs, première page', () => rangeePages({ pages: [0], vise: false }), 520, 'gris'],
  ['4-plusieurs-3', 'Plusieurs, trois pages', () => rangeePages({ pages: [0, 1, 2], vise: false }), 520, 'gris'],
  ['5-lecture', 'Plusieurs, après Lire', () => lecturePages, 520, 'gris'],
  ['6-lue-repos', 'Dépense lue, au repos', () => lue({ ouvert: false, vise: false }), 700, ''],
  ['7-lue-pages', 'Dépense lue, pages ouvertes', () => lue({ compact: true, vise: false }), 700, ''],
];
for (const [nom, titre, f, haut, classe] of ETATS) {
  const html = page(titre, f(), haut, classe).split('</style>').join(`${CSS_RT}</style>`);
  fs.writeFileSync(path.join(MAQ, `${nom}.html`), html);
}
console.log(`${ETATS.length} états écrits dans ${MAQ}`);

if (!process.argv.includes('--sans-captures')) {
  const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  for (const [nom, , , haut] of ETATS) {
    await p.setViewport({ width: 390, height: haut, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(path.join(MAQ, `${nom}.html`)).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 250));
    const d = await p.evaluate(() => [document.documentElement.scrollWidth, document.body.scrollHeight]);
    await p.screenshot({ path: path.join(IMG, `${nom}.png`) });
    console.log(`${nom}.png · contenu ${d[0]}×${d[1]}`);
  }
  await nav.close();
}
