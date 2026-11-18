# En-têtes q1 à q6 sur g-d1 (16.11)

Ce qu'il a demandé : « Plus de place au graph et plus d'info sur ces mouvements, moins d'info sur le reste ».
Base : `paliers/g-d1.html`, inchangée sous l'en-tête. Seuls `.gd-hd` et `#mini` sont masqués ; un en-tête neuf est inséré dans `#lhead`.
Outils : `en/build-q.mjs` écrit q1 à q6, `en/cap-q.mjs` fait les captures et les contrôles.
Les captures, en 390 × 844 et DPR 2, sont dans `en/cap/` : `qN.png` en clair, `qN-cave.png` en cave, plus `base.png` et `base-cave.png`.

Les données viennent de la série de `c85/sources2/proto.html`, avec `serie()` et `flux()` rejoués :
- la caisse (trait gris) ;
- le libre (trait bleu) ;
- le mis de côté (hachures).

Le creux est réel : libre de 113 en S24, pour une caisse de 1 396, moins 1 140 mis de côté pour le frigo et 143 pour les sols.
Chaque montant affiché est celui de l'événement. Le saut de la courbe, lui, est le net de la semaine : ventes +120 et loyer compris.

## Les six

Hauteur d'en-tête = haut de la frise. Base : 146 px, soit 17,3 %, dont une courbe de 52 px.

| v | idée | en-tête | courbe | mouvements montrés |
|---|---|---|---|---|
| q1 | **Le repère du creux porte le chiffre.** Plus de ligne de chiffre : « 113 CHF à dépenser · S24 » est posé en haut du pointillé, qui descend au creux. Sauts verts et rouges sur la courbe, avec leur montant. | 126 px, 14,9 % | 70 px | 7 montants : +910, −900, −1 080, +2 140, −2 800, +2 450, −1 800 |
| q2 | **Une ligne, puis le flux en miroir.** Une seule ligne de texte (113, période, retards, plein écran). Sous la courbe, un histogramme du net de chaque semaine : entrées vers le haut, sorties vers le bas. | 138 px, 16,4 % | 48 + 44 px | 52 barres, dont 5 montants : +910, −900, +2 140, −2 800, +2 450 |
| q3 | **Fanions.** Chaque grand mouvement a son fanion relié à son saut. Le chiffre est le fanion bleu du creux. Le nom s'affiche si la place le permet, sinon le montant seul. | 132 px, 15,6 % | 55 px | Marché +910, Embout. −2 800, +1 180, +2 450 |
| q4 | **Deux rives.** Les entrées sont nommées au-dessus de la courbe, les sorties au-dessous, chacune reliée à sa semaine par un pointillé. | 130 px, 15,4 % | 58 px | Marché +910, Festival +2 450, Hotte −900, Embout. −2 800, Frigo −1 800 |
| q5 | **Le creux expliqué.** Une accolade couvre la descente S13 → S24, sur fond teinté. Ses causes sont écrites au-dessus : Embout. −2 800, Fûts −1 080, Hotte −900, frigo 1 140 mis de côté (hachures). Les autres sauts ne sont que des marques. | 134 px, 15,9 % | 56 px | 3 causes et le mis de côté, plus 4 sauts marqués |
| q6 | **Courbe-bandeau et bulles (forme chaude).** Courbe bord à bord, sur 390 px. Chaque mouvement de 900 ou plus est une bulle dont la surface suit le montant. Les plus grands ont leur montant. | 128 px, 15,2 % | 70 px, 382 de large | 10 bulles, dont 5 montants |

Gardé partout :
- 113 CHF « à dépenser », avec « sans passer sous 0 » dans le nom accessible ;
- le plus serré, S24, et son point ;
- les retards, « ⏲ 2 » ;
- la période, « 6 sem. ⌄ », qui ouvre 3 mois, 6 mois, An et le tri ;
- le plein écran, en icône nue ;
- la courbe de l'année et sa fenêtre de six semaines, avec ses poignées.

Le texte de l'en-tête passe de « sans passer sous 0 · S24 » à « CHF à dépenser · S24 ». Les pastilles mesurent 26 px de haut, contre 32 à 44 dans la base.

Écarts à signaler :
- « 2 en retard » est réduit à « ⏲ 2 », comme dans g-d1, alors que la perte n° 13 de CHOIX-CALENDRIER le relève. La fonction `ret(true)` du build remet les mots.
- q2 et q4 n'ont pas de mois : les noms et les montants y servent de repères.
- Les noms complets ne s'affichent qu'au toucher, par `<title>` dans la maquette statique.

## Contrôles (`node en/cap-q.mjs base q1 q2 q3 q4 q5 q6`)

```
base tête 146 px (17.3 %) · petits 0 · hors 0 · chevauchés 0 · coupés 0 · cibles<24 0 · sous le + 0 · rangées 56,192,230,316,380,406,470 → TETE OK
q1 tête 126 px (14.9 %) · petits 0 · hors 0 · chevauchés 0 · coupés 0 · cibles<24 0 · sous le + 0 · rangées 56,192,230,316,380,406,470 → TETE OK
q2 tête 138 px (16.4 %) · … → TETE OK
q3 tête 132 px (15.6 %) · … → TETE OK
q4 tête 130 px (15.4 %) · … → TETE OK
q5 tête 134 px (15.9 %) · … → TETE OK
q6 tête 128 px (15.2 %) · … → TETE OK
```

Ce que le contrôle vérifie :
- **Le reste est identique** : le haut de chaque rangée, relatif à la frise, est le même que dans la base (56 … 470 px). Le + reste au même endroit (295, 728), à droite et à 16 px au-dessus des onglets, sans rien couvrir. Aucun bouton ne sort de l'écran.
- **Le texte** : rien sous 14 px, et aucun texte coupé ou chevauché. Le contrôle lit les boîtes rendues des textes HTML et SVG de l'en-tête.

## Boosters (boosters-ux)

- `mouvements` : la courbe entière. Besoin : lire. Glisser dessus doit nommer la semaine et ses mouvements ; rien de dynamique ici, c'est une maquette statique.
- `fenetre-semaines` : la fenêtre (choisir), à faire glisser.
- `periode` : la puce, qui ouvre le menu.
- `a-depenser` : le chiffre, qui ouvre le détail.
- `retards` : la pastille.
- `creux` (q5 seulement) : la ligne des causes, sur laquelle on peut toucher.

Points de la check-list :
- **B2 OK** : 113 en bleu, de 17 à 24 px, domine. La seule masse noire est la puce de période, comme dans la base.
- **B6** : 14 px au plus petit. Le nombre de tailles reste à mesurer.
- **B13 OK** : aucune cible sous 24 px.
- **B7** : contraste non mesuré. Le thème de l'app est appliqué, cave par défaut et clair, avec ses jetons `--ok`, `--bad` et `--fin` dans les deux thèmes.

## Prédiction

q4 et q1 se lisent en trois secondes : on voit ce qui fait monter et descendre la caisse, et pourquoi le creux tombe en juin.
q6 risque le « fouillis » : ses bulles se chevauchent dans la descente.
