r6i · Sans Nelson Sauvin, à effet égal (lot 22, Comparer, stout 16D).

## Choix portés
- Radar : r3
- Base : effet égal (agrumes)
- Porte : oui (Nelson Sauvin)
- Descripteurs : A

## L'angle, et ce que j'en ai fait
Point de départ : « combien de grammes de chaque candidat pour approcher Nelson Sauvin ». Enrichi en
trois points :
- **La cible est Nelson Sauvin à 4 g/L**, la dose égale du lot, et pas la référence Cascade 4 g/L du
  fichier. Chaque candidat est montré à la dose qui donne le même gain d'agrumes, avec la même règle
  que `extraire-comparer.mjs` (interpolation linéaire sur la grille 1, 2, 4, 8 g/L). Résultat : Cascade
  ~2,2 g/L, Idaho 7 ~4,1 g/L, Galaxy ~1,3 g/L.
- **Un taux d'échange** : pour 1 g de Nelson, il faut 0,56 g de Cascade, 1,02 g d'Idaho 7 ou 0,33 g de
  Galaxy. Je l'ai recalculé à la cible du fichier (Nelson 7,4 g/L = Cascade 4 g/L) : 0,54, 1,02 et
  0,33. Il est stable, et c'est ce qui sert au brasseur pour une autre recette.
- **Ce que l'égalité ne remplace pas** : à agrumes égaux, chaque candidat apporte autre chose
  (+ et − en pictos, barres famille par famille). Et 67 % des mots de Nelson restent hors des
  12 familles, même avec A (vin blanc, raisin, sauvignon blanc). Ses thiols sont classés « forts » par
  Hopsteiner, sans chiffre. La page le dit au lieu de faire croire qu'un candidat le remplace.

## Ce qui tient
- **Premier écran : la réponse.** Nelson est épinglé en haut (« Je n'ai pas », α des fiches 10–14 %,
  mixte, icône d'achat, 4 g/L et 80 g). Viennent ensuite les trois candidats, chacun avec :
  - nom, α du lot, rôle en mot, stock en icône ;
  - la dose ~ en gras, les grammes pour 20 L ;
  - une piste de dose de 0 à 5 g/L, avec le trait noir des 4 g/L de Nelson : l'escalier se lit seul ;
  - les familles en plus ou en moins par rapport à Nelson, en pictos.

  Cascade porte « ~plus proche » (écart total ~2,8 crans, contre 3,8 pour Galaxy et 6,5 pour Idaho 7).
- **Un seul facteur libre** : le candidat mis en avant (trois boutons `aria-pressed` dans
  `data-libre="houblon"`). Au toucher, ses barres et le pont vers Dryhopper suivent. La dose, la base,
  le moment, la levure et la bière sont fixés sur la ligne de contexte.
- **Radars r3** : quatre petits radars aux mêmes 12 axes, dont Nelson. Chaque candidat porte la
  silhouette de Nelson en trait noir fin. La zone grise montre la 16D, et une bande pâle va de bas à
  haut : le haut simulé sort presque partout du cadre, et cette incertitude se voit. Le point orangé
  marque ce qui est hors du style : le résineux de la stout, déjà trop haut à la dégustation du 18.10.
  Les familles inconnues sont hachurées, avec un picto pâle, jamais à zéro. Les axes portent des
  pictos seuls (m4 et h4). La lecture au style ou en absolu change l'échelle des radars et des barres.
- **Barres de l5b** (candidat mis en avant, au-dessous) : 12 familles dans l'ordre du style. On y
  voit la zone pâle de la 16D, la barre simulée et sa plage, l'orangé au-delà du style, le trait noir
  de Nelson et le trait gris de la bière avant. L'écart à Nelson est en crans ; « Nelson ? » s'affiche
  là où le moteur ne chiffre pas Nelson.
- **Panel OSU** (mesuré, H22, au repos) : agrumes et herbacé de Cascade selon la dose. Un trait
  marque ~2,2 g/L, la dose d'effet égal de Cascade, posée sur la partie montante de la courbe, loin du
  plateau de 8 g/L. Les conditions qui diffèrent (24 h, 13–15 °C) sont écrites.
- **Chimie** (à un toucher) : 9 composés et l'huile, pour les quatre houblons. Chaque ligne a les
  pictos de ses familles. On y lit les plages publiées, « inconnu » hachuré, « non détecté », et
  « < 10 ? » à confirmer.
- **Vraies valeurs** (à un toucher) : 6 mesures en bière, chacune avec unité, source et conditions
  (E06 Feng 2015, H12 Kishimoto 2008, H20 Lafontaine 2019, E03 McCabe 2023). Galaxy n'a pas de mesure
  au dépôt : c'est écrit.
- **Option A** : sur la fiche de Nelson Sauvin (appui long), « groseille à maquereau » et
  « gooseberry » passent en Baies 2/2. Il reste 7 mots sans famille. Ailleurs, A ne se voit pas :
  Cascade, Idaho 7 et Galaxy n'ont pas ces mots. A ne change pas non plus le moteur : la barre Petits
  fruits de Nelson reste « ? », et la page le dit.
- **Fiche g1** (runtime de l8g) : alimentée par comparer-stout.json. Elle montre l'α du lot, ou la
  plage des fiches pour Nelson, qui n'est pas en stock.

## Écart à la baseline
- Comparer v4.9 compare des fiches. r6i compare la bière simulée après l'ajout, face à une cible.
- La piste de dose est une forme nouvelle.
- Le radar r3 garde ses petits multiples, et y ajoute la silhouette de la cible et une bande
  d'intervalle.

## Ce qui casse
- Le résineux de la stout (83, dégustation) sort du style sur les quatre radars. Le pic orangé se
  ressemble d'un radar à l'autre et attire l'œil plus que ce qui les distingue.
- La bande d'intervalle a presque la même forme partout : le haut non borné vient des composés de
  Nugget, dans la bière de base.
- La confiance du moteur est faible pour Nelson (« ~ peu sûr ») : toute l'égalité repose sur elle.
- La part « autres » n'est pas dessinée (c'est l'option B). `controle-sans-famille` (D100, hors
  GATES) échoue donc sur Nelson, à 83 % : c'est attendu avec A.
- Dans les « + », le résineux d'Idaho 7 n'est pas orangé : l'orangé n'apparaît que sur les radars et
  les barres.
- Le picto « épicé » est l'ancien, déjà refusé trois fois. La planche r4 reste à trancher.
- 78 mots au premier écran : la marge est mince. Le titre des barres est poussé sous le pli par un
  espace de 24 px.

## Contrôles (GATES de la voie)
COMMUN OK (sans MOTS) ; MOTS OK (78) ; UNE-QUESTION OK (1 groupe libre : houblon) ;
ACQUIS OK (4/4 : radar r3 et OSU au repos, chimie et valeurs à un toucher) ; ALPHA OK (4 voies).

## Pire contraste
4,96:1 : « Agrumes » (#856e0c, ton texte des agrumes, 12 px) sur blanc.
