# Série B : la réponse d'abord (Dryhopper, « Quand ajouter Idaho 7 ? »), v0

Voie r7b-dryhopper, 22-23.10. Huit concepts minimalistes, `b1/etat.html` à `b8/etat.html`, produits par
`generer.mjs`. Les captures sont faites par `captures.mjs` : le premier écran, le geste joué au doigt jusqu'à 10′,
la fiche ouverte par appui long et la lecture absolue.

Chaque concept ouvre sur la même réponse, calculée et non écrite à la main : **« Dry hop actif, 2 j : floral ~+22,
résineux ~+14 (après : ~+20) »**. Le moment se règle ensuite au doigt. La ligne « à 10′, contre ★ : floral ~−9 ·
résineux ~−6 · 97 IBU, trop amer » dit alors ce qu'on perd ou gagne, et l'épingle « ★ réponse » reste sur la frise.
Seule la représentation change d'un concept à l'autre.

## Concepts

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| b1 | froide | L'écran de la carte et y1b : barres l5b des 12 familles face à la zone 16D, « Face à ta stout, par floral », jauge d'amertume de toute la stout. Hors réponse, un trait noir marque la valeur de la réponse sur chaque barre. | frise en dock collant sous le pouce, loupe ×5,9 | E08, Eureka! : l'essentiel en 2 j | étape (« 1 Quand · 2 Levure », « Puis la levure › ») |
| b2 | froide | x3b réduit : la chaîne « Ma bière → + Idaho 7 → Levure › » sert de légende. 12 colonnes verticales : trait de ma bière, barre avec Idaho 7, zone 16D, chapeau orangé si la famille sort du style. | frise dont la partie dry hop dit « levure active / au repos » (couleur du rail), crochet E08 sous J1–J2 | E08 (crochet sur la frise) | étape (la chaîne) |
| b3 | tiède | Une balance : le plateau résineux contre le plateau floral, avec une mini-jauge de zone sur chaque plateau. Le fléau penche selon le solde floral − résineux. Le reste des familles en pastilles. | frise ; le fléau bascule à chaque moment | E03, Idaho 7 à la levure : linalol 38 ± 13 µg/L, ×4,8 le seuil (à vérifier) | pont (« Levure › Pomona : agrumes ~+13, floral ~+5 ») |
| b4 | tiède | Le podium des 5 moments calculés, classés par solde : ★ actif 2 j, après 2 j, whirlpool, 10′, 60′. Pour chacun, floral, résineux et IBU (orangé au-dessus de 70). | frise ; la ligne du moment est cerclée. Un moment hors podium (35′ ≈, actif 5 j) s'ajoute en ligne « · » | E07, Simcoe : l'ébullition donne cuit, végétal | pont |
| b5 | tiède | La courbe : floral et résineux au fil des moments, au-dessus de la frise et alignés sur elle. Le pic floral marqué ★, la zone florale de la 16D, l'ébullition 55′–15′ en « ≈ interpolé », le résineux « hors 16D ». | on gratte la courbe elle-même (`data-scrub`) ou la frise | E08 et E10 (Cascade : 1 h = 96 h au nez) | étape |
| b6 | tiède | Le radar 12 axes face à ta stout (acquis m4/h4, sans légende écrite) : polygone de ta stout en gris, Idaho 7 au moment choisi en violet, contour fin de la réponse quand on s'en écarte, zone 16D, Pépins et Melon hachurés. | frise | E03 | pont |
| b7 | tiède | Le plan floral × résineux : chaque moment est un point sur le chemin 60′ → WP · 10′ → actif → après. ↖ « ta demande », ★ sur la réponse, rond creux « avec Pomona », bande 16D (≤ 30) avec coupure d'axe. | frise ; le point violet suit le doigt | E10 | pont (le point « avec Pomona » en aperçu) |
| b8 | tiède | La carte de chaleur : 12 familles × les 24 moments de la frise, chaque case à l'intensité de sa famille. La colonne de la réponse est cerclée en violet, celle du doigt en noir ; le résineux est souligné d'orangé (hors style) et l'inconnu hachuré. | on gratte une ligne de la grille ou la frise ; les colonnes sont alignées sur la frise | E07 | étape |

- Chaleur : 2 froides (b1, b2), 6 tièdes (b3 à b8), 0 chaude (VOIE.md : « 2 froide, 6 tiède »).
- Levure en dernière étape de Dryhopper : b1, b2, b5, b8. Pont vers un outil Levure : b3, b4, b6, b7.
- Descripteurs : option B. Idaho 7 a 0 mot hors des 12 familles (12 sur 12 rangés, pack-fiches.json) : sa part « autres »
  est vide. Elle est dite dans la légende et dessinée vide dans la fiche (« autres : 0 mot sur 12, tous rangés »).
  D100 au seuil 0,25 : `SANS-FAMILLE OK (0 houblon(s) au-dessus de 25 %, rien à montrer)`.

## La réponse et ses données

- Grille `profils-simules.json`, Idaho 7, 4 g/L, US-05, 16D S1 ; profil avant : la dégustation (résineux 83).
- Solde (convention de la maquette, à valider) : Δfloral − Δrésineux − (IBU total au-dessus de 70). Parmi les solde
  égaux à 0,05 près, on prend le plus court. Valeurs : actif 1 j 8,3 ; actif 2 j 8,37 (= 3, 5, 7 j) ; après 2 j 3,2 ; whirlpool 0,4
  (75 IBU) ; 10′ −21,6 (97 IBU) ; 60′ −91,5 (162 IBU). Réponse : **actif, 2 j**.
