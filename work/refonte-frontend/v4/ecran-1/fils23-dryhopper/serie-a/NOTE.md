# Série A, lot 23 Dryhopper : « le geste d'abord » (v0, voie r7a, 22-23.10)

Question : **« Quand ajouter Idaho 7 ? »**. Un seul facteur libre, le moment (ébullition par 5′, whirlpool, dry hop
actif ou après, jours de contact). La ligne de contexte fixe le reste : Idaho 7 (α 12,7 %, plage 9,5–14,9, mixte,
stock en icône), 4 g/L, US-05 et Stout 16D. Huit concepts : 2 en chaleur froide et 6 en tiède (aucune chaude, comme
le demande VOIE.md). Chacun a un geste différent qui dit « plus tôt / plus tard » sans rien lire.

Régénérer : `node generer.mjs --captures` (socle commun `socle.mjs`, un fichier par concept dans `concepts/`).
Jouer les gestes : `node jouer.mjs` (sortie dans `geste-a.json`).

## Concepts

| id | chaleur | ce qu'il montre | son geste | vraie valeur | levure |
|---|---|---|---|---|---|
| a1 | froide | y1b et la carte affinés : « Face à ta stout » en une ligne, 12 barres l5b au style, jauge d'amertume. Le dock porte au-dessus du rail un **relief** : le floral à chaque moment en violet, l'amertume hors du style en trait orangé. On voit où aller avant de glisser. | glisser le pouce sur le rail du dock, par 5′. Loupe des moments voisins ×5,8 (64 px contre 11 px). Sauts 60′, 10′, whirlpool, actif, après. | l'essentiel passe en 2 j de contact (Schmidt 2019, E08, Eureka!, qualitatif) | pont « Que change ma levure ? › » (outil propre) |
| a2 | froide | x3b réduit : la frise du brassin et de la cuve (brassage, levure active, au repos). Le bloc rouge Idaho 7 y est posé. Dessous, « ma bière → + Idaho 7 » en 12 colonnes au style (contour : avant ; plein : après). | glisser le bloc le long du brassin et de la cuve. Étirer son bord, ou **pincer à deux doigts**, pour les jours de contact. Dans le brassage, le bloc devient une goutte (14 crans, par 5′). | 1 h ou 96 h de contact, même nez en bière jeune (Titus 2021, E10, panel) | étape 2 : « 1 · Quand / 2 · Levure › » |
| a3 | tiède | la brasserie en colonne, de haut en bas : chaudière, whirlpool, fermentation, après. Le long de la chaudière, un trait orangé marque l'amertume hors du style. À droite, la réponse et 12 barres suivent la pastille. | **tirer vers le bas** : la pastille descend avec le moût, plus bas = plus tard. 20 px par 5′ en ébullition. | Idaho 7 en cuve dès la levure : linalol 38 µg/L (McCabe 2023, E03 ; tableau aplati, à vérifier) | pont |
| a4 | tiède | une carte par étape (ébullition, whirlpool, actif, après). Les voisines dépassent au bord avec leurs valeurs. Au-dessus, quatre pastilles donnent le floral de chaque étape. | **balayer ← →** entre les étapes, **rouler ↑ ↓** le chiffre (minutes ou jours) dans la carte. | E08 (l'essentiel en 2 j), sur les cartes de dry hop | étape 2, de deux façons : la nav « 2 · Levure › » et la **dernière carte** du paquet, « Et avec quelle levure ? » |
| a5 | tiède | le brassin en horloge : un anneau de 60′ à « après », plus épais là où le floral monte. Un arc orangé intérieur marque l'amertume hors du style. | **tenir** la pastille Idaho 7 : le temps coule (150 ms par cran) de 60′ à la cuve au repos ; **lâcher** pour ajouter. ‹ › déplacent d'un cran. | en cuve, le floral monte 24 h, le résineux retombe après 6 h (Wolfe 2012, E05, Cascade) | étape 2 |
| a6 | tiède | ce qu'on veut d'abord : une barre floral (ta demande « plus florale ») et une barre d'amertume, chacune avec sa poignée. Le moment se lit en haut, sur une frise passive. Les 11 autres familles suivent. | **tirer la barre** du floral, ou repousser l'amertume : le moment se pose au plus tôt qui donne cette valeur. À valeur égale, il prend le plus floral, puis le plus court. | l'essentiel en 2 j, tirer plus longtemps ne donne rien (E08) | pont |
| a7 | tiède | le graphe est la commande : courbes floral, tropicaux, baies, agrumes et résineux selon le moment, sur la zone du style. Dessous, la courbe d'IBU avec la bande 50–70 du style ; les points orangés sont hors du style. | **balayer le graphe** du doigt : le curseur se pose sur un moment, la lecture et les 12 barres suivent. | E08 | pont |
| a8 | tiède | quatre postes en tuiles : chaudière, whirlpool, en fermentation, au repos. Chacune donne son floral et son amertume. | **déposer** la pastille rouge dans un poste (ou toucher la tuile) ; ‹ › dans le poste pour les minutes ou les jours. | 1 h ou 96 h, même nez (E10) | pont |

Ce que la série apprend, sans texte : à chaud, Idaho 7 sort la stout de sa bande d'amertume (60′ ~162 IBU, 10′ ~97,
whirlpool ~75 : trop amer, au-dessus de 50–70). Le dry hop donne le plus de floral (~+22 en actif, ~+23 après) et
garde 60 IBU. Au-delà de 2 à 3 j, rien ne bouge. Le résineux est déjà hors du style (ta dégustation) et monte
encore de ~+14.

