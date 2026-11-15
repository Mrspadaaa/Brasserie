OK — e4a à e4d rhabillées à l'identité de l'app, 17 images refaites, IDENTITE OK 4/4

## Variantes
- [x] e4a : en-tête, sous-onglets et barre du bas de l'app ; fiche en feuille (poignée, rayon 24) ; rail et cases en teintes hop / water ; curseur m2 de la trousse ; jauge ebc-gold ; retour en seconde feuille · écart restant : la carte Tirage est plus dense que la fiche Mesures de l'app (5 blocs dans un panneau) ; mono « 6 × 33 cl » espacé.
- [x] e4b : pastille d'étape dans l'en-tête de la feuille ; cuve en capsule, bière ebc-gold vers ebc-amber ; barre fixe devenue le pied de la feuille ; à 1280, une colonne dans la feuille de 42 rem ; retour en seconde feuille · écart restant : la scène cuve et caisse dépasse la hauteur de la feuille à 390 (défilement jusqu'au dernier tirage), et la fiche Stout derrière la confirmation est floutée.
- [x] e4c : rail découpé par marche (aligné), palet à la couleur de l'action (noir en clair, paille en cave), marches en teintes water / ebc-gold / ebc-stout, confirmation dans la marche · écart restant : l'échelle à 5 marches reste un composant propre à la variante (l'app n'a pas d'équivalent) ; le geste n'a plus la cible pointillée sur F3 libre (retirée pour suivre la v0).
- [x] e4d : la couleur de la bière en teinte EBC sur le corps de la feuille (ebc-gold, Stout ebc-stout / ebc-brown) ; titres en casse normale ; rouleaux mono 28 ; tampon en alert ; menu ⋯ dans l'en-tête ; Tamponner au pied · écart restant : le corps teinté distingue la feuille des feuilles neutres de l'app (choix de l'idée) ; les festons du bon sont un ornement propre à la variante.

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e4/e4a/etat.html`, `e4b/etat.html`, `e4c/etat.html`, `e4d/etat.html` (réécrits sur la trousse, classes préfixées)
- `e4a/NOTE.md` à `e4d/NOTE.md` : section « Rhabillage re4 » ajoutée
- PNG de chaque variante, régénérés par `voies/e4/capture.mjs` (mêmes noms) : 4 par variante, plus `e4b-repos-1280-clair.png`
- `voies/re4/tests.txt` (sortie des CHECK), ce RESULTAT.md

## Critères (sortie décisive, `tests.txt`)
- G1 : `IDENTITE OK 4/4`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`). `type="number"` : 0 dans les 4 pages.

## Captures (toutes dans `work/missions/2026-11-14-brassins/voies/e4/<id>/`)
- e4a : repos-390-clair, geste-390-clair, retour-390-clair, repos-390-cave (ouvertes)
- e4b : repos-390-clair, geste-390-clair, retour-390-clair, repos-390-cave, repos-1280-clair (ouvertes)
- e4c : repos-390-clair, geste-390-clair, retour-390-clair, repos-390-cave (ouvertes ; geste et retour refaits après deux retouches mineures, cible du geste retirée et boutons sur une ligne, pas rouverts : hook de 200 k)
- e4d : repos-390-clair, geste-390-clair, retour-390-clair, repos-390-cave (ouvertes)
- Comparaison avec l'app (`a1-banc/captures/fiche-fermentation-390-clair.png`) : même feuille (poignée, titre 14/600 et sous-titre gris, ×, liste floutée dessous), mêmes boutons et pastilles ; l'écart restant, ligne par variante ci-dessus.
- Le plan de `capture.mjs` ne prévoit 1280 et la cave au geste et au retour que pour e4b : non ajoutés, pour garder les mêmes noms.

## Prédiction
« Là oui, ça ressemble à l'app » ; il jugera encore la densité de e4a et e4b et choisira sur l'idée.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : une maquette de fiche se rhabille en feuille de la trousse sur la liste floutée ; deux feuilles empilées demandent `.id-voile:has(+ .x)` (z-index, et masqué hors de l'état) ; un rail vertical d'étapes s'aligne en le découpant par ligne de marche plutôt qu'en positions absolues.
LEÇON PROPOSÉE : aucune
