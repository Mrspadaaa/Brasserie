# Référence : Beer Maverick, et ce qui rend un comparateur « propre »

Mission #119, v3 du prototype houblons, 18.10.2026. Le brasseur a refusé la v2 :
« C'est pire que les alternatives », avec le lien vers l'outil de comparaison de
Beer Maverick. Ce document dit ce que la référence fait, ce qu'elle ne fait pas,
et les règles que la v3 en tire. Usage interne : comprendre et faire mieux, pas
copier.

## 1. Accès à la page, le 18.10.2026

**Vu le 18.10 dans le Chrome du brasseur**, en lecture seule, par le pilote de la
mission, après que le brasseur a connecté l'extension. Aucune vérification
anti-robot, aucune bannière de cookies. Rien n'a été saisi, sauf des noms de
houblons dans le menu du comparateur. Captures et constats :
`work/refonte-frontend/v3/reference/beer-maverick/` (16 captures JPEG et
`constats.md`) : comparateur 01 à 07, fiche Target 10 à 13, fiche Fuggle 20,
fiche East Kent Goldings 30 à 32, tableau des substitutions 40.

**Limites, telles quelles :**
- La comparaison à 2 ou 3 houblons n'a pas pu être vue : les menus de Beer
  Maverick restaient à 0 option (trois essais, deux rechargements). Le tableau des
  substitutions était vide aussi.
- La largeur téléphone n'a pas été capturée (la fenêtre restait à 1278 px).
- La référence est donc le comparateur à un houblon, plus les fiches.

Tentatives précédentes, le même jour : l'extension n'était pas encore connectée ;
le navigateur intégré de l'app Claude restait bloqué sur la vérification
Cloudflare, non contournée ; les archives tierces ont été écartées. La première
version de ce document, écrite à l'aveugle, se trompait sur plusieurs points ; la
section 2 est corrigée d'après les captures.

Autres sources, de fiabilité moindre :
1. **Notes de lecture de septembre** (`work/houblons-v5-cadrage-2026-09-29/references-lues.md`,
   archive) : une sélection Sabro + Bravo n'avait déjà pas rempli les graphiques.
   Le comparateur de Beer Maverick est fragile.
2. **Les données Beer Maverick du dépôt** (`src/data/hopBeerMaverickBootstrap.json`) :
   318 variétés ; alpha, bêta et huiles totales pour 318 ; myrcène, humulène,
   caryophyllène pour 260 ; descripteurs (« tags ») ; plages historiques
   agrégées de fournisseurs, pas des analyses de lot. **Les intensités du radar de
   Beer Maverick n'y sont pas** (vérifié) ; les moyennes, les zones typiques, les
   scores de substitution et les styles non plus. Les recopier depuis le site est
   exclu.

Les mots du brasseur sur cette référence :
- « aucune des maquette fait mieux que […] hop-comparison-tool/?hops=sabro,bravo »
  (C068) ;
- « ces site sont bien mais ne répondes pas à TOUTES mes question » (C069) ;
- « le but est de l'amélioré tantôt en terme de compréhension, utilisation,
  visualisation » (C070) ;
- « inspire toi de beermaverick.com/hop/cascade la manière dont il affiche » (C071).

## 2. Ce que fait le comparateur

