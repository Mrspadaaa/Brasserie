// Lot 18 · l8h · comme l8g, avec l'usage en courte pastille : « amer », « arôme », « mixte » (la goutte et le
// souffle restent à côté du mot, dans la pastille) ; attesté par un fournisseur, la pastille est pleine (gris
// clair) ; déduit de l'α, elle n'a qu'un contour et son mot reste pâle, avec son data-source.
// Le reste est l8g (mêmes modules, copiés) : pistes de l5b sous les objectifs, plus de bande « visée », fiche
// dans le langage de la page, légende avec la trace du doigt.
// Usage : node generateur-l8h.mjs  →  l8h/etat-b.html, l8h/planche.html
import fs from 'node:fs';
import { symboles, JET, ORDRE, REPO } from './noyau.mjs';
import { construire, reglerUsage } from './matrice.mjs';
import { CSS, PLANCHE } from './habillage.mjs';
import { EXTRA, net } from './pictos-trait.mjs';

const ICI = REPO + '/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8h';
const SYM = {};
for (const m of fs.readFileSync(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html', 'utf8').matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const TON = Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte]));
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
const SYMB = symboles({ trait: 1.5 })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${TON[f]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM[f])}</g></symbol>`)
  .replace('</svg>', '<defs>' + CRAYON + '</defs></svg>');
reglerUsage('pastille');
construire({ ICI, nom: 'l8h · usage en pastille', css: CSS + EXTRA, cssPlanche: PLANCHE, symb: SYMB, mots: ['surfaces'],
  commentaire: 'Lot 18 · l8h : comme l8g, avec l\'usage en courte pastille (amer, arôme, mixte ; pleine si attestée, contour seul et mot pâle si déduite de l\'α). Pistes de l5b sous les objectifs, sans la bande « visée » ; fiche dans le langage de la page. Appui long (500 ms) ou survol (750 ms) : la fiche.' });
