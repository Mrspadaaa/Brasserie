// Écrit <id>/NOTE.md de la planche des graphes. Usage : node notes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const lot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMMUN = `Rôle : jeu court de la planche des graphes (D125, Q4), pas une variante de concept, donc sans chaleur. La lettre **a** est le graphe tel qu'il est : son DOM rendu, figé depuis la maquette jouable (\`outils/extraire.mjs\`, lecture seule de \`prototypes/\`, feuille \`assets/style.css\` copiée), rien de redessiné. **b** et **c** sont le même graphe (le même DOM), lu autrement au doigt ; au repos, aucune légende écrite (« Pas besoin d'écrire la légende sur la version finale »). Le « ? » discret ouvre la légende de l'écran, mot pour mot. Appui long (ou survol long) sur « Nugget », dans la ligne de contexte : la fiche g1. Aucun nouveau type de graphe ; les types m4, h4, l5b et r2 ne changent pas.

Honnêteté : chaque mot de bulle est lu dans le DOM figé (position du rond et de la zone, \`data-source\`, \`aria-label\`, \`data-crans\`, \`data-valeurs\`, \`data-inconnues\`) ou, pour la fiche, dans les mots sourcés de Nugget (\`pack-fiches\`, via \`fils24-fiche-liste/fla1/commun/donnees.mjs\`). « ~ » pour le simulé ; l'inconnu se dit « inconnu, pas zéro ». La bande de couleurs après « Nugget » est sa bande des 12 familles (vive : marquée ; pâle : citée ; grise : non décrite), comme sur sa carte de l'étape.`;
const SORTIE = `## Sorties des contrôles (24.10, planche entière)
- G1 (GATES) → JEU-BIEN.
- G2 \`controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-graphes gr1 gr2 gr3 gr4 gr5 gr6 --page=etat.html --sans=mots\` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; **COMMUN OK** (mots sauté par GATES.md : la page empile trois fois le graphe). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes) : corrigé par les cartes d'objectif réelles de Suggérer en 5a et la bande de Nugget dans le contexte.`;
const N = {
  gr1: ['Les barres l5b de Ma bière, au style', `- **1a tel qu'il est** : Ma bière, Barres, Au style (reprise r2, \`parcours-biere/biere/etat.html\`). La lentille marche : elle bascule sur la vue absolue figée.
- **1b le mot sous le doigt** : le doigt sur une famille → « Agrumes · à peine · ~ prévu », « Résineux · au-dessus du 16D ×2,8 · dégusté 18.10 », « Noyau · non situé : inconnu, pas zéro ». La ligne touchée se cerne.
- **1c le haut du 16D nommé** : au repos, un trait noir au haut de la zone du style sur chaque barre, nommé une fois (« haut du 16D ») ; au doigt, la barre se remplit jusqu'au rond à la couleur de la famille, et la bulle ajoute « ~4 % du haut du 16D ».

Ce qui tient : c'est le DOM de la maquette. Ce qui casse : « haut du 16D » frôle « zone du style · au-dessus » de la ligne des pastilles. À l'étape, les mêmes barres sont en deux colonnes : la lecture retenue s'y appliquera, elle n'est pas montrée ici.`, 'gr1-toucher.png (1b, Agrumes), gr1-toucher-c.png (1c, Agrumes)'],
  gr2: ['Les barres en absolu (faible, moyen, marqué)', `- **2a tel qu'il est** : Ma bière, Barres, après « Absolu » (lentille sur Absolu, en-tête faible · moyen · marqué).
- **2b le mot sous le doigt** : « Floral · faible · le 16D va jusqu'à moyen · ~ prévu » (palier lu à la position du rond, par tiers de barre ; haut du style lu au bout de la zone).
- **2c au style, l'absolu au doigt** : la section reste au style (lentille Au style). Le doigt tenu sur une famille remplace sa seule barre par sa barre absolue et dit « en absolu : marqué · le 16D va jusqu'à faible · dégusté 18.10 » ; doigt levé, elle revient. Une lecture sans changer de mode.

Ce qui casse : 2c ne montre l'absolu que d'une famille à la fois.`, 'gr2-toucher.png (2b, Floral), gr2-toucher-c.png (2c, Résineux tenu)'],
  gr3: ['Le radar m4 de Ma bière et sa grille', `- **3a tel qu'il est** : Ma bière, après « Radar » : radar m4 (dégustation en bleu, zone grise du 16D, « ? » hachurés) et la grille pas senti · faible · moyen · marqué.
- **3b le sommet au doigt** : le doigt sur le radar → le rayon de la famille se trace à sa couleur, sa ligne de grille se cerne ; bulle « Résineux · marqué, au-dessus du 16D · dégusté 18.10 » ou « Agrumes · pas goûté : inconnu, pas zéro · le 16D va jusqu'à ~faible » (lu sur l'aria-label du radar et le contour de la zone).
- **3c la grille au doigt, le 16D nommé** : au repos, la zone grise porte son nom (« 16D »), et une lentille Au style · Absolu (Absolu retire la zone : la dégustation est déjà en paliers absolus) ; le doigt sur une ligne de la grille trace le rayon de sa famille sur le radar.

Écart : la maquette n'a pas de lentille en mode Radar ; 3c l'ajoute (D75, au style partout). À lui montrer, pas imposé.`, 'gr3-toucher.png (3b, Résineux), gr3-toucher-c.png (3c, Floral)'],
  gr4: ['Le radar h4 de la fiche (Nugget)', `- **4a tel qu'il est** : la fiche g1 de Nugget ouverte par l'appui long (reprise r3, \`parcours-fiche/fiche/etat.html\`) : α, radar h4, flèches « + Floral 2/4 − Résineux 2/4 ».
- **4b les mots des fiches au doigt** : le doigt sur un rayon → « Floral · 2 fiches sur 4 (floral, géranium) » ; « Melon · ses fiches n'en disent rien : inconnu, pas zéro ».
- **4c face à ma bière** : au repos, les rayons de ses deux objectifs (floral, résineux) tracés à leur couleur ; au doigt, « Résineux · ma bière en a trop, dégusté 18.10 · Nugget 2/4 (boisé, résineux) ».

Sous les trois, « sous la fiche : l'étape » : le profil de l'étape figé, là où s'ouvre la fiche ; il porte la lentille au style (D75), que la fiche n'a pas.

Ce qui casse : 4c lit les flèches de la fiche comme ses objectifs de Ma bière (+ floral, − résineux), comme les boutons de Ma bière.`, 'gr4-toucher.png (4b, Floral), gr4-toucher-c.png (4c, Résineux)'],
  gr5: ['Les traits de Suggérer (« ce système de petit bar »)', `- **5a tel qu'il est** : Suggestions (reprise r4, q2b) : cartes d'objectif, lentilles, « même effet sur tes objectifs », quatre voies (Motueka, Aurum, East Kent Goldings, Columbus) ; sous chaque picto, un trait par cran du style.
- **5b le cran au doigt** : le doigt sur un picto → « Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka » (\`data-crans\` de la case).
- **5c les crans comptés** : au repos, chaque picto montre aussi ses crans vides jusqu'au plus grand de la liste (2) : le trait plein ou demi, puis le vide ; on compte sans légende. Même bulle au doigt.

Ce qui casse : les traits restent petits (h-1,5) ; les crans vides, cerclés d'un pixel, sont fins à 390 px.`, 'gr5-toucher.png (5b, Agrumes de Motueka), gr5-toucher-c.png (5c)'],
  gr6: ['Le radar r2 de Comparer', `- **6a tel qu'il est** : Comparer (reprise r5) : critère floral, « ★ Idaho 7 devant Cascade ~+0,4 cran », lentille, radar r2 (Idaho 7 plein, Cascade et Galaxy en contour, zone verte de ta 16D, pictos des familles), puis les trois colonnes.
- **6b un houblon à la fois** : le doigt sur un tracé ou une colonne → les autres s'effacent ; « Galaxy seul · au-dessus du 16D : tropicaux, résineux · inconnu : herbacé, terreux, pépins, melon » (\`data-valeurs\` comparées au contour de la zone, \`data-inconnues\`).
- **6c l'axe au doigt** : le doigt sur un axe → son rayon se trace ; « Floral · Idaho 7 › Cascade › Galaxy · tous dans ta 16D » (rang au rayon sur l'axe).

Ce qui casse : doigt au nord, la bulle couvre le haut du radar.`, 'gr6-toucher.png (6b, Galaxy), gr6-toucher-c.png (6c, Floral)'],
};
for (const [id, [titre, corps, caps]] of Object.entries(N)) {
  fs.writeFileSync(path.join(lot, id, 'NOTE.md'), `# ${id} — ${titre}\n\n${COMMUN}\n\n## Les trois lectures\n${corps}\n\nCaptures (\`../captures/\`, 390 × 844 tactile) : ${id}-repos.png (premier écran), ${caps}, ${id}-page.png (page entière).\n\n${SORTIE}\n`);
  console.log(id + ' · NOTE.md');
}