| Élément | Ce qu'on voit | Capture |
|---|---|---|
| Sélection | « Hop Comparison Wizard », deux lignes d'introduction, « Choose up to 3 hops to compare » : trois menus côte à côte, chacun avec sa couleur (rouge, vert, bleu) en bordure et en fond pâle ; « clear selection », « Share this comparison ». | 01, 04 |
| Nombre | Jusqu'à 3 variétés. Le 18.10, un seul houblon s'affichait (menus à 0 option). | 02, 03 |
| Ordre | Trois sections, toujours dans cet ordre, sous un bandeau gris clair qui ne porte que son titre : Flavor & Aroma, Brewing Values, Oil Composition ; puis « Data Sources » en texte. | 04 à 07 |
| Profil d'arôme | Une phrase (« Fuggle is an Aroma hop from United Kingdom. Descriptors include… »), puis un radar à **9 axes** (Citrus, Tropical Fruit, Stone Fruit, Berry, Floral, Grassy, Herbal, Spice, Resin / Pine), échelle **0 à 5**, polygone rempli de la couleur du menu. Sous le radar : « All zero values mean there are no aroma values available for that hop. » | 04 |
| Valeurs brassicoles | Une pastille de couleur avec le nom (la légende), puis pour chaque mesure : le titre en gras, **une ligne grise qui dit à quoi sert la mesure**, la plage en texte (« 2.4-6.1% ») et une barre courte : **bande pâle = plage, segment saturé = zone typique, trait fin = moyenne**. Mesures : alpha, bêta, rapport alpha/bêta, cohumulone. | 05 |
| Huiles | Huiles totales (mL/100 g) et un encadré « Did you know? » ; puis myrcène, humulène, autres, caryophyllène, farnésène, chacune avec sa ligne de saveurs et sa barre de plage. | 06, 07 |
| Air | Fond blanc sur gris très clair, peu de tailles de texte, aucun bouton dans le contenu, un graphique par notion. | 04 à 07 |
| Fiche variété (`/hop/<nom>/`) | Deux colonnes. Tableau d'identité (emploi, pays, code, lien « Compare with other hops ») ; achat (logos) ; origine ; profil (tags, même radar) ; valeurs en tableau, « 11% avg » sous chaque mini-barre, une couleur par mesure, indice de conservation pour EKG ; styles en une phrase ; substituts en liste. | 10 à 13, 20, 30 à 32 |
| Styles | Target : « British Ale, British Lager & Pale Ale » ; East Kent Goldings : « English Ale, ESB & Belgian Ale ». **Aucun style ne cite la stout.** | 13, 32 |
| Substituts | Liste « Experienced brewers have chosen… » : Target → Fuggle, Willamette ; EKG → Golding, Fuggle, Willamette. Sans pourcentage sur la fiche ; le tableau des substitutions était vide le 18.10. | 13, 32, 40 |
| Qualité des données | **East Kent Goldings est classé « Bittering »** ; son texte dit « commonly used only to bitter », puis décrit un arôme floral, lavande, miel. Beer Maverick n'est pas une vérité. | 30, 31 |

## 3. Pourquoi c'est « propre » : sept traits

Ce sont les traits que le brasseur oppose à la v2, et ce que la v2 n'avait pas.

1. **Une page, une tâche.** Choisir des variétés en haut, lire les résultats
   dessous. Aucun mode caché, aucune feuille « ? » qui renvoie ailleurs.
2. **Le graphique d'abord, le texte ensuite.** Le radar donne l'écart d'arôme
   d'un coup d'œil ; les barres de plage donnent l'écart d'alpha sans lire un
   nombre. La v2 n'avait qu'un tableau de texte.
3. **Une échelle commune.** Toutes les variétés sur le même axe : une barre plus
   longue veut dire plus d'alpha. Pas de valeurs relatives cachées.
4. **Une couleur par variété, partout.** L'œil relie le polygone, la barre et
   l'en-tête sans légende à relire.
5. **Des plages, pas de faux chiffres précis.** Une variété varie d'une récolte
   à l'autre ; la barre montre cette plage.
6. **Une hiérarchie nette.** Titres de section courts, valeurs alignées, unité
   collée au nombre, beaucoup d'air sur ordinateur.
7. **Aucune justification avant la réponse.** Pas de bandeau d'avertissement
   au-dessus des graphiques.

## 4. Ce que Beer Maverick ne fait pas, et que le brasseur demande

| Manque | Question de la banque |
|---|---|
| Mon stock : ce que j'ai, en grammes, et si j'en ai assez | Q01, Q03, Q24 |
| Ma recette : style, volume, densité, ajouts | Q01, Q17, Q20 |
| L'IBU à dose égale, dans ma recette | Q02, Q15, Q17 |
| La dose de Y pour garder l'IBU de X | Q05, Q06, Q18 |
| Le classement pour mon style, stout comprise | Q01, Q21, Q22 |
| Le mobile : l'outil est pensé pour un grand écran | Q03 |
| Plus de 3 variétés à la fois | Q02 (« 2, 3, 4 ») |
| Les réponses aux questions concrètes (Nugget en stout, lager juicy, cryo…) | Q04 à Q14, Q19, Q22 à Q30 |

