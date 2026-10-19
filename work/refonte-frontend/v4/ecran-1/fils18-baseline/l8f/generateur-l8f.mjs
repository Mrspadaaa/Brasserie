// Lot 18 · l8f · l8b (« la meilleure version »), avec les pictos d'arôme au trait de v2 (lot 17) : trait
// lucide d'une seule épaisseur, 1,5 px rendu à toute taille (vector-effect), sans disque ni halo (« le glowing
// des icône de arôme c'est non »). Le ton base de la famille, ou son ton texte quand la base tient moins de
// 3:1 (objet graphique, WCAG 1.4.11) sur le blanc ou sur la tuile de sa famille : la faiblesse notée dans v2
// (agrumes 2,0:1, pépins 2,1:1, melon 2,2:1, tropical 2,2:1). En plus, comme l8e : l'α de chaque houblon, plus
// de pictos par voie et la légende derrière « ? », les barres de l5b. Tout le reste est l8b (habillage.mjs).
// Usage : node generateur-l8f.mjs  →  l8f/etat-b.html, l8f/planche.html
import fs from 'node:fs';
import { symboles, JET, ORDRE, REPO } from './noyau.mjs';
import { construire } from './matrice.mjs';
import { CSS, PLANCHE } from './habillage.mjs';
import { EXTRA, net, cr } from './pictos-trait.mjs';

const ICI = REPO + '/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8f';
const SYM = {};
for (const m of fs.readFileSync(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v2/planche.html', 'utf8').matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const TON = Object.fromEntries(ORDRE.map((f) => [f, Math.min(cr(JET[f].base, '#ffffff'), cr(JET[f].base, JET[f].fond)) >= 3 ? JET[f].base : JET[f].texte]));
const SYMB = symboles({ trait: 1.5 })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${TON[f]}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${net(SYM[f])}</symbol>`);
construire({ ICI, nom: 'l8f · pictos au trait (v2)', css: CSS + EXTRA, cssPlanche: PLANCHE, symb: SYMB, mots: ['surfaces'],
  commentaire: 'Lot 18 · l8f : l8b avec les pictos d\'arôme au trait lucide de v2 (une épaisseur, 1,5 px rendu ; ton base, ton texte pour les familles claires), sans disque ni halo ; l\'α de chaque houblon (lot en stock, plage des fiches) ; usage, moment, stock et biotransformation en pictos, légende derrière « ? » ; les barres de l5b, 8 px par cran. Appui long (500 ms) ou survol (750 ms) : la fiche g1.' });
console.log('ton texte pour : ' + ORDRE.filter((f) => TON[f] !== JET[f].base).join(', ') + ' ; trait sur blanc : ' + ORDRE.map((f) => f + ' ' + cr(TON[f], '#ffffff').toFixed(2)).join(', ') + ' ; sur sa tuile : ' + ORDRE.map((f) => f + ' ' + cr(TON[f], JET[f].fond).toFixed(2)).join(', '));
