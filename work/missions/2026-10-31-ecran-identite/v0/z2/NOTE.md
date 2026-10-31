# z2 — Je décide, ça donne (série z, créative à fond)

- **Chaleur** : froide. Les lignes de la baseline, dans le même ordre, mais chaque décision a sa conséquence en face, au lieu d'une phrase dessous.
- **Axes** : A1 (formulaire compacté en deux colonnes), A2 (ligne + barre 24/30), A3 (plages du style en face du style), A4 (champs en ligne), A5 (case à cocher, baseline), A6 (import du corps **retiré** : l'icône d'en-tête suffit).
- **Idée, en une phrase** : une grille à deux colonnes — à gauche ce que je décide (nom, style, 24 L, 60 min, NOLO, matériel), à droite, sur fond bleu « information », ce que ça donne (brouillon repris, bandes du style, 6 L libres, ~3 L évaporés, ≤ 0,5 %, ~20 % d'espace libre).

## Acquis de la baseline (J5, J12)
- [x] en-tête, fil des 7 étapes, bandeau : tels quels
- [x] nom, style, volume, ébullition, NOLO (case, comme aujourd'hui), état du fermenteur au premier écran ; aucune phrase explicative
- [x] saisie sans `type="number"` (0)
- [ ] bouton d'import du corps : retiré (A6, option 3) — l'icône d'en-tête reste

## Honnêteté (J7)
- « ~ » sur 3 L, 27 L, 20 % ; « conseil » sur 24 L. Plages 22A du catalogue ; FG et alc. sans repère (inconnus). EBC hors bande : repère ambre.
- NOLO décoché : « ≤ 0,5 % » en gris (ce que la case donnerait) ; coché : violet (`z2-nolo.png`). Aucun chiffre en double.

## Boosters UX (boosters-ux)
- Boosters : `pastille-style` — choisir. `plages-au-style` — lire la relation au style. `etat-fermenteur` — lire si ça tient (6 L libres, barre, conseil). `evaporation-simulee` — lire la conséquence de l'ébullition (barre 0–90, ~3 L, ~27 L). `case-nolo` — choisir ; touché → la conséquence passe en violet.
- B1 OK — 5 boosters ; avant/après : `z2-haut.png` / `z2-nolo.png`.
- B2 OK — dominante : la colonne bleue des conséquences ; un seul `primary` (Suivant).
- B3 OK — 66 mots (MOTS OK) ; 6 lignes ; HAUTEUR OK (1,00).
- B4 OK — deux bords gauches (décisions, conséquences) ; un seul cadre, des séparateurs.
- B5 à mesurer — lignes de 70 px, rembourrage 8/10 ; R2 non mesuré en v0.
- B6 OK — 12/14/16 px ; mono `tnum` pour les mesures.
- B7 OK — CONTRASTE OK (le vert passé à #2F5A22 sur le bleu : 4,5:1 tenu) ; COULEURS OK.
- B8 à dessiner — « brouillon repris » est un état (B8) ; recette neuve : « neuve » ; volume vide : « Volume à renseigner », barre vide ; fermenteur plein : conséquence rouge « plein ».
- B9 OK — la case répond au toucher.
- B10 OK — pas de `type="number"`, `inputmode`.
- B11 — phrase attendue : « neipa v3, Double IPA 22A, 24 L → 6 L libres, 60 min → ~3 L évaporés, pas de NOLO ».
- B12 OK — STANDARD OK ; chevron, case, barres.
- B13 OK — champs 32 px, case 22 px dans un libellé de 70 px de haut (toute la ligne est la cible).
- Écarts voulus : A6 retiré (J9 : doublon de l'icône acceptée) ; contrôles houblons sautés (`fiche`, `trait`, `legende`, `au-style`), aucun houblon sur Identité.

## Tient / casse
- Tient : cause et effet sur la même ligne ; les phrases de la baseline (« 3 L évaporés — autant d'eau… », « Repère provisoire : 20 %… ») disparaissent sans perdre leur chiffre.
- Casse : la colonne bleue peut passer pour un bloc décoratif si on ne lit pas les chiffres ; les plages du style tiennent peu de place en face du style (à juger).

## Contrôles joués
PAGE OK · MOTS OK (66) · PANEL OK (lot) · COMMUN OK (`--sans=mots,fiche,trait,legende,au-style`) · CONTRASTE OK · HAUTEUR OK · `type="number"` : 0.
Captures : `z2-haut.png`, `z2-page.png`, `z2-nolo.png`.
