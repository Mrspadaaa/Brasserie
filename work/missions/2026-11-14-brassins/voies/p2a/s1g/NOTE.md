# NOTE s1g — La courbe porte les gestes (fusion s1e + s1c + s2d)

Chaleur : tiède (fusion proposée par t1 : la forme de s1e, le densimètre de s1c, les gestes posés de s2d). Variante sœur de s1e2, elle ne la remplace pas.
Base : copie de `s1e2/etat.html`, préfixe `s1g-`, puis composition refaite.

## Ce qui change par rapport à s1e2
- En-tête façon s1c : NEIPA en 28 px, « LOT-019 · F1 · 24 L · fermentation » dessous, J+5 en 34 px à droite avec « levuré le 09.11 ».
- Plus de barre des phases : les phases sont des bandes de fond de la courbe (fermenter, « repos 21° », « garde 2° » en tête de colonne).
- Courbe haute (450 px à 390, 640 en 1280) ; densimètre de la colonne J+5 de 44 px de large, de l'OG à la bande FG, gradué tous les 0,005, case FG, dernière valeur en pointillé ; tout le tube est une cible « Relever la densité » (44 px).
- Gestes posés sur la courbe (s2d), boutons de 44 px :
  - goutte « Dry hop · demain · Citra · Mosaic 180 g » en tête de J+6, fil pointillé jusqu'à l'axe ;
  - flocon « Garde 2 °C · si stable » posé sur la bande FG à J+10 ;
  - « 21 °C · lun. 16.11 · 3 j » posé sur la marche de J+7 de la consigne.
- Cartes ③ et ④ supprimées (portées par la courbe) ; restent la carte ① (°C cuve, geste m2) et une carte de dry hop compacte (tuiles + « Ajouté aujourd'hui »).
- Échantillon : « éch. 20,5 °C » au-dessus de la bande, sous 1,018.
- 1280 : courbe et cases à gauche ; à droite carte ①, dry hop, « Gestes à venir » (agenda des gestes posés), « Relevés de densité · échantillon », provisoires, boutons.

## États
- geste : la case J+5 passe en noir à 19,2, le point 19,2 apparaît sur la courbe °C, la carte ① s'ouvre en m2 (valeur tapable 19,2, ±0,1, piste 15–23, bande 18–20, Enregistrer).
- dryhop : la goutte quitte J+6 (cercle barré, « prévu J+6 », flèche) pour J+5 (« Dry hop fait · aujourd'hui · J+5 ») ; la carte dit « Dry hop ajouté · sam. 14.11 · J+5 · J+6 barré · 1 j d'avance », tuiles « sorti du stock », « stock −180 g · Citra −100 · Mosaic −80 · daté du 14.11 », Annuler.
- liste : calendrier des cuves 26.10 → 21.11, une rangée par cuve, chaque prochain geste posé en bouton sur son jour : NEIPA « Dry hop · demain » sur 15.11, Pale Ale « Brasser · ou replanifier » sur aujourd'hui (6 j de retard en pointillé), Pils « Conditionner · FG 1,010 stable » ; légende des phases ; « Aujourd'hui aussi » (Relever °C F1) ; Clos.

## Baseline
- [x] geste m2 tel quel ; grammaire z1 (en-tête de lot, carte du jour, relevés)
- [x] J+5 · levuré le 09.11
- [x] deux températures : cuve face à la consigne (cases /19, marches), échantillon « éch. 20,5 °C » avec la densité
- [x] FG en bande 1,010–1,014 ; inconnu « — » (densité du jour, conditionnement)
- [x] dry hop nommé, dosé (7,5 g/L · 24 L, 100 + 80 g), daté ; « Ajouté aujourd'hui » date et sort du stock
- [x] pas de cockpit ni de bandeau d'alerte ; atténuation 71 % et alcool 5,8 % « provisoires »
- [x] chiffres à la virgule ; unités en police texte (pas de double espace mono) ; cibles ≥ 44 px (script : `petits=[]` sur les six images) ; deux thèmes

## Boosters UX
courbe-gestes (suivre, déclencher sur place), densimetre (ajuster), releve-cuve + curseur + pas + valeur (m2), dryhop (déclencher), cases-cuve (comparer), calendrier (suivre, déclencher), releves (1280).

## Captures (toutes ouvertes)
s1g-repos-390-clair, s1g-geste-390-clair, s1g-dryhop-390-clair, s1g-liste-390-clair, s1g-repos-390-cave, s1g-repos-1280-clair.
Limite vue : les cases °C cuve (J+1 à J+9) ne sont pas alignées sur les colonnes de jour de la courbe (J0 à J+12).
