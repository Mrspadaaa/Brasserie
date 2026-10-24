// Écrit la NOTE.md de chaque concept de la série b, avec les sorties des contrôles joués une fois (fichiers donnés).
// Usage : node notes-sbb.mjs <sortie-commun.txt> <sortie-indicatifs.txt> <sortie-panel.txt>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.resolve(ici, '..');
const [commun, indic, panel] = process.argv.slice(2).map((f) => fs.readFileSync(f, 'utf8'));
const lignes = (txt, id) => txt.split('\n').filter((l) => new RegExp('\\b' + id + '\\b').test(l)).map((l) => l.trim());
const bilan = (txt, re) => (txt.match(re) || []).join(' · ');

const BASE = `Plancher : u4 (\`fils11-substitution/u4/vue.html\`, capture \`u4-vue-390.png\`) et la porte de la maquette (\`choix/commentaires/captures/p22-substituer-repos.png\`), enrichis.
Données : moteur du parcours en direct (\`sbb1/moteur-sbb.ts\` → \`sbb1/donnees-sbb.json\`) : \`remplacants\` (style 16D, en stock d'abord), \`lireBiere\` après \`remplacer\` (dose à IBU égal), \`houblon\` (α du lot, plage des fiches, rôle, mots sans famille). Rien de recopié à la main.
Générateur : \`sbb1/generer-sbb.mjs\` (socle \`socle-sbb.mjs\`, briques \`briques-sbb.mjs\`, concepts \`concepts-sbb*.mjs\`) ; captures : \`sbb1/capturer-sbb.mjs\`.`;
const BASELINE = `Baseline suivie, aucun écart : pictos de famille au trait (planche fils17-standard/v3, épicé = cannelle et clou croisés \`p-spice\`), couleurs des familles, α du lot puis plage des fiches (« ≠ » quand le lot en sort), usage en mot, stock en petit badge (boîte, boîte « − » pour un stock court, chariot pour l'achat), lentille Au style / Absolu (au style par défaut) et barres l5b face à la zone de la 16D, thème blanc, croix pour sortir, légende derrière « ? », fiche g1 courte à l'appui long. Pas de bouton Annuler (D120) : seul « Remplacer › ».
Honnêteté : « ~ » sur tout le simulé ; inconnu en « ? » ou hachures (Noyau, Pépins, Baies, Melon de ma bière ; huiles d'Altus et Trident ; cohumulone) ; la part « autres » de Nelson Sauvin (83 %) dessinée ; « arôme 100 » de la porte renommé « rien d'étranger » (à 60′ le moteur ne compte que l'arôme que le remplaçant ajoute) ; à 60′, aucun « perd floral » : ma bière ne bouge que de ~±1 et c'est dit.`;

