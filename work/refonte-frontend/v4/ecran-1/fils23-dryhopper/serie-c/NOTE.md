# Série C : les vraies valeurs d'abord (Dryhopper, lot 23, v0)

Question : « Quand ajouter Idaho 7 ? ». Un seul facteur libre, le moment : ébullition de 60′ à 10′ par 5′, whirlpool,
fermentation active J1 à J7, après fermentation J1 à J7. Fixé dans la ligne de contexte : Idaho 7 (α 12,7 %, fiches
9,5–14,9, mixte, stock en icône), 4 g/L, US-05, Stout 16D.
Le parti de la série : les mesures publiées (E01 à E10) passent en premier, le simulé d'Idaho 7 ensuite et marqué « ~ ».
Pas d'austérité à la v1 : les vraies valeurs sont en couleur de famille, en gros, avec leur source sur la même ligne.

Générateur : `generer.mjs` (huit concepts), `commun.mjs` (données lues dans les JSON, rail, barres, page), captures par
`captures.mjs`. Socle `fils21-choisir/w1/socle-w.mjs` (pictos au trait, α, usage, stock, fiche g1, légende).
Chaleurs : 2 froides, 6 tièdes ; chaude : aucune (VOIE.md). Descripteurs : option A (pour Idaho 7, aucun mot déplacé,
part sans famille 0 d'après `fils22-comparer/donnees/comparer-stout.json`, donc rien de visible).

## Concepts

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| c1 | froide | L'écran Dryhopper de la carte, avec en tête la carte « preuve » du moment choisi, qui change avec le pouce. Dessous, les 12 barres de l5b, la ligne Ma bière → +1 → +2. | rail horizontal par 5′ | actif : linalol d'Idaho 7 38 µg/L (×3,8–9,5 le seuil), myrcène 85 µg/L (×6,5), McCabe 2023 · E03, à vérifier ; après : agrumes au jury 1,9 → 5,8 sur 15, Lafontaine 2018 · E04 ; 60′ : « cuit, herbacé », Sharp 2014 · E07 | dernière étape (« 1 Quand · 2 Levure », Puis la levure ›) |
| c2 | froide | y1b : « Face à ta stout » (les 3 familles qui montent), 12 barres, jauge d'amertume ; le dock fixé sous le pouce, jalonné de flacons et de jurys là où une étude a mesuré ; la bulle du dock dit la valeur. | dock sous le pouce | dans la bulle : E03 38 µg/L, E04 3 → 8,1 sur 15, E07, E09 non chiffré | pont (Que change ma levure ? ›) |
| c3 | tiède | Le brassin à la verticale, du chaud au froid. Sept mesures épinglées à leur heure (à droite) ; le simulé d'Idaho 7 sous le pouce (floral, résineux, végétal, IBU). | rail vertical | E07, E09, E03 (linalol, myrcène), E04 (agrumes 1,9 → 5,8), E08 (2 j), E10 (1 h = 4 j) | dernière étape |
| c4 | tiède | La courbe de contact : l'axe des heures (1 h à 12 j). On y voit l'extraction, le passage en 2 j, le jury qui ne distingue pas 1 h de 4 j, et le floral simulé d'Idaho 7 jour par jour sur le même axe. À chaud, un voile dit « pas de contact ». | rail horizontal, curseur de jour | linalol 43,1 % de l'huile à 6 h et 39,5 % à 12 j, limonène 8,4 % puis 5,9 % (Wolfe 2012 · E05) ; Schmidt 2019 · E08 ; Titus 2021 · E10 | pont |
| c5 | tiède | Idaho 7 mesuré une seule fois : ses quatre composés face au seuil, sur une échelle log de ×0,1 à ×100. Hors fermentation, un voile hachuré dit « jamais mesuré à ce moment ». Dessous, un radar simulé, ta stout avant et avec Idaho 7. | rail horizontal | linalol 38 µg/L (×3,8–9,5), myrcène 85 (×6,5), humulène 130 (×1,1), caryophyllène 54 (×0,6–0,8) · E03 ; seuils de Feng 2015 · E06 | dernière étape |
| c6 | tiède | Le jury d'abord : notes sur 15, sans houblon puis après 24 h, en rond creux puis plein. Les puces des autres jurys s'allument selon le moment. Ensuite, les 12 barres simulées. | rail horizontal | intensité 3 → 8,1, agrumes 1,9 → 5,8, herbacé 2,5 → 5,7 (Cascade 3,86 g/L, E04) ; E07 ; E10 | pont |
| c7 | tiède | La table des preuves : 4 colonnes (ébullition, WP, actif, après) alignées sur le rail. En haut, ce qu'une étude a mesuré ; en bas, l'ajout simulé en floral et en résineux. On y voit : actif ~+22 floral pour ~+14 résineux, après ~+23 pour ~+20. | rail aligné sur les colonnes | E07 « cuit » ; E09 « ? » ; E03 38 µg/L ; E04 3 → 8,1 | dernière étape |
| c8 | tiède | Face au témoin : de vraies bières sans puis avec houblon, sur une échelle log en µg/L. Les lignes du moment choisi s'allument. Ta stout se lit en chaîne (x3b réduit) : Ma bière → + Idaho 7 au moment → levure ›. | rail horizontal | linalol 25 → 83–323 (5 tchèques, 30 j, E02) ; Citra 47 → 144 et myrcène 27 → 131 (E06, moment non publié) ; Idaho 7 ? → 38 (E03, pas de témoin) | pont (dans la chaîne) |

Ce que la série apprend (simulé, 4 g/L, US-05) : en fermentation active, le floral reste au niveau d'après (~+22 contre
~+23), avec moins de résineux (~+14 contre ~+20). C'est la demande du 18.10, « ma stout est trop résineuses, je la veux
plus floral ». c7 le montre d'un coup d'œil. Côté réel, une seule mesure d'Idaho 7 existe (E03, au pitch).

