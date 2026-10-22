# Série G — Dryhopper « Quand ajouter Idaho 7 ? » (voie r7g-dryhopper, v0, 22.10)

Approche G : libre, brief minimal. Chaleur : **chaude** pour les huit concepts (forme libre). Aucun
concept de chaleur froide (idée retenue affinée) ni tiède (forme de l'approche) : VOIE.md donne « 8 chaude ».
Descripteurs : **A**. Idaho 7 n'a aucun mot sans famille (`partSansFamille` 0, `motsSansFamille` vide
dans `comparer-stout.json`) : une part « autres » serait vide.

Un seul facteur libre partout, le moment : 22 crans (60′ … 10′ par 5′, whirlpool, actif 1, 2, 3, 5, 7 j,
après 1, 2, 3, 5, 7 j). Fixé dans la ligne de contexte : Idaho 7 α 12,7 % mixte, 4 g/L, US-05, Stout 16D.
Départ sur le meilleur moment (actif · 2 j), sauf g4 qui part de 10′ (le piège se voit, « le meilleur »
est à un toucher). Le meilleur, pour la demande du 18.10 (« trop résineuse, je la veux plus florale ») :
le plus de floral, le moins de résineux ajouté, l'IBU dans la 16D (50–70).

Ce que les données disent (simulé, `comparer-stout.json`, 4 g/L, US-05), que chaque concept montre :
- l'ébullition donne peu de nez et beaucoup d'amertume : 60′ floral ~+2, IBU ~162 ; 10′ floral ~+13,
  IBU ~97 ; whirlpool floral ~+14, IBU ~75 : tous au-dessus de la 16D ;
- l'actif : floral ~+22, résineux ~+14, végétal ~+5 ; l'après : floral ~+23, mais résineux ~+20 et
  végétal ~+10 ; au-delà de 2 j de contact, rien ne bouge ;
- la levure ne change le nez que pendant l'actif (Pomona : agrumes ~+13 de plus) ; après, rien.

## Concepts

| id | chaleur | ce qu'il montre (la représentation qui répond) | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| g1 « La courbe du compromis » | chaude | trois courbes sur tout le brassin (floral, baies, résineux ajoutés), sous elles l'IBU de toute la stout par moment, bande 16D 50–70 ; « meilleur » marqué | le doigt glisse sur le graphique même, le curseur suit | E08 Schmidt 2019 : « l'essentiel passe en 2 j » (Eureka!, 2,5 g/L) | pont vers l'outil Levure |
| g2 « La bascule » | chaude | une planche penche vers le nez (pictos des familles gagnées) ou la bouche (IBU) ; dessous les 12 barres l5b | dock sous le pouce (y1b), loupe ×3,6 des moments voisins | E07 Sharp 2014 : « à l'ébullition : cuit, herbe, végétal » (panel de 12) | dernière étape (1 Quand · 2 Levure) |
| g3 « L'arc du pouce » | chaude | l'orgue des 12 familles (colonnes face à la zone 16D) ; au centre de l'arc, le lieu, floral et baies, l'IBU | le pouce tourne sur un demi-cercle (son arc naturel) | E05 Wolfe 2012 : « linalol : 43 % extrait en 6 h » (Cascade, 3,86 g/L) | pont vers l'outil Levure |
| g4 « La phrase qui se règle » | chaude | une phrase : « J'ajoute Idaho 7 [à 10′] / Ma stout gagne floral ~+13 et baies ~+13, le résineux monte ~+8, trop amer : IBU ~97 » ; 6 barres l5b, jauge d'amertume | on frotte le mot du moment (gauche, droite) ; « le meilleur » à un toucher | E07 Sharp 2014 | dernière étape |
| g5 « La carte de chaleur » | chaude | 12 familles × 22 moments d'un coup d'œil, plus foncé = plus ; ligne IBU (orangé au-dessus de la 16D) ; colonne du meilleur | le doigt balaie les colonnes | E05 Wolfe 2012 | pont vers l'outil Levure |
| g6 « Sur la courbe de densité » | chaude | le houblon posé sur la vie de la stout : DI 1,066 de la recette, chute pendant « la levure travaille », DF ? (allure, pas une mesure) ; 6 barres l5b | le jeton roule sur la courbe | E03 McCabe 2023 : « Idaho 7 au pitch : linalol 38 ± 13 µg/L » (S-04, à vérifier ; ligne Idaho-7, L14) | dernière étape |
| g7 « Le radar qui respire » | chaude | radar m4/h4, 12 axes au style, zone 16D, ta stout en gris, avec Idaho 7 en violet ; un trait orangé sort au-delà de ×2 ; jauge d'amertume | ascenseur vertical du brassin à droite (60′ en haut, après 7 j en bas) | E10 Titus 2021 : « 1 h ou 96 h : même nez » (Cascade, 1,43 g/L) | pont vers l'outil Levure |
| g8 « Le ruban, contre le geste habituel » | chaude | chaque famille en barre divergente contre le dry hop après 3 j (moins / plus), et une petite piste face à la 16D ; IBU contre | le brassin défile sous une aiguille comme un mètre ruban | E10 Titus 2021 | dernière étape |

Levure : quatre concepts en dernière étape (g2, g4, g6, g8), quatre avec un pont vers l'outil Levure
(g1, g3, g5, g7). Dans les deux formes, le texte du pont suit le moment : « Pomona : agrumes ~+13 » en
actif, « la levure ne change rien ici » ailleurs, « après fermentation, rien ne change » après. Aucun
sélecteur de levure sur l'écran (un seul facteur libre).

