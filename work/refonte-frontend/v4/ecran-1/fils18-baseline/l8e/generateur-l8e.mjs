// Lot 18 · l8e · l8b (« la meilleure version »), avec les pictos d'arôme au trait de l2 Carnet : le dessin
// v3, au ton texte de chaque famille (comme l2), un crayon léger (l2 tremble à 1,4 ; ici 0,8, plus net sur
// l8b), sans lavis, sans disque ni halo (« le glowing des icône de arôme c'est non »). En plus, comme l8f :
// l'α de chaque houblon, plus de pictos par voie et la légende derrière « ? », les barres de l5b.
// Tout le reste est l8b (habillage.mjs). Usage : node generateur-l8e.mjs  →  l8e/etat-b.html, l8e/planche.html
import fs from 'node:fs';
import { symboles, JET, ORDRE, REPO } from './noyau.mjs';
import { construire } from './matrice.mjs';
import { CSS, PLANCHE } from './habillage.mjs';
import { EXTRA, net, cr } from './pictos-trait.mjs';

const ICI = REPO + '/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8e';
const SYM = {};
for (const m of fs.readFileSync(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html', 'utf8').matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const TON = Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte]));
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
const SYMB = symboles({ trait: 1.5 })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${TON[f]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM[f])}</g></symbol>`)
  .replace('</svg>', '<defs>' + CRAYON + '</defs></svg>');
construire({ ICI, nom: 'l8e · pictos au trait (Carnet)', css: CSS + EXTRA, cssPlanche: PLANCHE, symb: SYMB, mots: ['surfaces'],
  commentaire: 'Lot 18 · l8e : l8b avec les pictos d\'arôme au trait de l2 Carnet (dessin v3, ton texte de la famille, crayon léger), sans disque ni halo ; l\'α de chaque houblon (lot en stock, plage des fiches) ; usage, moment, stock et biotransformation en pictos, légende derrière « ? » ; les barres de l5b, 8 px par cran. Appui long (500 ms) ou survol (750 ms) : la fiche g1.' });
console.log('trait au ton texte, sur blanc : ' + ORDRE.map((f) => f + ' ' + cr(TON[f], '#ffffff').toFixed(2)).join(', '));