Levure : 3 concepts en étape 2 de Dryhopper (a2, a4, a5) et 5 avec un pont vers l'outil Levure (a1, a3, a6, a7,
a8). Les liens mènent aux écrans de la carte (`fils22-carte/levure-etape`, `levure-outil`).

Descripteurs : option A. Les mots de la fiche d'Idaho 7 (Beer Maverick) entrent tous dans une famille : thé noir
en Herbacé, cassis en Baies, papaye en Tropicaux. Aucune part « autres ».

## Baseline

Plancher repris dans les huit concepts :
- la ligne de contexte sans contrôle (`y1b-ligne-contexte`) ;
- l'α du lot puis sa plage, le rôle en mot (« mixte »), le stock en icône ;
- au style par défaut, avec la lentille Absolu (zones recalculées) ;
- le code couleur et les pictos au trait (ceux de la base) ;
- les barres de type l5b (zone du style, rond « ma bière », barre « avec ») et l'inconnu hachuré « ? », jamais 0
  (`y1b-bandes-style`) ;
- la légende derrière un « ? » de 26 px, fermée au repos ;
- l'appui long sur « Idaho 7 », qui ouvre la vraie fiche : α, mots par famille sourcés « 1 fiche : Beer Maverick »,
  radar silhouette avec l'inconnu hachuré, goût. Le survol long l'ouvre aussi.
- l'ordre de la carte (titre-question, contexte, lentille, réponse, figure, pont) ;
- le résineux de ta dégustation une seule fois (a1).

Repris de y1b :
- le geste « glisser le moment comme un curseur, par 5′ » : a1, a3, a4, a5 et a8 descendent au pas de 5′, a7 au
  cran du graphe ;
- « Face à ta stout » (a1, a2, a3, a8) ;
- la jauge d'amertume (a1, a2) ;
- le dock sous le pouce (a1) ;
- l'honnêteté de y1b : « ≈ interpolé » entre deux points calculés (60′ → 10′ → whirlpool), barre pâlie, « ~ »
  réservé au simulé.

x3b réduit : sa cuve jour après jour et « ma bière → + 1 dry hop » (a2). L'écran Dryhopper de la carte sert de
point de départ à a1 (rail, loupe, données).

Écarts, chacun avec sa raison :
- **Dock sous le pouce absent de a2 à a8.** Chaque série A cherche un autre geste que le rail (VOIE.md : « cherche
  d'autres gestes »). Le dock reste dans a1.
- **Barres l5b remplacées par les colonnes de x3b (a2).** x3b est la baseline nommée pour « ma bière → 1 dry hop ».
  Les colonnes en gardent le sens l5b : zone du style, avant en contour, après plein, dépassement en orangé.
- **Pastille de famille de y1b (« dans la 16D, par floral ⌄ ») non reprise.** Le floral est la cible de ta
  dégustation et il est mis en avant partout. La pastille de critère est à greffer en passe 2 : elle ne change que
  l'affichage, pas un facteur.
- **Levure en pastilles et second houblon « puis » (y1b) non repris.** Ce sont deux autres facteurs, que D98 et la
  carte du conseil excluent de Dryhopper. La levure vit à l'étape 2 ou dans son outil ; « puis » relève d'un autre
  outil.
- **Radars m4 et h4 seulement dans la fiche.** L'écran Dryhopper de la carte n'en avait pas : on y lit une
  évolution selon le moment. La silhouette radar reste à l'appui long.
- **a6 n'atteint pas toutes les minutes par le floral.** Tirer le floral saute aux moments qui donnent cette valeur.
  La poignée d'amertume atteint chaque cran de 5′ en ébullition.
- **Le jour d'entrée du dry hop est fixé (a2 : J1 en actif, J7 après).** La grille du moteur ne distingue que
  actif et après ; seuls les jours de contact varient.

Honnêteté :
- « ~ » pour le simulé, « ≈ » pour l'interpolé (minutes 55′ à 15′, 5′ et 0′ pour l'arôme ; l'IBU interpolée
  entre 60, 30, 15, 10, 5 et 0) ;