## Baseline

Plancher repris dans les huit :
- la question en titre, « Quand ajouter Idaho 7 ? » ; la ligne « fixé » avec α du lot (12,7 %), rôle en
  mot (mixte), dose, levure, style ;
- « face à ta stout » : la stout avant (rond creux, trait noir, polygone gris) contre « avec Idaho 7 » ;
- code couleur des arômes et pictos au trait (TRAIT OK) ; au style par défaut, absolu à un toucher,
  zone 16D visible (AU-STYLE OK) ; orangé seulement pour « hors du style » et « trop amer » ;
- glisser le moment comme un curseur, par 5′ (18.10), au doigt, et aux flèches du clavier ;
- l'IBU de toute la stout et la 16D (50–70) ; à cru « ~60 + ? », jamais 0 ;
- légende derrière un « ? » (LEGENDE OK) ; appui long ou survol long sur Idaho 7 → la fiche courte
  (α du lot et des fiches, arômes 1/1 fiche, silhouette, goût ; FICHE OK) ;
- honnêteté : « ~ » simulé, « ≈ » interpolé entre 60′ et 10′ (la grille n'a que 60′ et 10′ ; IBU
  interpolés entre 60′, 30′, 15′, 10′ du moteur), inconnu hachuré (pépins, melon), une vraie valeur
  sourcée par écran (data-nature="mesure").
- Enrichi : chaque concept nomme le meilleur moment et montre le piège (ébullition et WP trop amers,
  après plus résineux et végétal), et dit ce que la levure change au moment choisi.

Écarts, acquis par acquis :
- **Second houblon et « puis » de y1b** : retirés. Un second houblon est un second facteur libre (D98,
  conseil du 22.10 : « y1b sans sélecteur de houblon, sans second houblon et sans levure »).
- **Pastilles de levure de y1b** : retirées de l'écran ; la levure passe par l'étape ou le pont (L24).
- **Dock sous le pouce** : gardé dans g2 (avec la loupe) et g8 (ruban). Ailleurs le geste se fait sur
  la représentation même (graphique, arc, mot, grille, courbe, radar) : le doigt touche ce qu'il
  regarde. À juger en comparant.
- **Barres l5b** : dans g2, g4, g6 ; g3 les met debout (orgue), g8 en divergent contre une référence ;
  g1, g5, g7 répondent par une autre représentation (courbes, carte de chaleur, radar m4/h4).
- **x3b réduit** (« ma bière → 1 dry hop, 2 dry hop ») : absent ; deux dry hops demandent un second
  houblon ou un second moment libre. g8 garde l'idée de comparer à une référence (après 3 j).
- **a2b** : réduit à une ligne dans le pont (ce que Pomona ajoute au moment choisi).
- **Stock en icône** : absent ; la série n'a pas de stock pour Idaho 7.
- **g6** : la courbe de densité est une allure (schéma), marquée « allure » et « DF ? » ; seule la DI
  1,066 vient de la recette.

## Contrôles (joués une fois en v0, sorties recopiées)

COMMUN (`controle-commun.mjs … --sans=mots`) : couleurs, au-style, survol, blocs, contraste, fiche,
standard, trait, legende, parlant, brutes OK ; **COMMUN OK**.

D98 (`controle-une-question.mjs`) :
```
g1 · titre « Quand ajouter Idaho 7 ? » · libres : moment · 1 contrôle(s) · contexte : houblon, dose, levure, base
… g2 à g8 idem (g4 : 2 contrôles, le mot à frotter et « le meilleur », tous deux du moment)
UNE-QUESTION OK (1 groupe libre : moment)
```

D99 (`controle-acquis.mjs`) : il vise l'écran Comparer (radar, chimie, panel OSU, vraies valeurs) ;
sur Dryhopper il ne s'applique pas tel quel. Sortie :
```
g1 · 0/4 : aucun · 4 faute(s)   (de même g2, g3, g4, g5, g6, g8)
g7 · 1/4 : radar (au repos) · 3 faute(s)
ACQUIS ECHEC 31 problème(s)
```

MOTS (`mots-premier-ecran.mjs --max=80`) :
```
g1 71 · g2 90 · g3 79 · g4 94 · g5 88 · g6 90 · g7 87 · g8 120
MOTS ECHEC 6/8 au-dessus de 80
```
Hors données (`--sans-donnees --max=70`) : g1 40, g2 41, g3 37, g4 51, g5 44, g6 51, g7 33, g8 55 :
MOTS OK. Le surplus vient des noms des 12 familles et des valeurs ; à réduire en passe 2 (g8 surtout).

Gestes joués au doigt (`node generer.mjs --captures`, touchStart / touchMove / touchEnd) : g1 → 55′,
g2 → 50′ (loupe ouverte : 54 px par cran contre ~15 sur le rail), g3 → 55′, g4 → après · 3 j, g5 → 55′,
g6 → 55′, g7 → 55′, g8 → 15′. Absolu touché sur les huit : aucune erreur console, largeur 390 px.

Fichiers : `generer.mjs` (concepts), `socle-g.mjs` (données, fiche, briques), `g1/etat.html` …
`g8/etat.html`, `captures/gN-390.png` (premier écran), `captures/gN-apres-geste-390.png`,
`captures/travail/` (pendant le geste, absolu, sorties brutes).
