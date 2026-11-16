OK — volumes de e7a à e7d, e5b et e5d alignés sur DONNEES-COMMUNES, 22 images refaites

## Variantes touchées
- [x] e7a : Volume 3/4 → 4/4 (24 L pile partout) ; cuve → bouteille 55,5 → 51,9 L (93,5 %) devient 48 → 42,9 L (89,4 %) ; Stout 31,5 → 29,9 L devient 24 → 21,9 L ; Saison 24 → 22 L devient 24 → 21 L ; 102,5 L brassés → 96 L ; mois oct. 54,5 → 48 L (barres rééchelonnées) ; légende « en bouteille » → « conditionné ».
- [x] e7b : geste « Volume : seule la Pils est courte » → « Volume : les 4 pile à 24 L » (pastilles « 4 sur 4 dans la cible », « Pils · alcool −0,4 ») ; points Pils et Stout à 0 L d'écart (étiquette Pils à gauche pour ne pas couvrir la NEIPA) ; jauge Volume 3/4 → 4/4 ; tuiles 102,5 L / 93,5 % / 47 L → 96 L / 89,4 % conditionnés / 48 L.
- [x] e7c : colonne Volume (Pils 23/25 L, Stout 31,5/32 L) → 24 L pile ×4, 4/4 ; titre « 1 sur 4 sous la cible » → « 4 sur 4 dans la cible » ; totaux 102,5 / 51,9 (93,5 %) / 47 L → 96 / 42,9 (89,4 %) / 48 L ; oct. 54,5 → 48 L, barre Pils pleine largeur, parts conditionnées Stout 91 %, Saison 87,5 %.
- [x] e7d : cuves Pils 23/25 → 24/24, Stout 31,5/32 (29,9) → 24/24 (21,9), Saison 22 → 21 conditionnés ; titre « Seule la Pils est courte. » → « Les 4 cuves pile à 24 L. » ; dock Volume 4/4 ; oct. 48 L.
- [x] e5b : recettes Pils 25 L et Stout 30 L → 24 L (NOTE corrigée).
- [x] e5d : idem e5b.
- NOTE.md des quatre e7 : clause des volumes fictifs remplacée, ligne « Retouches f4 » ajoutée.

## Critères (tests.txt)
- G1 : VOLUMES OK · G2 : IMAGES OK · G3 : HORS OK. Aucune suite Vitest (rien dans src/).
- Balayage complémentaire de e1 à e11 (hors e10) : plus aucun volume hors 24, 22, 21,9, 21, 20, 12, 9,9, 30, 2 L, sauf e4 (10 L, 21,98 L : hors Possède, non touché) et e1 « 1,5 L » (hors Possède).

## Captures (toutes ouvertes)
- e7 : `work/missions/2026-11-14-brassins/voies/e7/e7a/e7a-{repos,geste}-390-clair.png`, `…/e7b/e7b-{repos,geste}-390-clair.png`, `…/e7c/e7c-{repos,geste}-390-clair.png`, `…/e7c/e7c-repos-390-cave.png`, `…/e7c/e7c-repos-1280-clair.png`, `…/e7d/e7d-{repos,geste}-390-clair.png`.
- e5 : `work/missions/2026-11-14-brassins/voies/e5/e5b/e5b-{repos,geste,vide}-390-clair.png`, `…/e5d/e5d-{repos,geste,vide}-390-clair.png`.

Prédiction : « Là au moins les litres tiennent dans mes cuves » ; en revanche, le bilan Volume perd son intérêt (tout est pile).

DÉCISION À PRENDRE : VOIE.md dit « 5 brassins × 24 L = 120 L brassés » ; la Pale Ale n'est que prévue (« hors bilan » dans e7), j'ai donc mis 96 L (4 brassins brassés). Si le pilote veut compter le prévu, 120 L. Par ailleurs, Volume 4/4 rend la mesure « Volume » sans écart dans e7 : la réponse affichée par défaut (repos de e7d, geste de e7b) n'a plus de contraste ; une passe pourrait choisir FG ou OG comme mesure ouverte par défaut.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
