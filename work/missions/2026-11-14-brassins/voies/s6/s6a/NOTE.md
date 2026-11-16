# s6a — G3, la conduite de z1 transposée

Chaleur : froide

Idée : Le genre pur : z1 en ébullition, pièce pour pièce. Le chrono devient le compteur J+5 avec −1 j / +1 j (décaler le plan), la piste de phases porte les rendez-vous, la table « Gestes » se coche.

Geste montré : feuille Mesurer, Densité au curseur (1,016, bande verte, repère 1,018, éch. 20,5 °C ±0,1).

## Baseline (plancher à enrichir)
- [x] geste m2 : feuille Mesurer, Densité au curseur (1,016, bande verte, repère 1,018, éch. 20,5 °C ±0,1) ; aucun type="number" ; chiffres à la virgule
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
- (1) pas de puces pastel ni de cases °C J+1 à J+9 ni de carte dry hop : une table à cocher z1, deux rangées houblon surlignées « demain ».
- (2) le héros est le rendez-vous (phrase + compteur) ; la °C de cuve est un bouton dans « Relevés du jour ».
- (3) couleurs pleines : vert de phase, ocre du prochain geste, cases vert plein, pictos de familles.
- (4) « Dry hop demain · Citra + Mosaic » en 24 px en tête ; « stable » dessiné : trois cases et un rond 0/3.
- (5) chaque houblon : nom, α, rôle, pictos de familles.
- (6) courbe petite, cadrée de J0 à aujourd'hui, sans moitié vide.
- (7) aucune phrase d'aide ; liste remplie par « Cette semaine » (Gantt des cuves, colonne du jour encadrée).

## Écarts assumés
- Écart : le titre-réponse est au-dessus du compteur, alors que z1 met le chrono en tête (cause 4). Les unités en mono ont l'espace large de z1.
- Liste : « Cuves » à la z1, avec Pale Ale en retard cerclée de rouge (Brasser / Replanifier), Pils « Confirmer FG », et la semaine en Gantt.

## Boosters (data-booster)
frise-phases, compteur-jours, case-dryhop, lampe-stable, releve-cuve, courbe-densite, gantt-semaine, curseur-densite. Mesures B2 à B13 non jouées en v0 (permis par boosters-ux).


## g4a (15.11) : corrections de k4
- En-tête de la fiche : « stock · ⋯ dossier » à côté du × ; Journal reste l'onglet carnet (k4 B0). Liste : ★ et ⋯ par cuve, icône stats (k4 n° 2). 1280 : poste de cave, gestes à gauche, relevés et courbe à droite, autres cuves dessous (k4 n° 1). Stepper de phases retiré ; bouton principal « Préparer le dry hop ».
