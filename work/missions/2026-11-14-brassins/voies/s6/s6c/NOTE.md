# s6c — G3, la conduite de z1 transposée

Chaleur : chaude

Idée : G3 mêlé à G4 (Dryhopper) : la conduite de z1 dont le chrono devient le compte à rebours du houblon (« 1 j ») et les deux houblons, en colonnes de couleur de familles, portent la case « Ajouté aujourd'hui ».

Geste montré : « Ajouté aujourd'hui » sur Citra : la colonne passe au vert plein, « 14.11 · −100 g », le titre devient « Citra ajouté, Mosaic demain ».

## Baseline (plancher à enrichir)
- [x] geste m2 : « Ajouté aujourd'hui » sur Citra : la colonne passe au vert plein, « 14.11 · −100 g », le titre devient « Citra ajouté, Mosaic demain » ; aucun type="number" ; chiffres à la virgule
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
- (1) aucune pièce du squelette refusé : titre-réponse, segment de moment, deux colonnes houblon, fenêtre « actif », table courte.
- (2) héros : le houblon de demain ; la °C de cuve est une rangée à un toucher.
- (3) barres de familles pleines, aplat ocre « actif », bande FG vert plein, liseré de couleur par houblon.
- (4) « Dry hop demain » en 26 px et la pastille « 1 j » ; « stable » : trois cases, 0/3.
- (5) α, rôle, intensités de familles (Beer Maverick) : le houblon parle brasseur.
- (6) graphe cadré de J0 à J+7 ; la fenêtre « actif » et le jour J+6 le remplissent.
- (7) aucune phrase d'aide ; lien « Quand ajouter ? » vers Dryhopper au pied.

## Écarts assumés
- Écart : pas de piste de phases ; les phases à venir vivent dans la table. Les barres de familles sont les notes Beer Maverick (0 à 5), sans valeur simulée.

## Boosters (data-booster)
compteur-jours, compte-a-rebours, moment, case-dryhop, fenetre-actif, releve-cuve, lampe-stable, dryhopper. Mesures B2 à B13 non jouées en v0 (permis par boosters-ux).


## g4a (15.11) : corrections de k4
- En-tête de la fiche : « stock · ⋯ dossier » à côté du × (k4 B0). 1280 : houblons et courbe côte à côte, gestes et autres cuves à droite (k4 n° 1). Sous-titre « 24 L », J+7 au pas de l'axe, OG à l'échelle.
