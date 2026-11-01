# z4 — Le verre (série z, créative à fond)

- **Chaleur** : tiède. Forme libre : l'identité, c'est d'abord la bière dans son verre.
- **Axes** : A1 (carte « bière »), A2 (badge « 6 L libres »), A3 (plages sous le style), A5 (pilule NOLO), A6 (import retiré du corps).
- **Idée, en une phrase** : un grand verre rempli à la couleur EBC réelle de la recette (9,5, or pâle, mousse blanche), le nom écrit en grand au-dessus, et à sa droite les quatre décisions (style + plages, 24 L + badge du fermenteur, 60 min + jauge bleue, NOLO) ; dessous, six tuiles de repères.

## Acquis de la baseline (J5, J12)
- [x] en-tête, fil des 7 étapes, bandeau : tels quels
- [x] nom, style, volume, ébullition, NOLO, état du fermenteur au premier écran ; aucune phrase explicative
- [x] saisie sans `type="number"` (0)
- [ ] import du corps : retiré (A6, l'icône d'en-tête suffit)

## Honnêteté (J7)
- La couleur du verre est l'EBC 9,5 du bandeau (`#E0A02E`, échelle `ebc-*`) ; le verre est plein : son niveau ne mesure rien (loi 3 de DESIGN.md). EBC inconnu : verre hachuré, jamais ambré par défaut.
- « ~ » sur 3 L, 27 L, 20 % ; « conseil » sur 24 L ; « brouillon repris » est l'état. FG et alc. sans repère.

## Boosters UX (boosters-ux)
- Boosters : `verre-ebc` — lire la couleur de la bière ; silhouette SVG. `pastille-style` — choisir. `plages-au-style` — lire la relation au style. `badge-fermenteur` — lire si ça tient. `pilule-nolo` — choisir ; touché → « NOLO ≤ 0,5 % » violet (`z4-nolo.png`). `materiel-du-plan` — lire.
- B1 OK — 6 boosters ; avant/après : `z4-haut.png` / `z4-nolo.png`.
- B2 OK — dominante : le verre ; un seul `primary`.
- B3 OK — 63 mots (MOTS OK) ; HAUTEUR OK (1,00).
- B4 OK — scène (verre | décisions) puis deux rangées de tuiles ; aucun cadre imbriqué.
- B5 à mesurer — 8/10 px ; R2 non mesuré.
- B6 écart — 4 tailles : 12/14/16 + 28 `display` pour le nom (grande lecture dédiée, une seule).
- B7 OK — CONTRASTE OK ; COULEURS OK (or, vert, bleu) ; STANDARD OK (contour du verre à 1,25 px, comme les pictos).
- B8 à dessiner — recette neuve : verre vide (contour seul) et « — » ; fermenteur plein : badge rouge « plein ».
- B9 OK — pilule NOLO répond.
- B10 OK.
- B11 — phrase attendue : « une Double IPA dorée, neipa v3, 24 L (6 libres), 60 min, sans NOLO ».
- B12 OK — mêmes pilules, chevron, rayons.
- B13 OK — champs 32 px, pilule 28, badge 24 (non interactif).
- Écarts voulus : B6 (display du nom) ; A6 retiré ; contrôles houblons sautés.

## Tient / casse
- Tient : la bière se voit avant de se lire ; les décisions restent sur une colonne d'une main.
- Casse : le verre prend 170 px pour une seule donnée (EBC, déjà dans le bandeau) — à défendre par le plaisir de voir sa bière, sinon « inutile » ; la colonne droite est serrée à 390 px.

## Contrôles joués
PAGE OK · MOTS OK (63) · PANEL OK (lot) · COMMUN OK (`--sans=mots,fiche,trait,legende,au-style`) · CONTRASTE OK · HAUTEUR OK · `type="number"` : 0.
Captures : `z4-haut.png`, `z4-page.png`, `z4-nolo.png`.