- Points sur 100 (échelle du panel, comme l'écran de la carte), pas des crans : un même étalon pour floral et
  résineux, sans quoi la balance de b3 se contredit (floral +1,2 cran contre résineux +1,4 cran au style, mais +22
  contre +14 points).
- Ébullition 55′ à 15′, 5′ et 0′ : interpolés entre 60′, 10′ et whirlpool, marqués « ≈ » (comme y1b). IBU : par gramme
  de pack-fiches × 80 g, interpolés (≈) entre 60′, 30′, 15′, 10′, 5′ et 0′. À cru : « tenue » (non modélisé).
- Pomona (pont) : actif 2 j, grille Pomona. Agrumes ~+13 et floral ~+5 de plus ; confiance faible dans la grille.
- Vraies valeurs, ligne de la bonne variété lue (L14) : E03 Idaho-7 (et non Azacca), linalol 0,038 ± 0,013 mg/L, seuil
  8 µg/L cité par E01, lecture « texte aplati, à vérifier » reprise à l'écran. E08 Eureka! linalol, « transfert majeur
  pendant les 2 premiers jours ». E10 Cascade, « non distinguable par le panel » de 1 h à 96 h. E07 Simcoe et
  Hallertau, « cooked/veg, grassy, herbal » à l'ébullition. Chaque ligne porte `data-nature="mesure"` et
  `data-source`.

## Baseline

Plancher repris dans les huit concepts :
- titre en question ; ligne de contexte fixée (Idaho 7, α 12,7 %, mixte, stock en icône, 4 g/L, US-05, Stout 16D) ;
- geste de y1b, le moment glissé comme un curseur par 5′ de 60′ à 0′, puis whirlpool, actif et après par jours, avec
  la loupe (64 px par pas contre 10,8 px sur le rail : ×5,9, `captures/travail/geste-b.json`) ;
- « face à ta stout » ; code couleur et pictos au trait de la carte ; « Au style » par défaut avec la zone 16D, et
  « Absolu » ; légende derrière « ? » ; appui long, ou survol long sur ordinateur, sur Idaho 7 qui ouvre la fiche g1 courte
  (α du lot puis des fiches, rôle en mot, radar de la fiche, arômes n/N, goût) ;
- inconnu hachuré, simulé « ~ », interpolé « ≈ », orangé réservé au hors style.

Enrichi (L07) : la réponse calculée en tête ; l'épingle ★ ; la ligne « contre ★ » qui chiffre la perte ; l'IBU de toute
la stout pour les moments d'ébullition ; une vraie valeur sourcée par concept ; le stock en icône qui dit « 20 g, il
en faut 80 ».

Écarts, un acquis à la fois :
- b2 : la frise de x3b se lit « levure active / au repos », pas « actif / après ». C'est la même graduation ; le mot dit
  ce qui se passe dans la cuve.
- b5 et b8 : la représentation est aussi la surface du geste (on gratte la courbe ou la grille). La frise reste en
  dessous, alignée. Raison : la réponse se lit là où le doigt se pose.
- b3, b6, b7 : pas de barres l5b. La balance, le radar (acquis m4/h4) et le plan répondent à « où est le meilleur
  moment » sans douze lignes. Les familles restent en pastilles (b3) ou en axes (b6), pas en b7, qui ne montre que les
  deux familles de ta demande.
- b1 seul porte le pastille « par floral » de y1b, en lecture seule : un sélecteur de critère sera à éprouver en passe 2
  contre D98.

## Contrôles joués une fois

- G1, commun sans mots : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende,
  parlant, brutes). Premier passage : TRAIT ECHEC sur b7 (« aucun picto de famille visible »), corrigé en mettant les
  pictos floral et résineux dans la phrase.
- **D98** (`controle-une-question`) : les huit lignes « titre « Quand ajouter Idaho 7 ? » · libres : moment · 1
  contrôle(s) · contexte : houblon, dose, levure, base », puis `UNE-QUESTION OK (1 groupe libre : moment)`.
- **D99** (`controle-acquis`) : `ACQUIS ECHEC 31 problème(s)`. b6 : `1/4 : radar (au repos)` ; les autres `0/4`. Ce
  contrôle vise un écran Comparer (radar, chimie, panel OSU, vraies valeurs) : il ne s'applique pas à Dryhopper. Le
  radar de b6 est balisé et passe. Sortie complète : `captures/travail/d99.txt`.
- **MOTS** (`mots-premier-ecran --max=80`) : b1 92, b2 75, b3 84, b4 92, b5 86, b6 80, b7 83, b8 83, soit
  `MOTS ECHEC 6/8 au-dessus de 80`. Hors données (`--sans-donnees --max=70`) : 46, 41, 44, 45, 57, 40, 51, 52, `MOTS OK`. Le
  surplus vient des données : douze familles, nombres, IBU. Pistes pour la passe 2 : une seule vraie valeur en b5,
  libellés de b4 plus courts, contexte sur une ligne.

## Ce qui tient, ce qui casse

- Tient : la réponse se lit en trois secondes dans les huit concepts. Le geste montre tout de suite ce qu'on perd (à
  10′ : floral ~−9, 97 IBU, trop amer). Les représentations sont toutes différentes. Aucune erreur dans la console.
- Casse :
  - b6 : le radar est dominé par la pointe du résineux (83 dès la dégustation, déjà hors style). Les autres familles
    restent petites, même en racine carrée.
  - b3 : la balance compare deux familles sur la même échelle de points. C'est lisible, mais le solde est une
    convention.
  - b7 : « avec Pomona » montre une levure sur un écran sans levure libre (aperçu en lecture seule, D98 OK). À
    trancher : greffe utile ou intrusion.
  - b8 : l'interpolé a la même intensité que le calculé ; seul l'en-tête « ≈ interpolé de 55′ à 15′ » le dit.
  - La réponse ne change pas avec la lentille ; seul le dessin change.
