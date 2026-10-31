# z5 — Le dialogue (série z, créative à fond)

- **Chaleur** : chaude. Forme libre : l'Identité comme un échange court avec le compagnon.
- **Axes** : A1 (phrase-bière, mais en bulles éditables), A2 (bulle-fait « 6 L libres sur 30 »), A3 (deux bulles de plages, en nombres), A4 (bulles saisies), A5 (bulle NOLO), A6 (import retiré du corps).
- **Idée, en une phrase** : quatre questions à gauche — Quelle bière ? Combien ? Comment ? Avec quoi ? — et, à droite, les réponses du brasseur en bulles noires qu'on édite sur place, suivies des faits que l'app en tire, en bulles grises, vertes (fermenteur) ou bleues (eau).

## Acquis de la baseline (J5, J12)
- [x] en-tête, fil des 7 étapes, bandeau : tels quels
- [x] nom, style, volume, ébullition, NOLO, état du fermenteur au premier écran ; aucune phrase explicative (les questions font 2 mots)
- [x] saisie sans `type="number"` (0)
- [ ] import du corps : retiré (A6)

## Honnêteté (J7)
- Bulles noires = décisions du brasseur ; bulles claires = faits (22A, OG 1,065–1,085, IBU 60–100 du catalogue ; 6 L libres ; conseil ; « ~ » sur 3 L, 27 L, 20 %). Rien d'inventé ; FG/alc. non montrés.
- NOLO non → touché : bulle violette « NOLO ≤ 0,5 % » (`z5-nolo.png`).

## Boosters UX (boosters-ux)
- Boosters : `pastille-style` — choisir. `fait-fermenteur` — lire si ça tient (bulle verte). `fait-evaporation` — lire (bulle bleue). `bulle-nolo` — choisir.
- B1 OK — 4 boosters ; avant/après : `z5-haut.png` / `z5-nolo.png`.
- B2 OK — dominante : les bulles noires ; un seul `primary`.
- B3 OK — 74 mots (MOTS OK) ; HAUTEUR OK (1,00).
- B4 OK — un échange = un groupe ; questions alignées à gauche, réponses à droite.
- B5 à mesurer — 6/16 px ; R2 non mesuré.
- B6 OK — 12/14/16 px ; mono pour les mesures.
- B7 OK — CONTRASTE OK (pire 5,1:1) ; COULEURS OK.
- B8 à dessiner — recette neuve : bulles vides en pointillé « … » là où la réponse viendra ; fermenteur plein : bulle rouge.
- B9 OK — la bulle NOLO répond.
- B10 OK — champs dans les bulles, `inputmode`.
- B11 — phrase attendue : « neipa v3, Double IPA ; 24 L, 6 libres ; 60 min, pas de NOLO ; Royal Catering ».
- B12 OK — pilules et chevron des autres écrans.
- B13 OK — bulles 36 px, faits 28 px (non interactifs sauf plages).
- Écarts voulus : la forme « chat » est hors des composants de l'app (à porter comme liste de puces) ; contrôles houblons sautés.

## Tient / casse
- Tient : la question de l'outil est littéralement à l'écran (J2) ; les décisions se distinguent des faits par la couleur, sans légende.
- Casse : les questions sont du texte au premier plan (8 mots) ; à 390 px, deux bulles par rangée au plus.

## Contrôles joués
PAGE OK · MOTS OK (74) · PANEL OK (lot) · COMMUN OK (`--sans=mots,fiche,trait,legende,au-style`) · CONTRASTE OK · HAUTEUR OK · `type="number"` : 0.
Captures : `z5-haut.png`, `z5-page.png`, `z5-nolo.png`.
