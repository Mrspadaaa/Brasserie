# Référence : Beer Maverick, et ce qui rend un comparateur « propre »

Mission #119, v3 du prototype houblons, 18.10.2026. Le brasseur a refusé la v2 :
« C'est pire que les alternatives », avec le lien vers l'outil de comparaison de
Beer Maverick. Ce document dit ce que la référence fait, ce qu'elle ne fait pas,
et les règles que la v3 en tire. Usage interne : comprendre et faire mieux, pas
copier.

## 1. Accès à la page, le 18.10.2026

| Tentative | Résultat |
|---|---|
| Chrome du brasseur (extension Claude in Chrome), autorisé en lecture seule | Extension **non connectée**, deux essais. Rien n'a été ouvert. |
| Navigateur intégré de l'app Claude, `beermaverick.com/hops/hop-comparison-tool/` | Page Cloudflare « Vérification de sécurité en cours » pendant plus de 16 s, puis toujours la même page. **Non contournée.** L'onglet a été fermé. |
| Page variété `beermaverick.com/hop/target/` | Non tentée : même domaine, même vérification. |
| Archives tierces (copie mise en cache) | Écartées : ce serait contourner la protection que le site a choisie. |

Conséquence : **aucune capture de Beer Maverick n'existe dans ce dossier.** Les
faits ci-dessous viennent de trois sources, de fiabilité différente :

1. **Notes de lecture antérieures**, écrites par des agents qui ont vu la page
   (`work/houblons-v5-cadrage-2026-09-29/references-lues.md`, archive) :
   comparateur jusqu'à **trois** variétés ; rubriques arômes et saveurs, valeurs
   brassicoles, composition des huiles ; le texte de la page avertit qu'un zéro
   du radar peut désigner une donnée absente ; une sélection Sabro + Bravo
   n'avait pas rempli les graphiques ce jour-là. Fiche variété : identité et
   origine, profil aromatique, plages analytiques historiques, huiles, styles,
   associations relevées dans des recettes, substituts, formes commerciales.
2. **Les données Beer Maverick du dépôt** (`src/data/hopBeerMaverickBootstrap.json`) :
   318 variétés ; alpha, bêta et huiles totales pour 318 ; myrcène, humulène,
   caryophyllène pour 260 ; descripteurs (« tags ») ; plages historiques
   agrégées de fournisseurs, pas des analyses de lot. Scores de substitution et
   styles de Beer Maverick non importés.
3. **Ma connaissance de l'outil**, antérieure à cette mission et **non revérifiée
   à l'écran** le 18.10. Chaque point de la section 2 porte sa source.

Les mots du brasseur sur cette référence :
- « aucune des maquette fait mieux que […] hop-comparison-tool/?hops=sabro,bravo »
  (C068) ;
- « ces site sont bien mais ne répondes pas à TOUTES mes question » (C069) ;
- « le but est de l'amélioré tantôt en terme de compréhension, utilisation,
  visualisation » (C070) ;
- « inspire toi de beermaverick.com/hop/cascade la manière dont il affiche » (C071).

## 2. Ce que fait le comparateur

| Élément | Ce qu'on voit | Source |
|---|---|---|
| Sélection | En haut de page, un champ par variété avec recherche ; l'adresse garde la liste (`?hops=sabro,bravo`) ; on retire une variété par sa croix. | adresse citée par le brasseur (C068) ; notes 1 |
| Nombre | Jusqu'à 3 variétés. | notes 1 |
| Couleur | Une couleur par variété, la même dans tous les graphiques et en tête de colonne. | connaissance, non revérifiée |
| Profil d'arôme | Un radar unique : un polygone par variété, superposés, sur les mêmes axes de famille d'arôme (agrumes, fruits tropicaux, fruits à noyau, baies, floral, herbacé, épicé, résine/pin, terreux…). | notes 1 (rubrique arômes) ; axes : connaissance |
| Valeurs brassicoles | Alpha, bêta, rapport alpha/bêta, cohumulone, indice de conservation, huiles totales : chaque grandeur sur une ligne, une barre de plage (min–max) par variété, sur une échelle commune, avec les nombres et l'unité. | notes 1 ; forme des barres : connaissance |
| Huiles | Myrcène, humulène, caryophyllène, farnésène, autres : en plages, côte à côte. | notes 1 |
| Texte | Peu de prose ; descripteurs en mots ; une note sur les zéros du radar. | notes 1 |
| Fiche variété (`/hop/<nom>/`) | En-tête nom, origine, emploi (amérisant, aromatique, mixte) ; descripteurs ; plages ; styles typiques ; substituts avec un pourcentage de similarité ; formes commerciales ; liens d'achat. | notes 1 ; C071 |
| Substituts | Méthode publiée : corrélation sur environ 70 variables, pondérée selon l'emploi (amertume ou arôme). | article « your-hop-substitutions-are-wrong », notes 1 |

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
- **R2** Huit axes d'arôme au plus sur le radar, en mots du brasseur ; un axe
  sans donnée est marqué « inconnu », jamais tracé à zéro (piège noté chez Beer
  Maverick).
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
- **R8** Le relecteur indépendant juge la propreté contre ce document et les
  captures V5.5 ; le brasseur reste le seul juge de la comparaison directe avec
  Beer Maverick, à la porte B.

## 7. Limites

- Aucune capture de Beer Maverick : le critère « au moins aussi propre que Beer
  Maverick » se juge contre la section 2 et les captures V5.5, pas contre une
  capture côte à côte. C'est un écart au brief, signalé au brasseur.
- Le nombre maximal de variétés (3) vient d'une note de septembre ; il a pu
  changer.
