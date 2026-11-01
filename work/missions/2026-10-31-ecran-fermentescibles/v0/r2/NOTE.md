# r2 — une règle pour tous les grains (v0, Malts/sucres 2/7, 31.10)

- **Chaleur** : tiède (la forme de l'approche : curseur tapable, barre de composition, pastille).
- **Axes** : A1 (b) barre de composition du grain au-dessus de ses lignes ; A2 (b) masse en curseur tapable, comme r4-a ; A3 (b + c) champ au bout de la liste, famille qui tourne comme dans l'app, habituels ; A4 (b) pastille « ? ».
- **L'idée** : chaque masse est un curseur r4-a sur une même règle en kg ; les longueurs se comparent d'un coup d'œil, et la barre du haut compose le grain en teintes.

## Ce qui tient
- Langue r4-a reprise : grande lecture tapable soulignée de points, piste remplie, pouce noir, graduations ; la masse se glisse ou se tape.
- La barre dit l'honnêteté sans mot : hachurée tant que la couleur manque, teintée segment par segment quand il la saisit ; le dextrose en pointillé.
- Mode ample (≤ 4 lignes : curseurs de 38 px, lecture de 28 px) et serré (8 lignes à 1,03 écran).

## Ce qui casse
- La règle commune (0–6 kg) écrase les petites doses : 0,3 kg de Carapils = 5 % de la piste. Le curseur au pas de 0,05 kg y est fin ; la saisie reste.
- Deux lignes par ingrédient : le moment passe à droite de la piste.

## Acquis de la baseline
- [x] Éléments communs repris de r4-a (en-tête « ‹ Fermentescibles 2/7 », import, thème ; fil ; bandeau ; pied « Retour · Suivant — Houblons » ; +).
- [x] Ligne : nom, moment, part, masse ; 5 familles (la pastille « Grain ⇄ » tourne, comme `CycleTag`) ; famille figée (étiquette) ; masse à 0 à l'ajout ; J+3 en fermentation ; avertissements lactose et densité (annexe, `#huit`) ; clavier nom, Entrée, masse, Entrée.

## Honnêteté des données
- Sa recette telle que l'app l'affiche ; couleurs « ? » ; EBC « — » ; `#couleurs` → 7,3 EBC (Morey, 30 L) ; `#sucre` + dextrose 0,4 kg à l'ébullition. Rendement « 75 % repère », replié. Stock de démonstration, noms seuls.

## Contrôles (31.10)
- PAGE OK ; 65 mots, MOTS OK ; CONTRASTE OK (pire 4,85:1) ; `type="number"` : 0.
- `controle-commun --profil=sans-houblons` : tout OK sauf **couleurs ECHEC** (1 teinte franche) : même écart voulu que r1 (aucune couleur connue dans sa recette ; voir `r2-sucre.png`).
- `capturer.mjs` : 8 grains à 1,03 écran, gestes sans erreur. Panel : `../r-serie/RESULTAT.md`.

## Captures (ouvertes)
`r2-haut.png`, `r2-page.png`, `r2-couleurs.png`, `r2-sucre.png`, `r2-vide.png`, `r2-huit.png`, `r2-geste-teinte.png`, `r2-geste-saisie.png`, `r2-geste-ajout.png`, `r2-ordinateur.png`.

## Boosters UX (boosters-ux)
- curseur-masse — ajuster ; input range sur la règle commune, cran 0,05/0,1 kg ; lecture, part et barre suivent sans reconstruire la ligne.
- barre-composition — lire et comparer ; un segment par ingrédient, largeur = masse, teinte ou hachure.
- teinte-pastille, moment-cycle, familles, ajout-clavier, puces-habituels — comme r1.
- B1 OK · B2 OK (les curseurs) · B3 OK (65 mots) · B4 OK · B5 non mesuré · B6 OK (12, 14, 16 ; lectures en champ) · B7 OK · B8 OK (vide : barre vide, sans avertissement) · B9 OK (pouce agrandi sous le doigt, transitions de 200 ms, mouvement réduit) · B10 OK · B11 « Le Pilsner fait l'essentiel, trois couleurs manquent. » · B12 OK · B13 OK.
