# l5b — l2 + la conduite de l4b ; effets en jauges ordinales ; « + » sur chaque frontière (passe 3, 09.11)

Même base et mêmes données que l5a (voir `../l5a/NOTE.md`, sources [1] à [22] de `savoir/TROUS-COMBLES.md`). Deux différences :

## Effets : jauges ordinales, seulement là où la source donne un niveau
Une rangée par famille (pastille de couleur, nom), et à droite :
- une jauge de 3 cases (faible · moyen · élevé) quand la source donne un ordre : US-05 esters faible ; Abbaye thiols faible,
  terpènes moyen ; Verdant thiols élevé, terpènes moyen ;
- un mot quand elle n'en donne pas : « tropical, banane à chaud », « abricot, tropical », « présent » (POF+), « aucun » (POF−),
  « plus de corps » ;
- un nombre avec sa nature : « 11 g/L · mesure fabricant » (sucres restants US-05) ;
- sinon « ⌕ non documenté », qui se touche pour chercher.
Aucune jauge n'est tirée d'un descripteur : aucune échelle inventée.

## Paliers (geste : couper ou prolonger par la frontière)
- Un « + » au-dessus de chaque frontière (J0, chaque bascule, la fin) insère un palier à cet endroit, comme « + Avant » et
  « + Après » de l'app (`YeastRecipePlan.tsx:707-708`), sans passer par la carte. Le palier touché porte son ×.
- Cadres : palier 2 touché → 3 paliers, fin J9 → « + » sur fin J12 : 5 paliers, le neuf « ? °C · ? j » → 1 palier seul, sans ×.

## Boosters UX
`effets-jauges`, `couper-palier` (+ des frontières), `retirer-palier`, `chercher`, et ceux de l5a.

## Contrôles
PAGE OK. Mots : 98 (65 hors données). Captures : `l5b-cadres.png`, `l5b-c1.png` à `l5b-c7.png`, `l5b-haut.png`.
À relire : à J0, le « + » touche l'étiquette « °C » de l'axe.
