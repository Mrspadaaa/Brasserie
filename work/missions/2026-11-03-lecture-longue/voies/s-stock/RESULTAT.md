OK — Réparée à la main, une ligne entre au stock si elle est « nouvel article » ou reliée ; un article existant identique exige un geste « Relier ».

Réponse à sa question : **oui si…** Une quantité et une unité tapées font entrer la ligne au stock quand elle est déjà « nouvel article » (cas A) ou déjà reliée (B3, C1). Mais quand l'article du même nom existe déjà au stock et que la lecture n'a pas lu la quantité (B1, B2), rien ne se relie tout seul : « Confirmer » refuse, et un geste de plus (« Relier à … ») est nécessaire.

## Fichier écrit
- `tests/unit/depense/d381/stock-repare.test.tsx` (neuf, 11 tests). Aucune modification de l'app. Aucun appel IA.

## Méthode
`ExpenseSheet` réel, rendu comme `tests/unit/depense/lecture-d/ecran.test.tsx`. Lecture FICTIVE (Brauhaus Ouest, `lecture-372765.reconciliee.json` comme gabarit), stock SIMULÉ, aucune valeur d'une vraie pièce. Le dépôt simulé rejoue `savePurchase` (purchaseEntry.ts l. 665-687) avec les VRAIES fonctions : `validatePurchase` (refuse comme `validatePurchaseCommit`), `articlesNeufsDe` (articles créés), `stockQuantityFor` (ajout aux articles existants). Il écrit seulement dans un tableau du test.
`qrLecture` est simulé dans le test : le paquet `zxing-wasm` manque sur ce poste, ce qui fait échouer aussi `lecture-d/ecran.test.tsx` à l'import (voir doutes).

## Cas A — ni quantité ni unité, « nouvel article » d'office (stock vide, « Sucre candi », 5,90)
Geste par geste :
1. À la lecture : ligne « article «» · nouvel article », quantité « ? », case rouge « unité à remplir ». (A0)
2. « Confirmer » sans rien faire : refusé, alerte « Sucre candi : indique la quantité reçue et son unité. » Rien n'est écrit. (A0)
3. Il tape 2 dans « Quantité ligne 1 » puis touche « Kg » : la ligne montre « 0 → 2 Kg ». « Confirmer » écrit l'article neuf `Sucre candi`, 2 kg. **Oui, entre au stock.** (A1)
4. Dans l'autre ordre (« Kg » d'abord, quantité ensuite) : même écriture. (A2)
5. Piège mesuré (A3) : s'il tape la quantité SEULE, l'écran déduit « pièce » du prix (2 × 2,95 = 5,90), en jaune, et « Confirmer » enregistre l'article en `Stk` (2 Stk) sans autre geste. Voulu par D277, mais une quantité de kilos devient des pièces si le brasseur ne touche pas « Kg ».
Preuves : tests A0, A1, A2, A3.

## Cas B — l'article du même nom existe au stock (« Malt Pilsner », kg, 10 kg), ligne « Malt Pilsner » 36,00
- **B1 (ni quantité ni unité lues)** : la lecture propose « Malt Pilsner bis » (nouvel article, jaune) et ne relie pas. Il tape 25 puis « Kg » : la ligne reste « nouvel article » (« à créer à la confirmation »), elle ne se relie pas toute seule. « Confirmer » est refusé : « Malt Pilsner : cet article existe déjà (« Malt Pilsner ») : relie la ligne à cet article. » Il doit toucher la sortie « Relier à Malt Pilsner » (radio du face à face Facture | Stock) : la ligne montre « 10 → 35 Kg », « Confirmer » ajoute 25 kg à l'article existant. **Oui si… il touche « Relier ».**
- **B2 (unité « kg » lue, quantité absente)** : même état que B1 (bis, non relié) ; il tape 25 : refus identique ; « Relier » ajoute 25 kg.
- **B3 (quantité 25 lue, unité absente)** : la ligne est reliée d'office, en jaune « article « Malt Pilsner » · proposé · unité à préciser ». Avant l'unité, « Confirmer » refuse (« unité à préciser »). Il touche « Kg » : « 10 → 35 Kg », « Confirmer » ajoute 25 kg SANS toucher « Garder ». **Oui, tout seul.**
Preuves : tests B1, B2, B3.
Défaut exact (B1, B2) : « Taper la quantité et l'unité d'une ligne `nouvel article` qui a le même nom qu'un article du stock ne la relie pas à cet article ; la ligne reste « à créer » et `Confirmer` la refuse avec « cet article existe déjà … relie la ligne à cet article », jusqu'à ce que le brasseur choisisse « Relier à … ». » Cause : le lien se calcule à la lecture (`lignesDeLecture`, finale.ts) et à la traduction (ExpenseSheet l. 354-365, qui exclut les lignes dont quantité ou unité ont été retouchées, `lectureLigne.current.get(l.id)!==…`) ; il n'est jamais recalculé quand le brasseur tape.

