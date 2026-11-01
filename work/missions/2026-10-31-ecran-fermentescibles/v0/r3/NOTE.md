# r3 — la colonne de grain se remplit (v0, Malts/sucres 2/7, 31.10)

- **Chaleur** : chaude (forme libre).
- **Axes** : A1 (forme neuve : une pile verticale graduée en kg, une couche par ingrédient) ; A2 (glisser la couche vers le haut ou le bas ; la masse se tape aussi) ; A3 (l'ajout vit dans le vide de la colonne) ; A4 (c) la teinte de la bière se compose dans un verre au sommet.
- **L'idée** : le grain est une colonne qui se remplit ; chaque couche a la hauteur de sa masse et la teinte de son malt, et le verre du haut prend la couleur de la bière, « ? » tant qu'une couleur manque.

## Ce qui tient
- « Quel matière première j'ai » se voit avant de se lire : le Pilsner est le socle, l'avoine et le froment au-dessus, le sucre en pointillé.
- Le vide au-dessus de la pile accueille l'ajout : on remplit la cuve.
- L'inconnu reste visible : couches hachurées, verre hachuré « ? » ; il dore couche par couche (`r3-geste-ajout.png`, `r3-sucre.png`).

## Ce qui casse
- Les étiquettes suivent le milieu de leur couche ; avec des couches minces, elles s'écartent et les liens se courbent (lisible à 8, `r3-huit.png`, mais moins direct).
- Le glisser vertical sur une colonne de 88 px demande de la précision ; la saisie reste le geste sûr.
- La règle va jusqu'à 12 kg pour une recette de 8 : l'échelle s'étend avec la recette.

## Acquis de la baseline
- [x] Éléments communs repris de r4-a. [x] Ligne : nom, moment, part, masse ; 5 familles (« Grain ⇄ ») ; famille figée ; masse à 0 à l'ajout ; J+3 en fermentation ; avertissements lactose et densité ; clavier nom, Entrée, masse, Entrée.

## Honnêteté des données
- Sa recette ; couleurs « ? » ; EBC « — » ; verre hachuré « ? » (rien de peint qui ne soit calculé) ; `#couleurs` → 7,3 EBC ; `#sucre` + dextrose. Rendement « 75 % repère ». Stock de démonstration.

## Contrôles (31.10)
- PAGE OK ; 64 mots, MOTS OK ; CONTRASTE OK (« ? » du verre passé à #333 après un 3,69:1) ; `type="number"` : 0.
- `controle-commun --profil=sans-houblons` : tout OK sauf **couleurs ECHEC** (écart voulu, comme r1).
- `capturer.mjs` : 8 grains à 0,96 écran. Panel : `../r-serie/RESULTAT.md`.

## Captures (ouvertes)
`r3-haut.png`, `r3-page.png`, `r3-couleurs.png`, `r3-sucre.png`, `r3-vide.png`, `r3-huit.png`, `r3-geste-teinte.png`, `r3-geste-saisie.png`, `r3-geste-ajout.png`, `r3-ordinateur.png`.

## Boosters UX (boosters-ux)
- colonne-masse — ajuster et lire ; glisser une couche (pointer capture), cran 0,05/0,1 kg ; la pile, la règle et les étiquettes suivent.
- teinte-biere — lire ; verre teinté par l'EBC calculé, hachuré « ? » sinon.
- teinte-pastille, moment-cycle, familles, ajout-clavier, puces-habituels — comme r1.
- B1 OK · B2 OK (la colonne domine) · B3 OK (64 mots) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (vide : colonne vide ; annexe : quatre colonnes en miniature) · B9 partiel (couche active cernée, transitions 150 ms ; pas de retour haptique) · B10 OK · B11 « Surtout du Pilsner, la couleur reste à dire. » · B12 OK · B13 OK (étiquettes ≥ 24 px ; la couche mince se règle par la saisie).
