# s6b — G3, la conduite de z1 transposée

Chaleur : tiède

Idée : La colonne des jours est la courbe : une rangée par jour depuis le levurage, une barre de densité par relevé qui avance vers la voie verte de la FG, et les gestes à cocher à leur jour.

Geste montré : sur place : la rangée du jour devient le curseur m2 (−/+ 0,001, la barre est la piste, la voie FG au bout), éch. 20,5 °C, Enregistrer.

## Baseline (plancher à enrichir)
- [x] geste m2 : sur place : la rangée du jour devient le curseur m2 (−/+ 0,001, la barre est la piste, la voie FG au bout), éch. 20,5 °C, Enregistrer ; aucun type="number" ; chiffres à la virgule
- [x] grammaire z1 : en-tête de lot, table à cocher, relevés du jour, pied Mesurer · Note ; jetons DESIGN.md (clair et cave)
- [x] J+5 · levuré le 09.11
- [x] deux températures : °C de cuve (face à la consigne 19) et °C d'échantillon (liée à la densité)
- [x] FG en bande 1,010–1,014 ; inconnu « — » ; alcool 5,8 % et atténuation 71 % « provisoires »
- [x] dry hop nommé (Citra 100 g, Mosaic 80 g, J+6) ; la case « Ajouté aujourd'hui » date et déstocke
- [x] premier plan actionnable ; ni bandeau, ni code interne, ni secondes

## Sources
- α : plages de src/data/hopDatabaseBootstrap.json (kasperg3/HopDatabase) : Citra 10–16 %, Mosaic 10–15 % ; α du lot inconnu.
- Rôle « double » et familles : src/data/hopBeerMaverickFiches.json (purpose dual ; arômes ≥ 2/5 : Citra agrumes 5, tropicaux 4, épicé 2, résineux 2 ; Mosaic résineux 4, agrumes 3, tropicaux 3, floral 2).
- « Stable » : 3 j à 0,001 près dans la bande (jury-brassins/fiche.md, J14 ; règle à sourcer au port).
- Valeur du geste (1,016) : saisie d'exemple du brasseur, pas une donnée.

## Causes c3 évitées
- (1) ni puces, ni courbe en tête, ni carte : une seule colonne datée, la phase en filet de couleur à gauche.
- (2) héros : J+5 et « Dry hop demain » ; le relevé de °C de cuve est un bouton de la rangée du jour.
- (3) barres vert plein, filet de phase vert, ocre et bleu, rangées dry hop surlignées, coche verte pleine.
- (4) phrase-réponse en 23 px ; « stable » dessiné : trois cases dans la voie verte (0/3).
- (5) α, rôle, moment « actif » et pictos sur chaque houblon.
- (6) pas de graphe vide : l'axe des jours est la liste, et l'avenir porte des gestes, pas du vide.
- (7) aucune phrase grise ; 1280 en poste de cave : cuves, colonne, dry hop et bilan.

## Écarts assumés
- Écart : la voie FG est étroite (4 sur 52 points d'échelle) ; une échelle cadrée sur 1,040–1,010 la rendrait plus lisible en passe 2.
- 1280 : la colonne des cuves laisse un vide bas ; à combler en passe 2.

## Boosters (data-booster)
cuves, compteur-jours, colonne-densite, releve-cuve, releve-densite, curseur-densite, case-dryhop, lampe-stable. Mesures B2 à B13 non jouées en v0 (permis par boosters-ux).
