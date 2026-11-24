# Critique au portrait (PORTRAIT.md v2), 24.11 — « combien et quels problèmes ? »

Joué par le concepteur lui-même : un sous-agent ne peut pas en lancer un autre. Les 6 planches (cap/planches/vNN.png) ont été ouvertes avant la correction, puis après.

## Avant la correction : 9 problèmes, communs ou propres à une version
1. Partout : dans le tableau des houblons, la colonne CHF/kg était rognée, avec le gagnant ≈41 caché. Le jeton « ⚠ dispo ? » poussait la grille.
2. Partout : Articles, le bouton « Retirer » était coupé au bord droit.
3. v02 sans critère, v03 et v06 Comparer : les valeurs étaient mal alignées, à cause de la classe `.b` (gras) prise pour la colonne de droite.
4. v02 et v05 Comparer : « 13,6 % » passait à la ligne.
5. v02 à v06 : les carnets de notes s'arrêtaient à mi-écran (rempli 40 à 60 %). Pour le juge : « plus d'information utile bat plus de vide ».
6. v01 : le fil commençait en haut, la note la plus récente était coupée. Un chat s'ancre en bas, près du champ.
7. v04 : dans la frise, les dates sur deux lignes se chevauchaient (« 6 sept. » sur « 8 sept. »), et ce qui vient était en bas, hors de l'écran.
8. Houblons : le bas de l'écran était vide, et les arômes avaient disparu de la passe 1 (penser brasseur : arômes en couleur).
9. Chambre froide : les écartés n'étaient pas visibles (gardé C7).

## Corrigé en une passe (src/construire.mjs)
- (1) colonne `minmax(0,1fr)` et jeton qui passe à la ligne ;
- (2) carte décalée de 150 px, actions de 72 px ;
- (3) classes `.ga` et `.gb` ;
- (4) colonne de 84 px ;
- (5) 2 ou 3 notes de plus par genre, toutes marquées exemple, et la plus récente en haut ;
- (6) fil ancré en bas ;
- (7) la date sur une ligne, l'heure dessous ; ce qui vient en haut ;
- (8) bloc Arômes ;
- (9) ligne « Écartés · 1 ».

Ajouts après la capture en ligne de « Sol, murs & évacuation » (fait du 08.12.2025 au 21.12.2025, budget 3 500 CHF) :
- les dates du mémo ont été recalées sur décembre 2025 ;
- la liste montre « budget 3 500 », pas un coût inventé.

## Après la correction (planches rouvertes)
Il reste des défauts mineurs :
- v01 NEIPA : un blanc entre les liens et le fil ancré en bas ;
- v02 et v04 sans critère : les valeurs ne sont pas alignées en colonne ;
- v06 : la vignette « page » du lien est sombre.

## Notes (au portrait, −0,5 appliqué)
| Version | Note | Ce qu'il dirait |
|---|---|---|
| v01 | 7 | « le chat est revenu » |
| v02 | 7 | les cases répondent au besoin de chaque genre |
| v03 | 7 | « à retenir » se lit en 3 s, mais c'est du texte au premier plan |
| v04 | 6,5 | idée forte pour un problème, plus faible pour une idée |
| v05 | 6,5 | utile pour un à-faire, vide pour un mémo fini |
| v06 | 6,5 | les photos parlent, mais ce ne sont que des dessins d'exemple |
