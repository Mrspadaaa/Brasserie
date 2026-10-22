OK — planche F : huit cadrages de clou, cannelle et vanille, sur vraies cartes, contrôles verts

## Fichiers écrits
Tous dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/` :
- `dessins.mjs` (les huit dessins et les masques des croisements) ;
- `generer.mjs`, qui écrit `etat.html` (la page HTML est sans doute ignorée par git, M05 ; le générateur la refait) ;
- `capturer.mjs` ;
- `NOTE.md` ;
- `captures/planche-390.png`, `captures/tailles-390.png`, `captures/cartes-390.png` ;
- `captures/travail/` : `loupe.mjs`, `zoom.mjs`, `essais.mjs`, `loupe.png`, `zoom.png`.

Rien hors de la zone possédée (`git status --short` vérifié).

## Propositions (chaleur chaude pour les huit)
| id | épice | genre | ce qu'elle dit à un brasseur | risque de confusion |
|---|---|---|---|---|
| f1-croises | mélange (cannelle et girofle) | croisé | les deux épices qu'il a nommées, en bouquet | à 12 et 16 px, croix chargée ; se nomme à 24 px |
| f2-clous-croises | girofle | emblème | deux clous en sautoir, boutons en haut | « outils croisés » ; même croix que f1 |
| f3-poignee | girofle | tas | la poignée de clous jetée dans la cuve | « fleur de lys », « coquille » à 16 px |
| f4-cuve | girofle | en situation | un clou qui tombe sur le moût | « eau » ; la vague prend de la hauteur |
| f5-bout-roule | cannelle | gros plan | l'écorce roulée en spirale, cadrée au ras | « rouleau », « épingle » à 12 px |
| f6-crosse | vanille | silhouette | la gousse longue, sa crosse | « plume », « haricot » |
| f7-ouverte | vanille | gousse ouverte | la gousse fendue sur ses graines | « feuille » (voisine d'Herbacé), « graine » |
| f8-cote-a-cote | mélange (vanille et girofle) | paire | la gousse et le clou en nature morte | à 12 px, la gousse devient un trait |

Lecture à voix haute, honnête : à 12 px, seul f4 se nomme (et f8 à demi). f2, f5 et f8 se nomment à 16 px ; f1, f3,
f6 et f7 seulement à 24 px. Trouvaille réutilisable : un bouton de clou presque plein (rayon 1,7 sous le trait de
2,571) fait lire « clou de girofle », alors qu'un bouton en anneau fait lire « clé » ou « épingle ».

## Sorties décisives
- G1 : `PLANCHE OK (8 variantes) · 8 épices réelles, 4 différentes`
- G2 : `TRAIT OK` (184 pictos de famille, 0 faute)
- G3 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G4 : `EXISTENT OK 5`
- G5 : `NOTE OK`
- G6 : ce fichier (`planche-390.png`, `tailles-390.png`, `cartes-390.png`, LEÇON PROPOSÉE)

## Captures ouvertes
- `captures/planche-390.png` : la page entière ; pas de défilement, le sommaire des huit en haut.
- `captures/tailles-390.png` : 12, 16 et 24 px, contre la feuille et les brins.
- `captures/cartes-390.png` : Saaz, Cascade et Hallertau Mittelfrüh pour chaque proposition.
- Pour juger : `captures/travail/loupe.png` (vrais pixels ×4 et densité 3) et `captures/travail/zoom.png` (carte Saaz en
  densité 3).

## Prédiction
« f4 et f8 on voit le clou, c'est l'idée ; les croisés et la poignée c'est trop chargé en petit, et la vanille on
dirait une plume. »

DÉCISION À PRENDRE : f1 et f2 sont deux croix. Le critique n'en garde qu'une, ou les deux s'il y voit deux idées
(mélange ou emblème).

CONNAISSANCE : picto du clou de girofle, à 16 px et moins. Le bouton se dessine presque plein (cercle de rayon 1,7 au
trait de 2,571), sur une couronne de trois sépales serrés (pas en bras levés) et une tige effilée. En anneau, il se lit
« clé » ou « épingle ». À noter dans [[pictos-familles]].

LEÇON PROPOSÉE : au trait de 2,571 sur 24, une composition de deux ou trois objets ne se lit plus à 16 px. Avant de
dessiner une série de compositions, essayer la lecture d'un seul objet par la loupe (vrais pixels et densité 3), puis
ajouter les objets un par un. Ici, une quarantaine d'essais pour trouver ce seuil (rôles : concepteur ; contrôle : loupe
de travail, pas de contrôle automatique).
