# Voie g5-tests — retirer les tests inutiles (son accord du 02.11, soir)

Agent : `auteur` (Sonnet). Plafond : 80 tours. Part **après** g2a et g2b (elles écrivent dans `tests/unit/depense/`).

## Pourquoi
Ses mots (SPEC-BRASSEUR, 02.11 soir) : « Tu as fait des milliers de test, et en 2min j'ai trouvé une dizaine de problème flagrant.... » ;
« Est ce que tu utilises les bon outil pour tester ? Et tu fais pas trop de test inutile ?? » ; puis son accord : « Non enlève les test inutiles on
a bien vu que ça servait à rien et trouvais pas les vrais problèmes... ». Décision D339 : Vitest pour la logique et l'état, un test par règle ; le
visible se prouve dans Chrome.

## Ce qu'il faut faire
1. Inventaire des tests de la Dépense et des finances (`tests/unit/depense/**`, `tests/unit/**` qui touchent `src/ui/finance/`, `src/ui/depense/`,
   `src/lib/finance*`, `src/lib/invoice*`, `functions/src/invoice*` ; liste exacte par `grep` des imports). Pour chaque `it` / `test`, une classe :
   - **garder** : il prouve une règle du métier ou un état (somme, TVA, arrondi, niveaux D277, unité déduite, stock, mouvement, rapprochement,
     doublon, hors ligne, synchronisation, ordre, file de validation, pliage), ou il a déjà attrapé un vrai défaut (son nom ou un D-n le dit) ;
   - **inutile, doublon** : la même règle déjà prouvée par un autre test, même entrée au sens près ;
   - **inutile, vert par construction** : il vérifie qu'un rendu jsdom contient une classe CSS, un `data-*`, un libellé, ou le texte qu'on vient
     d'écrire, sans règle derrière ; ou il recopie la sortie de la fonction comme valeur attendue (instantané de l'implémentation) ;
   - **inutile, caduc** : il garde un écran, un format ou un chemin qui n'existe plus (déjà `skip`, ou il teste un composant retiré).
2. Retire les `it` des trois classes « inutile » ; un fichier vidé est retiré. Rien d'autre ne change dans `src/`. Un test qui **échoue** n'est
   jamais retiré : c'est un constat, il va au pilote.
3. Le reste de la suite passe : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit"` (comparer avec la
   même commande avant tout retrait : même liste d'échecs, rien de plus) ; tsc vert.
4. La couverture des règles ne baisse pas : pour chaque fichier de `src/` touché par un test retiré, dire quel test gardé prouve encore sa règle.

## Possède
Les fichiers de tests listés en (1), `work/missions/2026-10-31-ecran-depense/voies/g5-tests/**`. Interdits : `src/**`, `functions/src/**`,
`scripts/**`, les tests d'intégration du banc Chrome, `tests/unit/depense/g2a/**`, `tests/unit/depense/g2b/**`.

## Critères (le pilote les rejoue)
1. `INVENTAIRE.md` : par fichier, le nombre de tests gardés et retirés, la classe et la raison en une ligne pour chaque retrait.
2. Suite avant et après : mêmes échecs, aucun nouveau ; tsc vert.
3. `git status --short` : seulement des tests retirés ou allégés, et `voies/g5-tests/**`.

## Rendre
`voies/g5-tests/RESULTAT.md`, puis une ligne `G5 OK — <n> tests retirés sur <n>, <n> fichiers` ou `G5 ECHEC — …`.
