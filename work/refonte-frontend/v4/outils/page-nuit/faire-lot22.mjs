// Prépare lot22.json pour la page des fils de fer : le lot 22 (22.10), la carte des outils, Comparer
// (variantes r2, r3, r6a à r6m retenues ou rejetées par le critique) et le picto « épicé ».
// Sortie : lot22.json, au format d'ajouter-lot.mjs. Ne publie rien.
import fs from 'node:fs';
import path from 'node:path';

const C = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/';
const CARTE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils22-carte/captures/';
const EPICE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/captures/';
const images = [
  [CARTE + 'carte-390.png', 'La carte des outils : Ma bière → Suggérer → Comparer → Dryhopper → Levure'],
  [C + 'r6l-premier-ecran.png', '★ r6l Des cartes à glisser · r2 · IBU égal · porte Nelson Sauvin · A'],
  [C + 'r6l-glisser-pendant.png', '★ r6l : la carte suit le doigt'],
  [C + 'r6j-premier-ecran.png', '★ r6j Les vraies valeurs d\'abord · r2 · effet égal · B'],
  [C + 'r6i-premier-ecran.png', '★ r6i Remplacer Nelson Sauvin à effet égal · r3 · porte · A'],
  [C + 'r6m-premier-ecran.png', '★ r6m La phrase et le radar · r3 · IBU égal · B'],
  [C + 'r6b-premier-ecran.png', 'r6b Un radar par houblon · r3 · dose égale · B — réserve : les rayons roses'],
  [C + 'r6h-premier-ecran.png', 'r6h Je n\'ai pas Nelson Sauvin · r2 · dose égale · porte · B — réserve : radar chargé'],
  [C + 'r6a-premier-ecran.png', 'r6a Trois colonnes · r2 · dose égale · A — rejeté pour le radar en tête ; les colonnes sont à garder'],
  [C + 'r6f-premier-ecran.png', 'r6f Même amertume · r2 · IBU égal · B — rejeté : radar muet, écran à moitié vide ; les cartes sont à garder'],
  [C + 'r6c-premier-ecran.png', 'r6c Le podium des agrumes — rejeté : Galaxy premier alors qu\'il sort du style'],
  [C + 'r6d-premier-ecran.png', 'r6d Le même tropical — rejeté : la référence est Galaxy lui-même'],
  [C + 'r6g-premier-ecran.png', 'r6g Trois verres — rejeté : trois verres pareils, radars minuscules'],
  [C + 'r6k-premier-ecran.png', 'r6k Le panel d\'abord — rejeté : la réponse est tout en bas'],
  [EPICE + 'planche-390.png', 'Picto « épicé » : trois piments et le mot, à côté de la feuille et des brins ; en tête p1 « calice et crochet »'],
  [EPICE + 'contexte-390.png', 'Les mêmes sur Columbus, Cascade et Saaz'],
];
const manquent = images.filter(([f]) => !fs.existsSync(f));
if (manquent.length) { console.log('MANQUENT', manquent.map((m) => m[0]).join(', ')); process.exit(1); }
const lot = {
  ticket: 119,
  ancre: 't119-lot22',
  court: 'lot 22 : Comparer, carte, épicé',
  titre: 'Lequel pour ma stout ? Comparer (12 variantes), la carte des outils et le picto épicé (lot 22, 22.10)',
  etat: 'à choisir : une variante, une carte, un picto',
  puces: [
    "Choisis trois choses en regardant : une variante de Comparer (★ = celles que le critique garde), la carte des outils, et le picto « épicé ». Un mélange est possible.",
    "Comparer pose une seule question : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Seul le houblon change ; le reste est fixé sur la ligne de contexte. Les variantes portent tes choix ouverts : radar r2 (un houblon plein, les autres en contour) ou r3 (un radar par houblon) ; dose égale, effet égal ou IBU égal ; la porte « Je n'ai pas Nelson Sauvin » ; descripteurs A (groseille à maquereau dans les petits fruits) ou B (une part « autres » grise).",
    "Pour B, je propose : mots génériques écartés (fruité, noble, doux, sucré), seuil 25 %, plafond 33 %. À corriger par toi.",
    "Vu par le critique sur presque toutes : les bandes d'intervalle saturent les radars. Ce sera corrigé sur la variante que tu choisis.",
    "La carte : un écran par question, un seul réglage libre par écran (houblon, moment ou levure). Substituer et Levure sont montrés de deux façons, côte à côte.",
    "Picto « épicé », après « Aucun me convient... » : le piment, en trois dessins, et le mot « épicé » en repli. Réserve : le piment dit « piquant », ce n'est pas tout à fait l'épicé du houblon.",
    "Données : stout export 16D à 4,75 % vol. ; le simulé est marqué « ~ » ; l'α de Galaxy et celui de Nelson Sauvin sortent de leurs fiches (≠).",
  ],
  images,
};
const sortie = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'lot22.json');
fs.writeFileSync(sortie, JSON.stringify(lot, null, 1) + '\n');
console.log('lot22.json · ' + images.length + ' images');