## 5. Les maquettes V5 et V5.5, que le brasseur trouvait meilleures

Captures faites et regardées le 18.10 (`work/refonte-frontend/v3/reference/`,
maquette `candidate-v55-final-22-preview`, ouverte en lecture seule) :

| Capture | Ce que je vois | À garder | À ne pas refaire |
|---|---|---|---|
| `v55-390-explorer.png` | Fond clair ; six listes déroulantes (lecture, moment, charge, souche, conversion, masquage) avant tout résultat ; nuage de points « territoire » sur 5 axes, noms qui se chevauchent. | — | réglages avant la réponse ; noms superposés ; fond clair |
| `v55-390-comparaison-a.png`, `-b.png` | « Comparaison », bascule Barres / Radar ; légende ● Saaz ▲ Magnum ; un axe d'arôme par ligne, un repère et sa plage par variété sur une échelle commune ; sous chaque axe, des pastilles « recouvrement · précision limitée », « sous le fond (hyp.) ». Puis un tableau IBU final, amertume perçue, végétal, intensité. | une ligne par axe avec plage par variété ; forme + couleur par variété ; tableau IBU sous le profil | une pastille d'état sous chaque ligne : le bruit noie la lecture |
| `v55-390-radar-a.png` | Radar à 16 axes, deux polygones (vert, brun) ; axes vides marqués « ≈ » ; « Touche le nom d'un axe pour lire ses valeurs exactes ». | radar superposé ; valeur exacte à la demande | 16 axes : trop pour 390 px |
| `v55-1280-apres-comparer.png` | Fiche Nugget : barres horizontales par arôme avec valeur 0–5 ; cartes Alpha 12 %, Bêta 5,4 %, Cohumulone, Huiles ; barre empilée de composition des huiles avec légende colorée. | barres d'arôme lisibles ; barre empilée des huiles | panneau clair dans une app sombre |

## 6. Règles pour la v3

- **R1** Une vue de comparaison qui se lit sans texte : radar superposé, puis
  barres de plage sur échelle commune, une couleur et une forme par houblon,
  identiques dans toute la page.
- **R2** Huit axes d'arôme sur le radar (Beer Maverick en a 9, de 0 à 5), en mots
  du brasseur ; un houblon sans donnée est marqué « inconnu », jamais tracé à zéro.
- **R3** Au-dessus des graphiques, seulement les noms, les couleurs, le stock.
  Aucun bandeau d'avertissement ; la base de chaque estimation est à la demande.
- **R4** Ajouter ce que la référence n'a pas, sous forme graphique : IBU à dose
  égale dans ma recette (barres), dose pour l'IBU visé face à mon stock (jauge),
  adéquation au style (groupe et axes du style marqués sur le radar).
- **R5** Jusqu'à 4 houblons, lisibles à 390 px sans défilement horizontal.
- **R6** Chaque question de la banque a sa réponse calculée à l'écran ; jamais
  « va voir tel écran ».
- **R7** Thème sombre de `DESIGN.md`, densité compacte, mais de l'air entre les
  sections : la propreté vient de l'alignement et de la hiérarchie, pas de la
  taille.
- **R8** Le relecteur indépendant juge la propreté sur les captures réelles de
  Beer Maverick (section 1) confrontées aux captures de la v3 ; le brasseur reste
  le juge final, à la porte B.
- **R9** (vu le 18.10) Chaque mesure se lit sans glossaire : son nom, une ligne
  « à quoi ça sert », puis la valeur.
- **R10** (vu le 18.10) Le radar de la v3 est une estimation tirée du nombre de
  descripteurs, pas les intensités de Beer Maverick (absentes du dépôt, à ne pas
  recopier) : il le dit sous le graphique, aussi clairement que la note
  « zéro = pas de donnée » de Beer Maverick.

## 7. Limites

- La comparaison à plusieurs houblons de Beer Maverick n'a pas pu être vue (menus
  vides le 18.10), ni sa mise en page téléphone. La confrontation porte sur le
  comparateur à un houblon et les fiches, en largeur bureau.
- Beer Maverick a ses propres erreurs de données (East Kent Goldings classé
  « Bittering ») : la référence est une référence de présentation, pas de vérité.
