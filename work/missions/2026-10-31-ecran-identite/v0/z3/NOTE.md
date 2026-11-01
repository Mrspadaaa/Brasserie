# z3 — Bento (série z, créative à fond)

- **Chaleur** : tiède. La forme de la série : la forme libre, osée, baseline suivie.
- **Axes** : A1 (carte « bière » dense), A2 (fermenteur en cases de 3 L, conseil en case tiretée), A3 (plages dans la tuile du style), A4 (grands chiffres saisis sur place, pas de 15 min), A5 (pilule NOLO), A6 (tuile d'import tiretée).
- **Idée, en une phrase** : chaque décision est une tuile colorée d'un bento — style ambre, volume vert, ébullition bleu, NOLO violet — avec son grand chiffre, sa petite représentation et ses conséquences ; on touche la tuile pour changer la valeur sur place.

## Acquis de la baseline (J5, J12)
- [x] en-tête, fil des 7 étapes, bandeau : tels quels
- [x] nom, style, volume, ébullition, NOLO, état du fermenteur au premier écran ; aucune phrase explicative
- [x] import « Coller une recette trouvée » (A6, en tuile)
- [x] saisie sans `type="number"` (0)

## Honnêteté (J7)
- Cases du fermenteur : 10 cases de 3 L ; 8 pleines = 24 L, la 8e tiretée = conseil 24 L, 2 vides = 6 L libres. L'ébullition : 6 cases de 15 min, 4 pleines. Rien n'est à zéro ; une recette neuve montre des cases vides, pas des pleines.
- « ~ » sur 3 L, 27 L, 20 % ; FG et alc. non montrés (inconnus) ; EBC hors bande en ambre.
- NOLO non : « ≤ 0,5 % » en petit (ce que vaut la cible) ; touché : pilule violette « ≤ 0,5 % » et « atelier à Levure » (`z3-nolo.png`).

## Boosters UX (boosters-ux)
- Boosters : `tuile-style` — choisir + lire (pastille, plages). `tuile-volume` — ajuster + lire (28 px saisi, cases 3 L, libres, conseil). `tuile-ebullition` — ajuster + lire (cases 15 min, ~3 L, ~27 L). `tuile-nolo` — choisir ; touché → violet. `coller-recette` — déclencher.
- B1 OK — 5 boosters ; avant/après : `z3-haut.png` / `z3-nolo.png`.
- B2 OK — dominante : les deux grands chiffres 24 et 60 ; un seul `primary`.
- B3 OK — 68 mots (MOTS OK) ; 7 tuiles ; HAUTEUR OK (1,00).
- B4 OK — une tuile = un groupe ; pas de carte dans une tuile.
- B5 à mesurer — grille de 6 px, rembourrage 10 ; R2 non mesuré.
- B6 écart — 4 tailles (12/14/16 + 28 `display` pour les deux chiffres saisis) : DESIGN.md admet `display` pour « une mesure prioritaire » ; ici deux. À juger.
- B7 OK — CONTRASTE OK ; unités en #333 sur les tuiles teintées ; COULEURS OK (ambre, vert, bleu, violet).
- B8 à dessiner — recette neuve : tuiles vides avec leur cadre (« — »), import en tête ; fermenteur plein : cases rouges et alerte dans la tuile volume.
- B9 OK — la pilule NOLO répond.
- B10 OK — champs texte à `inputmode`, pas de `type="number"`.
- B11 — phrase attendue : « Double IPA de 24 L (6 libres sur 30), 60 min, pas de NOLO, cuve 45 L ».
- B12 OK — STANDARD OK (rayons 8 / pilule).
- B13 OK — tuiles entières touchables (≥ 150 px), pilule 28 px.
- Écarts voulus : B6 (deux `display`) ; contrôles houblons sautés (`fiche`, `trait`, `legende`, `au-style`).

## Tient / casse
- Tient : « visuellement parlant et frappant » (C096) sans un mot de plus ; les couleurs disent la rubrique (style, fermenteur, eau, NOLO).
- Casse : la tuile « nom » est fade ; le mot « nom » en étiquette est de trop si le placeholder suffit ; les cases de 3 L arrondissent (un fermenteur de 31 L casserait le pas).

## Contrôles joués
PAGE OK · MOTS OK (68) · PANEL OK (lot) · COMMUN OK (`--sans=mots,fiche,trait,legende,au-style`) · CONTRASTE OK · HAUTEUR OK · `type="number"` : 0.
Captures : `z3-haut.png`, `z3-page.png`, `z3-nolo.png`.