- Pépins et Melon hachurés « ? » ;
- l'IBU à cru écrite « à cru ? » (non modélisée) ;
- chaque vraie valeur porte « mesuré », sa source et sa référence E… ;
- E03 vient d'un tableau aplati, à vérifier, et l'étude est une co-fermentation (houblon au pitch), pas un dry hop
  strict ; le texte dit « en cuve dès la levure ».

Données : la grille d'Idaho 7 à 4 g/L avec US-05 (`profils-simules.json`, reprise par l'écran de la carte). Le
générateur vérifie qu'elle concorde avec la grille (floral actif 3 j) avant d'écrire (M07).

## Contrôles joués une fois (v0)

G1, `controle-commun.mjs … a1 … a8 --page=etat.html --sans=mots` : **COMMUN OK**. Couleurs, au style, survol,
blocs, contraste, fiche, standard, trait, légende, parlant et brutes passent tous.

**D98** (`controle-une-question.mjs … --page=etat.html`) : **UNE-QUESTION OK (1 groupe libre : moment)**.

| page | contrôles libres | contexte |
|---|---|---|
| a1 | 6 | houblon, dose, levure, base |
| a2 | 2 | idem |
| a3 | 1 | idem |
| a4 | 7 | idem |
| a5 | 3 | idem |
| a6 | 2 | idem |
| a7 | 1 | idem |
| a8 | 6 | idem |

**D99** (`controle-acquis.mjs … --page=etat.html`) : **ACQUIS ECHEC 32 problème(s)**. Chaque page est à 0/4 :
radar, chimie, panel OSU et vraies valeurs absents. D99 est le contrôle d'un écran Comparer : son en-tête dit
« un écran Comparer porte les quatre acquis ». Il ne s'applique pas tel quel à Dryhopper. Pour la passe 2, le
pilote dira si ces acquis doivent venir « à un toucher » ici.

**MOTS** (`mots-premier-ecran.mjs … --max=80 --page=etat.html`) : **MOTS ECHEC 8/8 au-dessus de 80**.

| page | mots |
|---|---|
| a1 | 103 |
| a2 | 103 |
| a3 | 102 |
| a4 | 207 |
| a5 | 91 |
| a6 | 82 |
| a7 | 85 |
| a8 | 112 |

Les 12 familles, nom et valeur, en font 24 à 36. Dans a4, les cartes voisines visibles au bord comptent.

Gestes joués au doigt (`jouer.mjs`, `geste-a.json`) : **GESTES OK 8/8**, le simulé bouge à chaque geste.
- a1 : actif 3 j ~+22 → 45′ ≈+5, ≈150 IBU.
- a2 : bloc glissé puis étiré → après 7 j ~+23.
- a3 : pastille tirée en haut → 55′ ≈+3.
- a4 : balayé vers l'ébullition, roulé → 45′.
- a5 : tenu 1,9 s → whirlpool ~+14, ~75 IBU.
- a6 : floral tiré à gauche → actif 1 j.
- a7 : graphe balayé → 15′ ≈+12, ~110 IBU.
- a8 : pastille déposée dans Whirlpool → ~+14.

## Ce qui casse ou reste ouvert

- **Mots** : tous au-dessus de 80. En passe 2 : replier les familles sans effet (Pépins, Melon, Épicé) ou cacher le
  contenu des cartes voisines de a4.
- **a5** : tenir repart toujours de 60′. Pour aller plus tard qu'un réglage, il faut retenir tout le trajet (3,6 s
  au total), ou passer par ‹ ›.
- **a6** : le floral de la cuve plafonne à ~+22 / ~+23 ; la poignée bouge peu entre actif et après. L'amertume est
  la poignée la plus parlante.
- **a7** : les courbes ont une clé (5 familles, picto et nom) visible au repos. C'est un étiquetage, pas une
  légende de codage, mais à surveiller (D89).
- **a2** : le pincer à deux doigts n'a pas été joué par `jouer.mjs` ; seul l'étirement du bord l'a été.

## Captures

Dans `captures/` :
- `aN-390.png` : premier écran, actif 3 j, les huit ouverts ;
- `aN-60-390.png` : à 60′, les huit ouverts ;
- `aN-geste-390.png` : pendant le geste, ouverts pour a1 à a8 ;
- `a1-fiche-390.png` et `a5-legende-390.png`, ouverts ;
- `a5-fiche-390.png` et `a1-legende-390.png`, non ouverts (même socle que les deux précédents).
