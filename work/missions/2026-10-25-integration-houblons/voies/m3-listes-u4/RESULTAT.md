OK — page des listes A à D dans la vraie vue Substituer de l'app, entière ; seul l'ordre change (PAGE OK)

## Fichiers écrits
- `src/ui/hopIndex/substituer/donnees.ts` : `window.__hopSubstituerOrdre` (liste d'`{id, score}`), lu seulement sous `import.meta.env.DEV`, dans `composer()` ; la clé de mémoire suit l'ordre imposé. Le reste de l'écran (`index.tsx`, CSS) n'est pas touché. Le candidat garde tout ce que dit le moteur (stock, dose, familles, score moteur dans le `title`) ; seul le score devient celui de la colonne, en point (min = max).
- `scripts/check-no-dev-auth.mjs` : une ligne, `__hopSubstituerOrdre` ajouté aux marqueurs.
- `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs` : le contrôle (F1 : règles et écritures qui cachent l'écran ; F2 : `fidelite.json`).
- `tests/unit/hopIndexV4/substituerOrdreImpose.test.ts` : 20 tests (ordre imposé, mémoire, id absent signalé, garde DEV dans le source, regex de F1 exercées sur 11 cas, F2).
- Voie : `ordres.ts` → `ordres.json` ; `capturer.mjs` → `img/` (43 images + `jeux.json`) et `fidelite.json` ; `faire-page.mjs` → `page.html` ; `img/u4-vue-390.png` (copie de ta capture).

## Critères (sortie décisive)
- `controle-capture-fidele.mjs …/m2-listes-substituts/capturer.mjs` → `FIDELE ECHEC (3)` : F1 `html.m2l-actif .pq-substituer > :not(.m2l-ajout) { display: none !important; }`, F1 `[data-role="choix-dock"] { display: none }`, F2 pas de mesure. Sur le mien : `FIDELE OK`.
- Le contrôle compare `avant` (l'écran tel que l'app le rend avec la liste) et `apres` (à la prise de vue) : nœuds visibles hors rangées et blocs (`data-role`, `data-etat`, h1/h2/summary). Il compare aussi les blocs à la colonne A (`referenceA`). Les nœuds seuls ne se comparent pas à A : le face à face change avec les deux comparés (essayé, 18 faux rouges : 896 contre 923 nœuds, etc.).
- `npx vitest run tests/unit/hopIndexV4` : 47 fichiers, 383 tests verts. `npm run build` : exit 0. `grep -rl __hopSubstituerOrdre dist` : 0 ; `node scripts/check-no-dev-auth.mjs` : « Bundle de production propre ».
- `node scripts/agents/verifier-page.mjs …/m3-listes-u4/page.html --page-lot --captures <tmp>/m3` → `PAGE OK (43 images chargées, lisible à 390 et 1280 px, sans erreur)`. Captures de page ouvertes (haut, ordinateur, page entière) ; vues ouvertes une à une : Nelson Sauvin A, B, C, D, C « scores », A entière, Galaxy D.
- `capturer.mjs` : « aucune erreur de page » ; aucune ligne `ÉCART` : à chaque capture, nom et score de chaque rangée lus à l'écran (`data-min`, `data-max`) égalent la liste imposée.

## Essais
- Le build a trahi la première version : le message de `console.warn` portait le nom, dans une branche gardée par un appel (`ordreImpose()`) que le bundler ne supprime pas. Le bloc entier est maintenant sous `if (import.meta.env.DEV)` : 0 occurrence. Deuxième essai, tenu.
- F2 : la première règle (moins de nœuds qu'en A) donnait 18 faux rouges, revue comme ci-dessus.

## D'où vient chaque score
- A : le moteur de l'app, sans injection (plages hachurées comprises).
- B, C : `listes-lambda.json` (`reglage_prudent`, `reglage_retenu`). `ordres.ts` recalcule les 220 scores avec la formule d'eval-hop (copie de `suite-mots.ts`) : identiques aux 220 (rang et score).
- D : ordre de `cote-a-cote.json` (`option1PlusIA`, 8 houblons ; pas Fuggle, Magnum, Willamette). L'IA ne donne pas de score : chaque candidat porte son score du réglage C (λ = 0,25, garde 2 mots / df 8), recalculé par la même formule. Son rang C est dans `ordres.json` (`rangC`, de 1 à 39).

## Le regard : Nelson Sauvin A (app, `img/nelson-sauvin-a-long.png`) contre `u4-vue-390.png`
- Même ossature : tête avec le houblon, réponse en gras et sa ligne grise, rangées avec scores, « Face à face, même masse » (Nugget remplacé par Nelson Sauvin, deux comparés en couleur), α, tableau Arômes 16D, radar, β, pied Annuler / Remplacer. Même ordre de lecture.
- Ce qui diffère, et ce n'est pas mon fait : u4 est pris à 60′ (échelle 50-100 à paliers) ; la liste est au dry hop, où l'app montre son tableau « Arômes 16D » à côté du score (variante u4e5 de `index.tsx`, `tableauAuFroid`). Le code de l'app a aussi les ajouts D127 à D130 (mots hors familles, huiles, « Ma bière avec chacun », « Ajouter … aux achats », « Lire ces scores »).
- Rien n'est masqué ni ajouté par ma voie. Je n'ai pas pris de A à 60′ côte à côte.

## Doutes et limites
- Dans B, C et D, le score est un point : la ligne « sans inconnue » et la légende « un point : tout est connu » sont celles du code de l'app et ne disent pas vrai (le score de e1 renormalise sans la composante inconnue). Le « Lire ces scores » ouvert d'emblée dit aussi, pour B/C/D : « rangés par le bas de la plage », « 10 des 317 : les 10 premiers du catalogue et les 0 premiers de ton stock () ». Je n'ai pas touché ce texte (consigne : écran inchangé). Il n'est pas sur la page (captures « scores » gardées dans `img/`, non montrées).
- D : l'ordre est celui de l'IA, les scores suivent celui du réglage C ; la réponse en gras de l'écran lit le plus haut score (Galaxy D : « Harlequin, 79 » alors que Nectaron est en tête, 67).
- Le pool de l'IA était l'option 1 de e1 (sans garde), pas exactement C ; ce n'est pas rejoué ici.
- A montre 5 remplaçants (la règle de l'app : 5 du catalogue + 3 du stock ; la fixture n'a pas de stock) ; B, C, D en montrent 10. L'ordre de A (pire cas) n'est pas celui de `listes-lambda.json` (« moteur »).
- Les captures font 390 × 960, pas 844 : à 844 le pied cache la dixième rangée.
- Les 11 houblons entrent au brouillon par le champ « Ajouter un houblon » et son « + » (frappe et clic réels), un chargement de page par houblon ; Substituer s'ouvre par `window.__hopPile.open`, comme m1 et m2 ; la puce « dry hop » est touchée. Nugget reste dans la recette.
- Des scores sous 50 (jusqu'à 44) sortent de l'échelle 50-100 de l'app : le point se place à 50, le nombre reste exact (au dry hop le tableau n'a pas d'échelle).

## DÉCISION À PRENDRE : lire les listes au dry hop (tableau) ou à 60′ (échelle de u4) ?
- Options : (1) comme ici, au dry hop, tableau Arômes 16D ; (2) ajouter une page à 60′ avec l'échelle de u4, où ses scores et ses barres se lisent.
- Recommandation : garder (1), les listes de e1 sont celles du dry hop ; (2) seulement si le brasseur veut voir u4 « le plus proche ». Le décideur est le pilote, la page est déjà au dry hop.

CONNAISSANCE : l'écran Substituer de l'app est `<details open>` pour « Lire ces scores » ; à 60′ il montre l'échelle, au dry hop le tableau (variante u4e5, `tableauAuFroid`). Une capture « au repos » ne montre que le haut.
LEÇON PROPOSÉE : un contrôle de fidélité sur le nombre de nœuds visibles doit comparer l'écran avant et après le script, pas deux listes : le contenu suit les données (18 faux rouges, 26.10). Et un garde `import.meta.env.DEV` sur un `return null` laisse les chaînes dans le build : mettre tout le bloc sous le garde.
