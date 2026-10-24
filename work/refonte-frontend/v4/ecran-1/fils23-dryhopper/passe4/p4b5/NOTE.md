# p4b5 — « Trois moments sous le pouce » (passe 4 sur a1, voie dh4b, 24.10 ; reprise après REJET)

**Chaleur : chaude.** Forme libre sur a1 : la figure compare trois moments côte à côte, le moment sous le pouce au milieu,
ouvert (barres l5b avec rond « avant » et chiffre), un voisin de chaque côté : barre de gain seule, sans rond, chiffrée.
Les 12 familles sont alignées en lignes, l'œil lit d'un trait comment chacune monte ou tombe d'un cran à l'autre.
Toucher un voisin y va. Le dock garde les quatre pastilles d'étape, le rail et la loupe d'a1 ; « Face à ta stout »,
« contre ★ », mesuré et pont Levure sont ceux d'a1. Régénérer : `node generer.mjs` ; captures :
`node ../p4b-commun/capturer.mjs p4b5`.

## Reprise après le verdict du critique (`passe4/critique/PASSE4.md`, REJET : « barres des voisins illisibles, 7 px sous un rond de 12 px »)
- **Cinq colonnes → trois** (voisin · ici · voisin) : cellules de 85 px au lieu de 47 ; barres de gain à 12 px de haut
  (14 au milieu) sur des pistes de 51 à 55 px (45 à 61 aux bouts), mesurées au DOM (`geste.json`, `largeurBarres`).
- **Plus de rond « avant » chez les voisins** : la barre de gain seule, chiffrée dans chaque colonne (~+22 · ~+22 · = ~+22) ;
  le rond reste sur la colonne ouverte.
- **Aux bouts du rail, les deux voisins du même côté** : à 60′, 60′ · 55′ · 50′ (`captures/p4b5-60.png`) ; à après · 7 j,
  3 j · 5 j · 7 j. Plus de colonne vide.
- **Amertume chiffrée dans les trois colonnes** : à 20′, ≈129 · ≈119 · ~110, orangées ; à cru « 60+? » hachuré partout.
- **La loupe d'a1 rétablie** sur le rail (cinq moments par 5′, floral, ×5,6) : la figure ne tient plus lieu de loupe.
- Les chiffres des voisins collaient à la barre du milieu : colonnes écartées de 10 px, chaque chiffre à 2 px de sa barre.

## Améliorations du brief prises
- **1, l'interpolation dite** : une colonne interpolée a un en-tête en pointillé et « ≈ » (25′ · 20′ · 15′), une colonne
  calculée un en-tête plein et « ~ » (60′, 10′) ; les points calculés sont aussi marqués sur le rail.
- **5, deux facteurs à l'écran** : en dry hop, les voisins sont des jours (1 j · 2 j · 3 j) : la durée de contact se lit sans
  second geste, et « = » devant le chiffre marque un jour sans gain.
- **6, la lecture sans légende** : trois colonnes alignées, toutes chiffrées, ● / ○ sous l'en-tête pour « mesuré » /
  « jamais mesuré » (c7).

## Greffes
Les cases comparées dont celle du doigt s'ouvre (e3) ; la mesure par colonne (c7) ; « sans gain » (e2) ; pastilles d'étape,
sauts, loupe et « contre ★ » d'a1 et b4.

## Ce qui tient
- La comparaison des étapes sans glisser, que le tri demandait (relance « e3 + a8 + c7 »), en gardant le geste et la loupe d'a1.
- 39 mots hors données ; un écran ; D98 vert (les boutons de colonne sont des sauts, dans le groupe `data-libre`).

## Ce qui casse
- Les pistes des voisins font 51 px (le label des familles prend 70 px) : les écarts de 1 point (floral 1 j → 2 j) se lisent au
  chiffre, pas à la barre.
- Trois colonnes au lieu de cinq : à 5′ près on ne voit qu'un cran de chaque côté ; la loupe du rail complète.
- Le « = » sans gain apparaît aussi sur la colonne ouverte (épicé à 2 j) : juste, mais discret.

## Contrôles (rejoués après la reprise)
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 39 mots |

Geste : d'actif · 2 j (colonnes 1 j | 2 j | 3 j, ~+22, 60+?) à 20′ (colonnes 25′ | 20′ | 15′, ≈+11, ≈119, « contre ★ :
floral ≈−11 · résineux ≈−7 · trop amer »), loupe 5 voisins ×5,6. Captures ouvertes : `captures/p4b5-premier-ecran.png`,
`p4b5-pendant.png`, `p4b5-apres.png`, `p4b5-60.png`.