const C = {
  sbb1: { ch: 'froide', idee: 'u4 affiné : sa liste classée (score sur 50–100, plage hachurée quand les huiles manquent) avec la réponse posée au-dessus, « Nelson Sauvin, 62 g », et son pourquoi en trois composantes.',
    tient: 'Le classement lisible d’un coup d’œil, l’ordre du moteur (en stock d’abord) ; chaque ligne dit α, usage, dose et stock ; le toucher sur une ligne change la réponse, ma bière et le pied. « Si tu achètes : Magnat » reste visible.',
    casse: 'Huit lignes de deux étages : dense, proche de la liste de u4 sans sa face-à-face ; la plage 79–99 est un calcul de la page (u4), pas du moteur ; les barres de ma bière à 60′ ne montrent presque rien (c’est vrai, mais peu spectaculaire).' },
  sbb2: { ch: 'froide', idee: 'u4 affiné : son face-à-face « même IBU », réduit à la paire Nugget (contour, épuisé) → la réponse ; α et β en plages (Beer Maverick, Hopsteiner en trait fin, lot en trait noir), les arômes cités en cases, ma bière au style.',
    tient: 'La grammaire de u4 sans la troisième colonne coupée : une seule substitution à la fois, la flèche dit le remplacement ; « à 60′, l’ébullition en emporte l’essentiel » écrit au-dessus des cases ; les puces en bas changent le remplaçant.',
    casse: 'Reste proche de Comparer (plages α/β côte à côte) : c’est le risque de confusion qu’il a nommé ; la réponse ne se lit qu’à la deuxième carte, pas en tête ; le radar de u4 n’est pas repris (place).' },
  sbb3: { ch: 'tiède', idee: 'Le verdict et son bilan : la réponse en grand sur la couleur du houblon, puis « Tu gardes » / « Tu perds » en deux colonnes et « On ne sait pas » en pointillé.',
    tient: 'Gagné et perdu en un regard, en mots de brasseur, chaque ligne tirée des données (IBU, usage, matière, stock restant, huiles, α hors fiches, part sans famille, cohumulone inconnue) ; le pourquoi 86 en trois barres ; la réponse change au toucher d’un autre remplaçant.',
    casse: 'Beaucoup de texte (le plus long de la série au premier écran) ; le bandeau coloré plein pèse ; les autres remplaçants défilent de côté, Idaho 7 coupé à 390 px.' },
  sbb4: { ch: 'tiède', idee: 'Ma bière dit la réponse : les douze familles avant (rond) et après, l’IBU dans la zone 50–70 et les grammes face au stock ; la phrase dit « ma bière ne bouge presque pas ».',
    tient: 'La leçon de brasseur visible sans la lire : à 60′ le choix ne change pas l’arôme, et le résineux reste hors du style quel que soit le remplaçant (écrit en bas) ; les onglets en tête font le seul facteur libre.',
    casse: 'Douze rangées presque vides à 60′ : le dessin montre surtout l’absence d’effet ; les quatre familles inconnues prennent de la place ; le nom de la réponse n’est pas plus grand que le reste.' },
  sbb5: { ch: 'tiède', idee: 'Trois réponses, trois raisons : « Sans rien acheter » (Nelson Sauvin), « Le moins de matière » (Galaxy, α 17,2), « Le plus proche » (Magnat, à acheter, tout connu) ; trois cartes qui se choisissent.',
    tient: 'La réponse dépend de la contrainte du brasseur, et l’écran le dit sans question ; chaque carte : α, usage, stock, arômes, score et ses trois composantes, ce qu’il restera ; écran plein.',
    casse: 'Trois cartes de même gabarit : répétitif ; les critères « moins de matière » et « le plus proche » sont des tris de cette page sur les données du moteur ; Idaho 7 et Sabro (93, stock court) n’y figurent pas.' },
  sbb6: { ch: 'chaude', idee: 'Le ticket : le remplacement comme un reçu, « − Nugget 46 g », « + Nelson Sauvin 62 g », puis ligne à ligne amertume, matière, usage, huiles, stock 100 → 38 g, arôme ~±1, inconnus, ma bière ; total « proximité 86 » et tampon EN STOCK.',
    tient: 'Une forme que tout le monde lit : ce qu’on retire, ce qu’on met, ce que ça coûte ; les onglets du ticket et la pile des autres tickets choisissent le remplaçant ; le tampon dit le stock d’un coup.',
    casse: 'Typographie à chasse fixe dense ; le ticket déborde un peu de l’écran (880 px) et la pile passe sous le pied ; deux sélecteurs du même facteur (onglets et pile).' },
  sbb7: { ch: 'chaude', idee: 'La cible : Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock, à droite l’achat ; la réponse est le point cerclé de gauche, le plus près qui suffit.',
    tient: 'Le compromis proximité / disponibilité se voit sans chiffre : les houblons à acheter collent à Nugget (98–99), ceux du stock sont plus loin ; rayons hachurés pour les huiles inconnues ; étiquettes en colonnes, assez grandes pour le doigt.',
    casse: 'Le placement angulaire est arbitraire (seule la distance compte) ; les quatre points de droite se serrent ; la carte de dessous répète le reste de la série.' },
  sbb8: { ch: 'chaude', idee: 'La fiche de brassage corrigée : Nugget barré sur la recette, « ↳ Nelson Sauvin 62 g · 60′ » écrit dessus, les notes dans la marge ; les autres corrections crayonnées dessous, à toucher ; le bilan IBU et ma bière au pied de la fiche.',
    tient: 'La réponse est montrée là où elle servira : dans la recette ; tout vient de la recette S1 (16D, 20 L, DI 1,066, 70 EBC, US-05) ; la marge dit pourquoi sans phrase longue.',
    casse: 'Le crayonné est un style, pas un geste : pas d’annotation libre ; la liste « ou bien » ressemble à sbb1 ; la recette n’a qu’un houblon dans le cas, la fiche paraît maigre en malts (non inventés).' },
};

for (const [id, c] of Object.entries(C)) {
  const commun1 = commun.split('\n').filter((l) => /^\S+\s+(OK|ECHEC|sauté)/.test(l) || /^COMMUN/.test(l)).map((l) => l.trim()).join(' · ');
  const md = `# ${id} · Substituer, série b (la réponse d'abord)

Chaleur : ${c.ch}. Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; fixés : la stout 16D, Nugget 46 g à 60′, la règle « même IBU » (59,7).

- **Idée** : ${c.idee}
- **Ce qui tient** : ${c.tient}
- **Ce qui casse** : ${c.casse}

${BASELINE}

${BASE}

## Captures
\`captures/${id}-premier-ecran.png\`, \`captures/${id}-page.png\`, \`captures/${id}-geste.png\` (un toucher sur Galaxy, ou Idaho 7 pour sbb7 : réponse, ma bière et pied changent), \`captures/${id}-fiche.png\` (appui long).

## Contrôles (joués une fois)
- Baseline (\`controle-commun --sans=mots\`, sur la série) : ${commun1}
- Une question (D98) : ${lignes(indic.split('===')[0], id).join(' ; ') || '—'} → ${bilan(indic.split('===')[0], /UNE-QUESTION (OK|ECHEC)[^\n]*/g) || '—'}
- Sans famille (D100) : ${lignes(indic.split('===')[1] || '', id).join(' ; ') || '—'} → ${bilan(indic.split('===')[1] || '', /SANS-FAMILLE (OK|ECHEC)[^\n]*/g) || '—'}
- Mots au premier écran, hors données : ${lignes(indic.split('===')[2] || '', id).join(' ; ')} ; tous les mots : ${lignes(indic.split('===')[3] || '', id).join(' ; ')} (80 au plus, indicatif)
- Panel de la série (\`controle-panel\`) : ${panel.trim().split('\n').join(' · ')}
`;
  fs.writeFileSync(path.join(lot, id, 'NOTE.md'), md);
  console.log(id, 'NOTE', md.length);
}
