# p4b3 — « L'agenda du brassin » (passe 4 sur a1, voie dh4b, 24.10 ; retouches du conseil dh4)

**Chaleur : chaude.** Forme libre sur a1 : le dock devient le calendrier du brasseur. Le jour du brassage (ébullition de
60′ à 0′, whirlpool), puis J+1 à J+14 ; sur les jours, la courbe de densité de la levure (active J+1 → J+5, puis finie).
Le houblon est posé là où il entre (picto plein), la bande colorée dit combien de temps il reste dans la bière, et elle
pâlit là où plus rien ne bouge. La figure d'a1 (barres l5b avec contour et rubans, amertume, « Face à ta stout », « contre
★ », mesuré, pont Levure) est gardée ; le rail d'a1 reste sous l'agenda, avec sa loupe.
Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b3`.

## Retouches du conseil (`conseil-dh4/verdict.md`), avec leur mesure
- **Noyau et Baies** : « ? → ~+21 », stub hachuré au pied de la barre ; aucun « 0 » (`valeursZero: 0`).
- **Loupe hors figure** : la loupe devient compacte (40 px, « 20′ ≈+11 » sur une ligne) et se pose en tête du dock, sur la
  seule ligne des titres de l'agenda (brassage · WP · fermentation · après, 60′ · 0′ · J+n), sortie du dessin en HTML.
  Intersection mesurée au DOM avec les barres (`#p4b3-fig`) et l'agenda (`.p4b3-ag` : cellules, courbe, bande, houblon) :
  **0 px²** à 20′, au whirlpool et à après · 7 j.
- **Agenda ≥ 120 px** : titres 38 px + agenda 84 px = **122 px** (DOM) ; **libellés à 12 px** (titres HTML et textes SVG, DOM).
- **« levure active » hors du chemin du pouce** : écrit en haut des cellules de fermentation (y 14), à droite de ★ ; le
  houblon et la bande sont 40 px plus bas (y 47 à 69) ; « finie · forme type » sous la bande, jamais dessous.
- **Courbe « forme type »** : tracée en pointillé (4 · 3) et nommée « forme type » ; sa confirmation à la densité reste
  derrière le « ? ».
- **Rubans d'a1 remis** : sous chaque barre, les 24 moments du rail (case cerclée au moment, hachure à l'inconnu, trait
  orangé hors style), amertume comprise.

## Améliorations du brief prises
- **3, la courbe de levure** : elle est la frise ; l'actif tombe dans la chute de densité, l'après sur le plateau.
- **5, deux facteurs à l'écran** : la durée de contact est absorbée par le geste (la bande, 1 · 2 · 3 · 5 · 7 j) ; pas de
  boutons de jours ; la pastille dit « ★ J+2 · 2 j » ou « à 20′ de la fin ».
- **1, l'interpolation dite** : dans la case du brassage, crans calculés pleins, crans interpolés en pointillé ; points
  calculés sur le rail.

## Greffes
Agenda de f5 ; houblon posé sur la courbe de g6 ; « sans gain » de e2 ; « le meilleur » rappelé de g4 ; barres, contour,
rubans, loupe et « contre ★ » d'a1 et b4.

## Ce qui tient
- Il pense en brasseur : un calendrier, une densité qui chute, un sachet de houblon posé un jour donné.
- Un seul geste pour le moment et la durée (D98 vert sans groupe de jours) ; 45 mots hors données ; un écran ; loupe ×5,6.

## Ce qui casse
- Pendant le geste, les titres de l'agenda disparaissent sous la loupe (40 px) ; les cellules, la courbe et la bande restent.
- Les rubans d'a1 densifient la figure (13 lignes à deux rangées) : barres de 16 px, rubans de 11 px.
- La courbe de densité reste une forme type, pas sa mesure.

## Contrôles (rejoués après les retouches)
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** — 1 contrôle (le rail) |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 45 mots |

Geste : d'actif · 2 j (« ★ J+2 · 2 j », ~+22, 60+?) à 20′ (« à 20′ de la fin », ≈+11, ≈119, bande orangée de 20′ à 0′).
Captures ouvertes : `captures/p4b3-premier-ecran.png`, `p4b3-pendant.png`, `p4b3-apres.png`, `p4b3-apres-7j.png`.
