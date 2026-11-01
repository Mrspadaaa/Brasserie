# r4 — on pèse comme à la balance (v0, Malts/sucres 2/7, 31.10)

- **Chaleur** : chaude (forme libre).
- **Axes** : A2 (un seul instrument : le plateau, grande lecture tapable et règle qui défile sous une aiguille) ; A1 (le ticket de pesée, une barre de part par grain) ; A3 (b + c : le nom, Entrée, la ligne arrive sur le plateau à 0) ; A4 (b) pastille « ? ».
- **L'idée** : la recette se lit comme un ticket de balance ; la ligne choisie est sur le plateau, sous le pouce : on fait défiler la règle ou on tape la lecture, et un ajout arrive sur le plateau à 0, en or.

## Ce qui tient
- Un seul réglage à la fois, à portée du pouce, avec une lecture de 48 à 56 px : la masse à 0 de l'ajout devient un geste de brasseur (« je pèse »).
- Le ticket reste calme : masses alignées à droite en mono, parts, barres teintées ou hachurées.
- Clavier : nom, Entrée, la lecture du plateau prend le focus, masse, Entrée, retour au champ.

## Ce qui casse
- Le plateau noir est la masse dominante : une seule ligne s'y règle, il faut toucher le ticket pour changer.
- La règle défile à 120 px par kg : 0,05 kg = 6 px, fin au doigt ; les boutons − + et la saisie complètent.

## Acquis de la baseline
- [x] Éléments communs repris de r4-a. [x] Ligne : nom, moment, part, masse (dans le ticket ; moment réglable sur le plateau) ; 5 familles (« Grain ⇄ ») ; famille figée ; masse à 0 à l'ajout ; J+3 en fermentation (sur le plateau) ; avertissements lactose et densité ; clavier nom, Entrée, masse, Entrée.

## Honnêteté des données
- Sa recette ; couleurs « ? » ; EBC « — » ; `#couleurs` → 7,3 EBC ; `#sucre` + dextrose 0,4 kg à l'ébullition, sur le plateau. Rendement « 75 % repère ». Stock de démonstration.

## Contrôles (31.10)
- PAGE OK ; 69 mots, MOTS OK ; CONTRASTE OK ; `type="number"` : 0.
- `controle-commun --profil=sans-houblons` : tout OK sauf **couleurs ECHEC** (écart voulu, comme r1 ; l'or de l'aiguille compte comme la même teinte que l'ocre).
- `capturer.mjs` : 8 grains à 1,01 écran. Panel : `../r-serie/RESULTAT.md`.

## Captures (ouvertes)
`r4-haut.png`, `r4-page.png`, `r4-couleurs.png`, `r4-sucre.png`, `r4-vide.png`, `r4-huit.png`, `r4-geste-teinte.png`, `r4-geste-saisie.png`, `r4-geste-ajout.png`, `r4-ordinateur.png`.

## Boosters UX (boosters-ux)
- balance, regle-defilante — ajuster ; glisser horizontal (pointer capture), cran 0,05/0,1 kg, aiguille fixe ; lecture tapable, − + ; ticket, bandeau et barre suivent.
- ticket-selection — choisir ; toucher une ligne la pose sur le plateau.
- teinte-pastille, moment-cycle, familles, ajout-clavier, puces-habituels — comme r1.
- B1 OK · B2 OK (le plateau) · B3 OK (69 mots) · B4 OK · B5 non mesuré · B6 OK (12, 14, 16 ; lecture en champ) · B7 OK (texte blanc sur #111) · B8 OK (vide : plateau masqué, « Rien encore. ») · B9 partiel · B10 OK · B11 « Je pèse le Pilsner : 5 kg ; trois couleurs à dire. » · B12 OK · B13 OK.