## Cas C — une ligne restée hors stock (`none`)
- **C0** : deux articles « Citra 12.5% » et « Citra 13.0% » au stock, ligne « Citra » 100 g : ligne « article — · hors stock », « plusieurs articles « Citra 12.5% » : choisis ⇄ ». Sans geste, « Confirmer » enregistre la dépense SANS stock et SANS alerte (le seul signe est le message sur la ligne).
- **C1** : ⇄ « Choisir un autre article », puis « Article » → « Citra 12.5% » (liste) : relié, « 10 → 110 g ». « Confirmer » ajoute 100 g. **Oui si… il choisit l'article.**
- **C2** : « Suivre au stock » sur cette ligne ambiguë : ouvre le face à face, la ligne devient un NOUVEL article « Citra » (à côté de « Citra 12.5% »), et « Confirmer » le crée (100 g) sans alerte. Un nouvel article de plus, pas un ajout au stock existant : à ne pas prendre pour la réparation. (Mesure, sans jugement.)
- **C3** : une ligne lue « autre » (Sucre candi, 1 kg) : « article — · hors stock ». Le segment « Ingrédient » seul ne la fait PAS entrer au stock (la ligne reste `none`, « Confirmer » l'enregistre sans stock) ; le bouton « Suivre au stock », qui apparaît ensuite, est le second geste obligatoire : il crée « Sucre candi », « 0 → 1 Kg ».
Preuves : tests C0, C1, C2, C3.
Défaut exact (C3) : « Changer le type d'achat en « Ingrédient » ne fait pas entrer la ligne au stock ; il faut en plus toucher « Suivre au stock », et « Confirmer » ne signale pas qu'une ligne ingrédient reste hors stock. » Même remarque pour C0.

## Critères
- `npx vitest run tests/unit/depense/d381/stock-repare.test.tsx` → 1 fichier, 11 tests, tous verts (A écrit bien le stock).
- `git status --short` : mon seul fichier suivi est `tests/unit/depense/d381/stock-repare.test.tsx` (neuf) ; le reste du statut vient des autres voies.
Essais utilisés : une série de sondes, puis le fichier final, deux corrections de test (clics sur « Suivre au stock » par `[data-dp-suivre]`, enveloppe `act`).

## Doutes et limites
- Le dépôt est une réplique de `savePurchase`, pas `savePurchase` lui-même (Firestore, Dexie et Drive simulés). Les validations, l'article neuf et la conversion de quantité sont les vraies fonctions ; l'écriture `adjustNumber` n'est pas exercée.
- `zxing-wasm` n'est pas installé dans ce poste : `tests/unit/depense/lecture-d/ecran.test.tsx` échoue à l'import (« Failed to resolve import zxing-wasm/reader »). Mon test contourne par un mock de `qrLecture`. À signaler au pilote : les autres tests d'`ExpenseSheet` ne tournent pas ici sans ce paquet.
- Le gestes ont été joués en jsdom (clics, saisie), pas dans Chrome ; aucune capture. Ce n'est pas une revue visuelle.
- Les phrases des défauts décrivent le comportement mesuré ; le jugement (défaut ou choix) revient au pilote.

DÉCISION À PRENDRE : B1/B2 — faut-il qu'une ligne « nouvel article » dont la quantité et l'unité viennent d'être tapées se relie d'elle-même à l'article de même nom (comme B3) ? Options : (1) laisser tel quel (le refus dit quoi faire) ; (2) recalculer le lien quand quantité et unité sont retouchées, si le cas est « même produit » ; (3) à défaut, remplacer le message par un bouton « Relier à Malt Pilsner » dans l'alerte. Recommandation : (2), sur les lignes `neufDOffice` intactes, puisque la voie précédente a déjà ce mécanisme pour le nom français (ExpenseSheet l. 354-365). Changement de l'app, hors de cette voie.

CONNAISSANCE : à la lecture, quantité lue + unité absente = ligne reliée d'office ; quantité absente = « bis » non relié, même si l'unité est lue. Taper ne relie jamais. L'écran déduit une unité du prix quand la quantité est tapée (« pièce » pour 2 × 2,95).

LEÇON PROPOSÉE : aucune
