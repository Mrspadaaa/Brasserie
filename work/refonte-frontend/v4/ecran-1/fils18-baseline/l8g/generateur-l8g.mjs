// Lot 18 · l8g · l8e prolongé après les retours du brasseur sur son téléphone (19.10, ~21 h) :
//   - l'usage en mot entier, discret, après l'α de chaque houblon : « amérisant », « aromatique », « mixte »
//     (ses mots) ; déduit de l'α, il reste pâle (gris, plus léger) et garde son data-source ;
//   - sous chaque objectif, la piste de l5b ; la bande « ‹ visée | visée » retirée ; la visée des barres de
//     groupe est un tiret sans mot qui ne passe sous aucun texte ;
//   - la fiche parle le langage de la page (pictos au trait, α des voies, usage en mot, barres) ;
//   - la légende ouverte garde son « ? » visible, avec la trace du doigt.
// Tout le reste de l8e : barres de voie de l5b, α, légende, pictos au trait de l2 Carnet (ton texte, crayon léger).
// Usage : node generateur-l8g.mjs  →  l8g/etat-b.html, l8g/planche.html
import fs from 'node:fs';
import { symboles, JET, ORDRE, REPO } from './noyau.mjs';
import { construire, reglerUsage } from './matrice.mjs';
import { CSS, PLANCHE } from './habillage.mjs';
import { EXTRA, net } from './pictos-trait.mjs';

const ICI = REPO + '/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g';
const SYM = {};
for (const m of fs.readFileSync(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html', 'utf8').matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const TON = Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte]));
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
export const SYMB = symboles({ trait: 1.5 })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${TON[f]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM[f])}</g></symbol>`)
  .replace('</svg>', '<defs>' + CRAYON + '</defs></svg>');
reglerUsage('mot');
construire({ ICI, nom: 'l8g · usage en mots', css: CSS + EXTRA, cssPlanche: PLANCHE, symb: SYMB, mots: ['surfaces'],
  commentaire: 'Lot 18 · l8g : l8e, avec l\'usage en mot entier (amérisant, aromatique, mixte ; pâle si déduit de l\'α), la piste de l5b sous chaque objectif (rail de ma bière, zone du style, meilleure voie, visée écrite), sans la bande « visée », la visée des barres de groupe en tiret sans mot ; la fiche dans le langage de la page. Appui long (500 ms) ou survol (750 ms) : la fiche.' });
