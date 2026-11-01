# z6 — La ligne (série z, créative à fond)

- **Chaleur** : chaude. Forme libre : les décisions sont des stations sur une ligne.
- **Axes** : A1 (stepper vertical, pas un formulaire), A2 (mini-barre 24/30 + branche), A3 (plages à la station style), A4 (saisie sur place, mini-barre 0–90), A5 (station NOLO : vide = non, violette = oui), A6 (dernière station tiretée « Coller une recette »).
- **Idée, en une phrase** : une ligne verte descend l'écran ; chaque décision y est une station (nom, style, 24 L, 60 min, NOLO, matériel), sa conséquence est une branche en dessous ; station pleine = décidée, cerclée = non (NOLO), tiretée = pas encore faite (coller une recette).

## Acquis de la baseline (J5, J12)
- [x] en-tête, fil des 7 étapes, bandeau : tels quels
- [x] nom, style, volume, ébullition, NOLO, état du fermenteur au premier écran ; aucune phrase explicative
- [x] import dans le corps (A6, en station)
- [x] saisie sans `type="number"` (0)

## Honnêteté (J7)
- Recette neuve : stations tiretées (inconnu), jamais un zéro ni une station pleine. « ~ » sur 3 L, 27 L, 20 % ; conseil dit « conseil ». Plages du catalogue ; FG/alc. sans repère ; EBC hors bande en ambre.
- NOLO non → touché : station violette « NOLO ≤ 0,5 % » (`z6-nolo.png`).

## Boosters UX (boosters-ux)
- Boosters : `ligne-decisions` — suivre (ce qui est décidé, ce qui reste). `pastille-style` — choisir. `plages-au-style` — lire. `branche-fermenteur` — lire si ça tient. `station-nolo` — choisir. `coller-recette` — déclencher.
- B1 OK — 6 boosters ; avant/après : `z6-haut.png` / `z6-nolo.png`.
- B2 OK — dominante : la ligne verte et ses stations ; un seul `primary`.
- B3 OK — 67 mots (MOTS OK) ; HAUTEUR OK (1,00).
- B4 OK — une station = un groupe ; un seul bord gauche pour les valeurs, un second pour les branches.
- B5 à mesurer — stations de 74 px ; R2 non mesuré.
- B6 OK — 12/14/16 px ; mono.
- B7 OK — CONTRASTE OK (pire 5,3:1) ; COULEURS OK ; STANDARD OK.
- B8 à dessiner — c'est l'idée même : vide = station tiretée ; erreur = station rouge avec la cause en branche ; lecture seule = ligne grise.
- B9 OK — la station NOLO répond.
- B10 OK.
- B11 — phrase attendue : « cinq décisions prises, NOLO non, une recette à coller si je veux ».
- B12 OK — mêmes pilules, chevron, rayons.
- B13 OK — stations ≥ 60 px de haut, champs 30 px, pilule 30.
- Écarts voulus : les champs sans cadre (trait sous la valeur) s'éloignent du champ 32 px bordé de DESIGN.md — pour que la ligne reste la seule structure ; contrôles houblons sautés.

## Tient / casse
- Tient : on voit d'un coup d'œil ce qui est décidé et ce qui manque ; la conséquence suit sa cause.
- Casse : une ligne de plus sous le fil des 7 étapes (deux « progressions » à l'écran) ; la station NOLO cerclée peut se lire « à faire » au lieu de « non ».

## Contrôles joués
PAGE OK · MOTS OK (67) · PANEL OK (lot) · COMMUN OK (`--sans=mots,fiche,trait,legende,au-style`) · CONTRASTE OK · HAUTEUR OK · `type="number"` : 0.
Captures : `z6-haut.png`, `z6-page.png`, `z6-nolo.png`.
