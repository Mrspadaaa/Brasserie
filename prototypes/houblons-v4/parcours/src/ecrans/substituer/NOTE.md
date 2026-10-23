# Substituer, la porte : « Lequel à la place de Nugget ? » (voie p1-ma-biere, 23.10)

## Base

- La porte de la carte : `fils22-carte/substituer-porte/etat.html`, capture
  `fils22-carte/captures/substituer-porte-390.png` (Nugget épinglé en colonne 1).
- u4 de la base : `base/consolide/substitution.html`, capture `base/captures/consolide-substitution-390.png`
  (remplaçants classés, dose à IBU égal, perd et gagne).

## Idées reprises

- Facteur libre : le remplaçant (`data-libre="houblon"`) ; fixés : style, moment, « 60 IBU égal ».
- Nugget épinglé à gauche ; les remplaçants du moteur (`substitutes`, en stock d'abord) défilent dessous.
- Par colonne : α (lot d'abord), usage, dose à IBU égal et sa plage par l'α, arômes et part « autres », ce qu'on
  perd et ce qu'on gagne, puis ma bière après le remplacement au style (familles attendues et hors du style, rond
  = avec Nugget, écart « ~−1 »), et la proximité calculée (score, arôme, huiles, amertume).
- Toucher une colonne la choisit ; le dock dit « 62,5 g de Nelson Sauvin » et « Remplacer › ».

## Écarts

- La dose est posée au demi-gramme à IBU égal (le moteur arrondit au gramme : jusqu'à 0,65 IBU d'écart) ; la
  plage par l'α reste celle du moteur.
- « Remplacer › » ne porte pas le nom du houblon (D98 le lisait comme un second choix) : le nom est à sa gauche.

## Pour l'app

- `src/ui/hops/HopSubstitute.tsx`, route `{ view: 'hopSubstitute', recipeId, hopKey }`.
- « Remplacer » écrit la recette dans Dexie ; `doseExacte` va dans `src/domain/hops/recipeHops.ts`.
- Le stock et l'α des lots viennent de la fixture : à brancher sur le vrai stock.
