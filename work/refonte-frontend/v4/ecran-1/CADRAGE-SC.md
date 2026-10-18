# Suggestions et Comparer — cadrage du lot 5 (18.10, soir)

Le brasseur, sur le lot 4 publié : « Pour la fiche, on est bon, ma bière moyen convaincu. Les
deux autres c'est n'importe quoi... ». Puis, ses captures du comparateur de Beer Maverick à
l'appui (Fuggle, Citra, Idaho 7) : « J'ai d'ailleurs donné des exemples concrets... C'est pas
possible de faire moins bien... » ; « D'ailleurs, il faut des intervalles de confiance » ;
« Beer Maverick pour le mode Comparer, c'est une des base, il faut faire mieux, pas moins bien
ou la même chose... ».

Ce qui a mal tourné : ses exemples étaient dans `v3/reference/beer-maverick/` depuis le matin,
mais deux de nos contrôles les interdisaient (au plus 2 séries par radar, aucune teinte sur un
radar de houblons). La v3 a donc montré des citations « 2/4 » en gris, sans α, sans rôle, sans
plage. Ces deux contrôles sont révisés (D24, D40) avant le lot.

## Comparer : « lequel je prends, ou lequel remplace le mien ? »

2 à 4 variétés choisies par le brasseur (depuis la fiche, la recette, le stock, le catalogue).
Ordre de lecture d'un brasseur : α, rôle, arômes, moment, IBU ; le stock en icône.

**Plancher : Beer Maverick, tout entier** (sinon échec automatique, D51) :

- un radar où les houblons **se superposent**, une couleur par houblon, silhouettes pleines
  translucides, points aux sommets, 12 axes (D48) ;
- les **valeurs de brassage en barres-plages** : pour chaque mesure, une barre par houblon, sur
  la même échelle ; plage pâle de 0 au bas, segment plein sur la plage, trait au centre, plage
  écrite. Mesures : α, β, rapport α/β, huiles totales, puis myrcène, humulène,
  caryophyllène, farnésène quand la fiche les a ;
- la même couleur pour un houblon partout : radar, barres, légende.

**Mieux que Beer Maverick** (ses défauts, `v3/reference/beer-maverick/constats.md`) :

1. le nom du houblon sur chaque barre, pas seulement sa couleur ;
2. des couleurs distinctes aussi pour un daltonien (pas rouge et vert ensemble), jamais la
   couleur d'alerte de ma bière ;
3. un radar jamais rogné, des chiffres d'échelle lisibles ;
4. une lecture : ce qui distingue chacun (« le plus agrume », « seul à citer le melon ») ;
5. **dans ma recette** : l'IBU de ce houblon au moment choisi, et la dose équivalente pour
   remplacer un houblon de la recette à IBU égal ;
6. le style : les familles que le style attend sont repérées (la cible n'est pas dessinée
   dans le radar des houblons) ;
7. des gestes : ajouter à la recette, remplacer, retirer de la comparaison, ajouter un houblon
   (ses substituts proposés), aimer ou exclure ;
8. compact : Beer Maverick prend 7 écrans au téléphone ; ici, un écran à 390 px (règle du
   lot), le détail des huiles et les explications à un toucher.

**Données, sans tricher** : α, β, huiles totales et composants viennent des fiches (sources et
années) : ce sont de vraies plages. Les arômes sont des **citations** (0 non décrit, 1 cité,
2 marqué ; N sources sur M), pas l'intensité 0–5 de Beer Maverick : le pack n'a pas ces
intensités (leur import en masse est la décision D25 du brasseur, en attente). Le radar dit
son échelle. IBU par gramme et par moment : `ibuParGramme` (plage tirée de α).

## Suggestions : « quelle voie j'applique pour aller vers ce que je veux ? »

L'objectif est posé par le brasseur (augmenter, réduire, bannir une famille, depuis Ma bière
ou ici) et reste modifiable ici. Pour chaque voie, dans cet ordre :

1. le changement concret : verbe, houblon, dose, moment (le moment se règle, rien d'imposé) ;
2. l'effet sur **mes objectifs** : avant → après, avec la plage, face à la zone du style ;
3. les effets de bord, puis l'IBU (avant → après), le stock en icône ;
4. Appliquer.

Deux ou trois voies se comparent côte à côte, mes familles-objectifs d'abord. Radar : ma
bière avant (contour) et après la voie (pleine), zone du style en fond, 12 axes ; passer d'une
voie à l'autre se voit.

**Données** : avant = profil V5.5 (`before` : min, central, max) ; après = profil recalculé
(`apresPlage`, ajouté au pack ce soir). V5.5 rend des plages larges (souvent 0 à 70) et
parfois complètes (0–100, « non situé ») : la vue le montre franchement, elle ne resserre rien.

## Les quatre objets (D19, D40)

- Ma bière (avant) et la cible : la couleur d'alerte n'appartient qu'à eux.
- Une voie, c'est ma bière après ; jamais la silhouette d'un houblon.
- Comparer, ce sont les fiches des houblons ; jamais une intensité dans ma bière.

## Contrôles avant le lot

- D24 révisé : dans Comparer, jusqu'à 4 houblons superposés sur un radar (comme Beer Maverick).
- D40 révisé : l'interdit vise la couleur d'alerte, pas toute couleur ; une couleur par
  houblon est permise et même exigée dans Comparer.
- D51 : Comparer au plancher Beer Maverick, et mieux (points 1, 2, 5, 7 mesurables ; la valeur
  de mon lot sur la plage).
- D52 : Suggestions en brasseur (verbe, effet sur mes objectifs, IBU, Appliquer, objectifs
  modifiables, moment réglable, stock en icône).
- D53 : intervalles de confiance sur chaque barre de Comparer et de Suggestions.
