# p4b3 — « L'agenda du brassin » (passe 4 sur a1, voie dh4b, 24.10)

**Chaleur : chaude.** Forme libre sur a1 : le dock devient le calendrier du brasseur. Le jour du brassage (ébullition de
60′ à 0′, whirlpool), puis J+1 à J+14 ; sur les jours, la courbe de densité de la levure (active J+1 → J+5, puis finie).
Le houblon est posé là où il entre (picto plein), la bande colorée dit combien de temps il reste dans la bière, et elle
pâlit là où plus rien ne bouge. La figure d'a1 (barres l5b avec contour, amertume, « Face à ta stout », « contre ★ »,
mesuré, pont Levure) est gardée telle quelle ; le rail d'a1 reste sous l'agenda, avec sa loupe.
Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b3`.

## Améliorations du brief prises
- **3, la courbe de levure** : elle est la frise. « levure active » de J+1 à J+5, « finie » ensuite ; le dry hop actif est
  celui qui tombe dans la bosse (biotransformation possible, non quantifiée), l'après celui qui tombe sur le plateau.
- **5, deux facteurs à l'écran** : la durée de contact est absorbée par le geste. Dans l'ébullition, le pouce place l'entrée
  et la bande court jusqu'à 0′ ; en dry hop, l'entrée est fixée par la fermentation (J+2 actif, J+7 après) et le pouce
  tire la bande (1, 2, 3, 5, 7 j). Plus de boutons de jours : la pastille de réponse dit « J+2 · 2 j » ou « à 20′ de la fin ».
- **1, l'interpolation dite** : dans la case du brassage, les crans calculés (60′, 10′, 0′) sont des traits pleins, les
  crans interpolés des pointillés ; points calculés sur le rail.

## Greffes
Agenda de f5 ; houblon posé sur la courbe de g6 ; « sans gain » de e2 (la bande pâlit au-delà de 2 j) ; « le meilleur »
rappelé de g4 (★ sur l'agenda, pastille verte « ★ J+2 · 2 j ») ; barres, contour, loupe et « contre ★ » d'a1.

## Ce qui tient
- Il pense en brasseur : un calendrier, une densité qui chute, un sachet de houblon posé un jour donné.
- Un seul geste pour le moment et la durée, D98 vert sans groupe de jours.
- 38 mots hors données ; un écran, rien sous le pli ; loupe ×5,6.

## Ce qui casse
- L'agenda est serré (88 px de haut) : les libellés J+2, J+5, J+7, J+14 sont à 11 px ; à relire sur un vrai téléphone.
- Pendant le geste, la loupe (placée au-dessus de l'agenda pour ne pas le couvrir) masque la ligne mesuré / Levure.
- La courbe de densité est une forme type, pas sa mesure : « à confirmer à la densité » reste derrière le « ? ».

## Contrôles
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** — 1 contrôle (le rail) |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 38 mots |
| `controle-panel` (hors critères) | PANEL ECHEC : p4b3 0,47 de remplissage (le plus bas des cinq) |

Geste : d'actif · 2 j (« ★ J+2 · 2 j », ~+22, 60+?) à 20′ (« à 20′ de la fin », ≈+11, ≈119, bande orangée de 20′ à 0′,
« trop amer »). Captures ouvertes : `captures/p4b3-premier-ecran.png`, `p4b3-pendant.png`, `p4b3-apres.png`,
`p4b3-apres-7j.png` (après · 7 j : bande pâle « sans gain » de J+9 à J+14, mesuré Titus 2021).
