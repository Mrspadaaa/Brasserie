OK — fiche gfc portée et branchée (390, 1280, clair, cave), 10 tests, inventaire ; G4 hors voie : ProductionTab.tsx (q2)

## Fichiers écrits
`src/ui/production/fermentation/{modele.ts,GrapheTemps.tsx,FicheFermentation.tsx}` ; `src/ui/BatchDetailSheet.tsx` (branche fermentation, rubrique Mesures : `ficheM`, `<details>` « Corriger les mesures », `PiedFermentation`, feuille élargie `lg:!max-w-6xl` seulement avec la fiche) ; `tests/unit/port-q1-modele.test.ts` ; dans la voie : `INVENTAIRE.md`, `banc.mjs`, `captures/` (21 PNG), `journal.json`, `tests.txt`, `banc-sortie.txt`.

## Critères
- G1 : `TSC OK`.
- G2 : `TESTS OK` (10 verts, `tests.txt`).
- G3 : `CAPTURES OK` (INVENTAIRE.md écrit ; 21 captures : repos, repos-bas, geste-confirmation, geste, fait, mesurer, mesurer-taper, mesurer-erreur, apres-releve, acces-stock, acces-carnet ; 390 clair, + cave et 1280 au repos, geste, mesurer).
- G4 : `HORS ? src/components/tabs/ProductionTab.tsx` : fichier modifié par une autre voie (q2 la liste), pas par q1 (je n'y ai jamais écrit ; il n'est pas dans mon OWNS réel). À régler par le pilote (ajouter à l'OWNS de q2 / G4).
- Banc : `BANC OK 21 captures`, `gestesSansEffet` 0, `console` 0, `erreursPage` 0.

## Captures ouvertes à côté de la maquette (repos 390 clair, geste 390 clair, repos 390 cave, repos 1280 clair, + mesurer, taper, erreur, après relevé, fait, accès stock)
Écarts numérotés et leur sort :
1. Jeton `--ebc-gold` absent : losange, nœud, fils noirs. CORRIGÉ (repli à la valeur de la maquette) ; fils or revus en capture.
2. Dates des tâches « J+7 · 17 » : CORRIGÉ « 17.11 ».
3. Liseré de Citra orange (tropicaux) au lieu de jaune (agrumes) : CORRIGÉ (`modele.ts` : 1re barre, sauf une famille plus rare ≥ 85 % et moins citée que la 1re ; Mosaic = baies, Citra = agrumes) ; revu en capture.
4. °C au relevé aplati et étiquette « 19,6 » sur le libellé : l'échelle comptait la garde à 2 °C. CORRIGÉ (consignes chaudes seules) ; revu.
5. Avertissement React « two children with the same key » (`pt${i}` points et phases) : CORRIGÉ (`phl${i}`), console 0.
6. 1280 : graphe écrasé à 220 px, tâches en colonnes étroites (feuille de 672 px, mise en page de 1280). CORRIGÉ (feuille `lg:!max-w-6xl` avec la fiche) ; revu : graphe à gauche, cartes à droite, comme gfc.
7. Curseur de Mesurer : graduations « 1 » et « 1,01 / 1,014 » superposées. CORRIGÉ (bornes seules en 3 décimales ; la bande visée reste dessinée et dite dessous) ; revu.
8. Étiquettes 1,018 et 1,016 voisines superposées après un relevé le jour même. CORRIGÉ (étiquette du dernier relevé au-dessus à droite quand le précédent est voisin) ; revu (lisible, la ligne coupe un peu « 1,018 »).
9. Banc : fixture à grain « mash » refusait le déstockage, saisie tapée devant la valeur. CORRIGÉ dans `banc.mjs` ; le geste « Ajouté auj. » aboutit : « Dry hop ajouté », « −100 g au stock », fils verts.
Restent (voulus, ACCORD ci-dessous) : tâches sans case ; « °C au relevé » ; pas de toast « Annuler » ; « Citra ajouté, Mosaic demain » impossible ; alcool 5,9 % (dépôt) contre 5,8 % ; accès carnet · stock · dossier dans le corps ; police de la maquette (Source Sans) non reprise, celle de l'app s'applique ; jours/dates décalés d'un jour (le banc lève à J+5 = 10.11).
Non rejoués après les derniers correctifs : cave et 1280 du geste et de mesurer (même code que les vues ouvertes) ; acces-carnet, fait en 1280.

## Tests existants
`tests/integration/batch` : 65 verts, 2 rouges (`batchFollowUp` « preserves a legacy actual date… », `batchAm4Am5` « fermentation : jamais Planifié… ») : ils ouvrent le Dossier de q3 (libellés changés), pas ma rubrique.

DÉCISION À PRENDRE : ajouter à `Sheet.tsx` (hors Possède) un slot optionnel `actions` à côté du × pour carnet · stock · dossier comme dans gfc. Options : (a) oui, 3 lignes ; (b) garder les trois boutons dans le corps, à droite du titre-réponse (état actuel). Recommandation : (a).
DÉCISION À PRENDRE (q3) : adapter `batchFollowUp` et `batchAm4Am5` au Dossier de q3.
DÉCISION À PRENDRE (pilote) : G4 signale `src/components/tabs/ProductionTab.tsx` (q2).

ACCORD : tâches sans case ; « °C cuve » → « °C au relevé » ; « Ajouté auj. » déstocke tous les ajouts réservés avec la confirmation existante (pas de « Annuler ») ; α du lot = α de la recette (« — » si absent), plage = catalogue ; jour du dry hop = `dayOffset` ; date de l'ajout lue dans les mouvements `BREW-STOCK-<lot>-remaining-…` (rien si absents) ; « Pas d'ajout réservé au stock pour ce houblon » quand rien n'est réservé ; liseré = règle de `modele.ts` l.91.

Essais : G1 à G4 un essai chacun ; banc rejoué 6 fois (reprise comprise).
CONNAISSANCE : `--ebc-gold` n'existe pas dans `src/theme/themes.css` (seulement `--ebc-gold-texte`) : un `rgb(var(--ebc-gold))` copié de la maquette rend noir sans erreur. Une feuille `lg:max-w-xl`/`md:max-w-2xl` ne tient pas une mise en page 1280 à deux colonnes : la largeur suit la fiche.
LEÇON PROPOSÉE : aucune