## Baseline

Repris (plancher) :
- la question en titre, et la ligne de contexte fixée sans contrôle ;
- le geste de y1b : glisser le moment comme un curseur, par 5′ (11 crans d'ébullition, whirlpool, J1 à J7 en actif et après) ;
- les pictos au trait et le code couleur des familles ;
- les barres de l5b face à la zone de la 16D, le rond creux de ta stout avant, l'orangé hors du style, l'inconnu hachuré, jamais zéro ;
- au style par défaut, puis absolu ;
- α du lot puis plage des fiches, usage en mot (« mixte »), stock en icône (20 g pour 80 g) ;
- la légende derrière « ? » ;
- l'appui long sur Idaho 7, qui ouvre la vraie fiche g1 (capture `c1-fiche-390.png`) ;
- le dock sous le pouce (c2), x3b réduit (c1 : Ma bière → +1 → +2 ; c8 : la chaîne), a2b par le pont Levure.

Enrichi : chaque moment montre sa preuve sourcée (étude, auteur, année, variété, conditions). Un moment sans mesure se
voit (hachuré, « jamais mesuré »).

Écarts, un par un, avec leur raison :
- c2 : la vraie valeur est sous le pouce (bulle du dock), pas en tête. Froide sur y1b, elle garde « face à ta stout » en
  tête, et la preuve suit le doigt.
- c3 : le rail est vertical. Le brassin se lit du chaud au froid, et les mesures épinglées à leur heure demandent la
  hauteur que la frise horizontale n'a pas. Le geste reste un glisser par cran.
- c3, c4, c7, c8 : quelques familles seulement au premier plan (floral, résineux, végétal ou tropical, d'après la
  dégustation « trop résineuse, plus florale »). Les 12 familles sont à ajouter à un toucher en passe 2.
- c5 : un radar remplace les barres pour le simulé (acquis m4 et h4, sans légende écrite).
- Pas de loupe ×3 sur le rail en v0 (y1b la portait) : à reprendre en passe 2.
- IBU : les valeurs de l'écran de la carte, marquées « ~ ». Les minutes sans calcul (55′ à 15′) affichent « ? ».

Honnêteté :
- E03 est un ajout au pitch : co-fermentation, S-04, 14 j, dose non publiée, colonnes du tableau à vérifier. C'est dit
  partout où la valeur paraît.
- E04, E05 et E10 sont des Cascade, E08 un Eureka!, E07 des Simcoe et Hallertau. Aucune n'est présentée comme Idaho 7.
- Le moment d'E06 n'est pas publié : c'est écrit sur la ligne. E09 n'est publié qu'en figure : hachuré, aucun chiffre lu.
- Les seuils sont ceux de la diapositive E06 ; le générateur vérifie qu'ils figurent dans le champ « note ».
- Les données sont lues par étude, variété et composé, jamais recopiées (L14).

## Contrôles (joués une fois, sorties recopiées)

- Commun (G1), `controle-commun --sans=mots` : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche,
  standard, trait, légende, parlant, brutes).
- D98, `controle-une-question` : **UNE-QUESTION OK (1 groupe libre : moment)**. Pour les huit : titre « Quand ajouter
  Idaho 7 ? » ; libres : moment ; 1 contrôle ; contexte : houblon, dose, levure, base.
- D99, `controle-acquis` : **ACQUIS ECHEC 32 problème(s)**.
  - Résultat par page : c1 à c4 et c6 à c8 « 0/4 : aucun » ; c5 « 1/4 : chimie (au repos) ».
  - Ce contrôle est taillé pour Comparer : radar d'au moins deux houblons, panel OSU, au moins 3 valeurs avec unité. Il
    ne s'applique pas tel quel à un outil à un seul houblon.
  - Les jurys (sur 15) et les extractions (%) ne sont pas lus comme des unités.
  - Balisage posé : `data-acquis="valeurs"` sur les blocs de preuve ; « chimie » et « radar » sur c5.
- MOTS, `mots-premier-ecran --max=80` : **MOTS ECHEC 8/8**. c1 111, c2 96, c3 117, c4 132, c5 90, c6 126, c7 90, c8 91.
  Les sources écrites en clair (auteur, année, E0x) et la ligne de contexte pèsent environ 30 mots. À réduire en passe 2,
  par exemple en passant la source à un toucher, sans perdre la citation.
