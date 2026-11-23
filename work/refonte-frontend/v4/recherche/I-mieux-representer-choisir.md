# I — Mieux représenter, mieux choisir (houblons)

Recherche du 19.10.2026 (sous-agent Haiku 5.5, pour le pilote Opus). Sources web consultées le 19.10.2026. Périmètre : représentation et aide à la décision. La chimie (composés, seuils, rendements) reste dans `work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md` et n'est pas refaite ici.

**Marques.** `[S n]` renvoie à la section Sources. `[I]` = inférence de ce rapport. Statut de chaque source : *lu* = page ouverte ; *relayé* = résumé de moteur de recherche, notice ou page projet non ouverte ; *dépôt* = fichier du dépôt. `H §x [n]` = H-choisir-deux-houblons.md, sections et numéros de sources de H.

---

## Résumé

1. Le brasseur juge par famille, dose, moment, jours et style. Nos maquettes montraient des composés : le premier écran doit répondre à sa question dans cet ordre. [I]
2. Citra et Cascade se ressemblent par famille sur houblon broyé (panel Yakima Chief) ; l'écart vient de la dose par gramme et de quelques molécules. Il faut donc comparer à dose égale, avec la dose affichée. [S1] [S2] [H §0–1]
3. Aucun outil trouvé ne donne un profil de dry hop validé par variété et par moment. Janish, Brewing.it et BeerSmith Hop Control dérivent des profils estimés depuis les huiles ou les composés, avec des hypothèses publiées ou peu documentées. [S9 lu] [S10] [S11]
4. Le « faux profil » est acceptable sous forme de crans issus de sources nommées, étiquetés « estimé ». Quand la donnée manque, « inconnu », jamais zéro. Pas de chiffre inventé, pas d'intensité d'assemblage, pas de verdict sur l'ordre de deux dry hops (H §7.3). [I] [H §7.3–7.5]
5. Cinq idées fortes : comparaison à dose égale ; crans 0–5 avec libellé ; bande « au style » ; chronologie d'ajout avec repères ; mots de confiance sur chaque chiffre.
6. Les pictos ne se montrent jamais seuls. Le « ? » ouvre une feuille, il n'y a pas de légende au premier plan : le dépôt l'interdit. [S34]
7. « Pourquoi 10′ et pas 60′ ? » a une réponse courte et sourcée : la plupart des huiles aromatiques partent à l'ébullition. Une phrase au premier niveau, le détail au toucher. [S9 lu] [S10] [H §0.4]
8. Pour la variabilité, un point par lot, seulement là où les lots existent (Cascade : 29 lots). Les dotplots sont conçus pour petit écran. [S22] [S23] [H §0.5]
9. Pièges : radar décoratif, unités mélangées, plages qui paraissent précises, pictos sans texte, appui long invisible.
10. Limites : sources surtout relayées ; Brewfather, Beer Maverick et tout calculateur de thiols non trouvés ; deux pages Brewing.it refusées (HTTP 429).

---

## Contraintes déjà posées par le dépôt et le brasseur

À appliquer à toute proposition. Lu le 19.10.2026.

- **Premier plan** : 7 éléments au plus, 60 mots au plus à 390 × 844, mesurés par script ; détail à un ou deux gestes ; pas de paragraphe explicatif au premier plan. [S34 : DESIGN.md « Trois plans »]
- **Pas de légende au premier plan** ; une marque qui en demande une est mal choisie. [S34 : DESIGN.md]
- **Couleur jamais seule** pour comprendre ; un seul rouge d'alerte, réservé à « hors du style ». [S34 : ui-compacte l. 193 ; DESIGN.md ; mémoire « fil de fer », 19.10]
- **Pas de pictogrammes mystérieux, pas de radar décoratif.** [S34 : ui-compacte l. 208]
- **Le mouvement répond à une action**, jamais à l'ouverture d'un écran. [S34 : DESIGN.md]
- **Carte houblon** : nom, α, rôle, arômes en couleur, moment et dose, puis IBU ; le stock seulement en icône. [S34 : mémoire « penser en brasseur », 18.10]
- **Moments réglables** par pas de 5′, sur toute la plage (0 à 240′), jamais un exemple figé à 60′ ou 10′. [S34 : mémoire « variables dynamiques », 18.10]
- **Le brasseur choisit** ; un jury n'intègre pas un choix à sa place. Pas de « bon / meilleur » calculé. [S34 : mémoire « brasseur choisit », 18.10]
- **Inconnu ≠ zéro.** [S34 : mémoire « fil de fer », rapport D65]
- **Couleurs des familles** : le code existe déjà dans les mini-maquettes ; le brasseur veut oser la couleur et la forme. [S34 : mémoire, 19.10]

---

## Les 10 meilleures idées

### 1. Comparer à dose égale, sur une même grille

- **Ce que c'est, qui l'utilise.** Deux ou trois houblons superposés sur les mêmes familles, à la même dose et au même moment, avec la dose écrite au-dessus du graphique. BeerSmith Hop Control superpose jusqu'à six variétés sur un seul graphique [S11, relayé]. Le panel de l'OSU a comparé 12 variétés en dry hop à 4 g/L, positions lues sur un biplot [H §1.1 [21]]. Gleicher et coll. distinguent juxtaposer, superposer et encoder explicitement l'écart [S27, relayé].
- **Pourquoi elle aide.** Elle répond à « Citra ou Cascade ? » sans mélanger les doses. Javed et coll. (2010) : la superposition se lit bien sur un intervalle court ; les séries séparées tiennent mieux quand les valeurs sont éloignées [S28, relayé]. Ici les écarts sont courts : la superposition convient. [I]
- **Chez nous.** Deux marques par famille dans la même ligne : une barre pleine pour le premier houblon, un contour pour le second. C'est la forme qui distingue, pas la seule couleur. Bande « au style » en fond (idée 5). Dose et moment en tête de graphe.
- **Risque.** Une dose fixe à 4 g/L n'est pas forcément la recette du brasseur : le curseur (idée 7) répond à cela. Et les profils de panel sur houblon broyé rendent Citra et Cascade presque identiques (H §1.1) : la comparaison doit alors montrer la charge par gramme, pas seulement les familles. [I]

### 2. Un premier écran en quatre morceaux

- **Ce que c'est, qui l'utilise.** Ordre fixe : la question en titre, une réponse en une phrase, les familles en crans, une ligne « dose · moment · jours », un mot de confiance. Le reste va en plan 2 ou 3. Le dépôt impose déjà ce découpage [S34 : DESIGN.md]. Shneiderman décrit la même séquence : vue d'ensemble, filtre et zoom, détail à la demande [S32, relayé].
- **Pourquoi elle aide.** Le brasseur a rejeté 166 à 383 mots au premier écran (mémoire, 18.10). Il veut voir beaucoup, mais seulement l'utile d'abord. La réponse en une phrase remplace le jargon des composés.
- **Chez nous.** Exemple de premier écran, environ 50 mots, sous la limite de 60 :

  > **Citra ou Cascade à 4 g/L ?** (6 mots)
  > À 4 g/L, Citra est plus intense, surtout en agrumes et tropical. (12 mots ; panel OSU, [H §1.1 [21]])
  > Dry hop après fermentation · 3 jours · même dose. (8 mots)
  > [12 familles en crans, libellés] (15 mots)
  > Au style : Blonde (3 mots)
  > Estimé · panel 12 variétés · Pourquoi ? (5 mots)

  Le « Pourquoi ? » ouvre la source au toucher ; le détail vient au deuxième geste.
- **Risque.** La phrase de réponse peut passer pour un verdict : elle doit citer sa dose et son panel. La limite de 60 mots peut couper des familles utiles. Proposition : garder en plan 1 les familles qui sortent de la bande du style, le reste en plan 2. [I]

### 3. Crans 0–5 par famille, libellé toujours visible

- **Ce que c'est, qui l'utilise.** Une barre de cinq crans par famille, présentée comme repère et non comme mesure. Des fournisseurs notent chaque arôme sur 0–5, avec 6 à 12 axes [S11, relayé]. BarthHaas publie un kit de 12 catégories, chacune avec ses sous-termes, une fiole par catégorie [S4, lu]. Yakima Chief note ses profils de 0 à 100 par famille, sur houblon broyé [H §1.1 [1][2]]. Hopsteiner a utilisé 7 catégories en 2013 et 8 en 2014 [S7, S8, relayés]. La roue Hop Union (11 familles) est archivée [S6, relayé]. Il n'existe pas de standard unique.
- **Pourquoi elle aide.** Le brasseur lit déjà une échelle courte. Un nom de famille répond à « quel goût ? » sans passer par le chimique.
- **Chez nous.** Correspondance avec les 12 catégories BarthHaas [S4, lu] — [I] :
  - Floral = Floral ; Agrumes = Citrus ;
  - Tropical, Fruits à noyau et Melon = dans « Sweet Fruit » chez BarthHaas (les garder séparés si les données de H le permettent) ;
  - Pépins = « Green Fruit » ; Petits fruits = « Berries & Currants » ;
  - Résineux et Terreux = « Woody Aromatic » (qui contient Earthy) ;
  - Épicé = Spicy ; Herbacé = Herbal + Green-Grassy ; Végétal = Vegetal.
  - Les catégories « crème-caramel » et « menthe » de BarthHaas n'ont pas d'équivalent chez nous : à vérifier dans les données.
  Pictos de 20 à 24 px à gauche du nom, jamais seuls. Douze barres verticales avec libellés à 390 px : les noms longs (« fruits à noyau ») ne tiendront probablement pas ; essayer une liste horizontale de douze lignes. [I, à mesurer]
- **Risque.** Passer de 0–100 à 0–5 perd de l'information, et une barre de cinq crans donne une impression de mesure précise. Le libellé doit dire « repère du panel, houblon broyé » ou « estimé ».

### 4. L'écart écrit : « ce que ça change »

- **Ce que c'est, qui l'utilise.** Une ligne d'écarts entre deux états : deux houblons, deux doses, deux durées. Chaque famille reçoit « plus », « moins » ou « pareil », avec le nombre de crans. Gleicher et coll. appellent cela un encodage explicite de la relation entre deux vues [S27, relayé]. Le dépôt prévoit déjà l'écart à un objectif avec une barre de plage et un repère cible [S34 : ui-compacte l. 196].
- **Pourquoi elle aide.** « Ça change quoi ? » est une question sur l'écart. Une ligne lue d'un coup coûte moins qu'un graphique à deux séries à comparer à l'œil. [I]
- **Chez nous.** Exemple de format (valeurs fictives, pas des données) : « Galaxy à la place de Citra : agrumes −1 cran, tropical +1 cran ». Flèches en plus, jamais seules. Une pente par famille (avant → après) est possible pour trois à cinq familles ; non testée. [I]
- **Risque.** Sur les profils de panel en houblon broyé, l'écart Citra–Cascade est presque nul (H §1.1) : l'écart affiché serait vide et trompeur. N'afficher un écart que pour une même dose et quand la donnée existe ; sinon écrire « pas d'écart mesuré ». Pour 3 jours contre 7 jours, l'écart reste du sens seulement (H §7.5).

### 5. Une bande « au style » et un repère cible

- **Ce que c'est, qui l'utilise.** Chaque famille a une bande grise (la plage du style) et un trait noir fin (la cible). C'est le principe du graphique de Few (2005) : un repère cible, des plages qualitatives [S30, relayé]. BeerSmith place l'arôme calculé de la bière à côté de l'arôme de style BJCP [S11, relayé]. Des sites de substitution classent aussi les houblons par style [S14, relayé]. Le dépôt prévoit déjà une barre de plage avec repère cible pour « ions face au style » [S34 : ui-compacte l. 196].
- **Pourquoi elle aide.** « Est-ce que ça reste dans mon style ? » se lit comme une position dans une bande : plus vite qu'en comparant une valeur à un chiffre de référence. [I]
- **Chez nous.** La bande n'apparaît que pour un style choisi. Le mot « au style » quand la barre est dans la bande, « hors style » quand elle sort ; l'unique couleur d'alerte n'est utilisée que pour « hors style ». La source de la bande s'écrit à côté (BJCP ou style du brasseur). Ne pas écrire « bon » ou « meilleur ».
- **Risque.** Une bande mal définie devient une décoration : Domo le souligne, les bandes arbitraires deviennent du bruit [S30, relayé]. Les bandes que nous poserions sont notre jugement ; elles doivent porter leur source. « Au style » peut se lire comme une note : le brasseur choisit, l'outil ne tranche pas.

### 6. Une chronologie d'ajout avec des repères, et une matrice des moments

- **Ce que c'est, qui l'utilise.** Une ligne par ajout, à l'échelle des jours, avec des repères de durée. Brewbound rapporte que les alcools monoterpéniques sont presque entièrement extraits en 24 h, que la plupart des thiols apparaissent dans les deux premiers jours, qu'un contact court est jugé plus fruité et un contact long plus herbacé [S18, relayé]. BeerSmith préfère 48 à 72 h et note qu'un contact trop long peut donner de l'herbacé [S11, relayé]. Brülosophy, en citant Shellhammer, place la saturation vers 8 g/L, avec des agrumes qui plafonnent plus tôt [S19, relayé]. Murphy & Son parle d'un maximum de saveur après 21 jours [S20, relayé]. Yakima Chief publie une matrice d'usage par produit et par étape [S2, relayé].
- **Pourquoi elle aide.** « 3 j Citra puis 7 j Galaxy » devient deux lignes de temps ; l'ordre est marqué « non calculé » (H §7.3). La matrice répond à « pourquoi 10′ et pas 60′ ? » d'un coup d'œil. [I]
- **Chez nous.** Étiquettes explicites : « contact 3 j », « retrait après 7 j ». Éviter « J+3 » seul ou « 3 days » seul : des fils de forum montrent des recettes où la même durée se lit de deux façons [S13, relayé]. Repères : 24 h (l'essentiel, sens) ; 2 jours (thiols) ; « saturation vers 8 g/L » (Cascade, un seul essai). Matrice : trois moments (ébullition, whirlpool, dry hop) × familles, en pastilles avec un mot.
- **Risque.** Les sources divergent (24 h contre 21 jours) : les afficher comme « sources divergentes », pas en moyenne. Pas de courbe lissée : le modèle V5.5 (τ = 2–12 h) n'est pas validé (H, tableau de l'existant). Une chronologie précise en jours peut faire croire à une cinétique mesurée.

### 7. Un curseur de dose et de moment qui redessine le profil

- **Ce que c'est, qui l'utilise.** Un curseur de dose, de 0 à 16 g/L, aimanté sur 2, 4, 8 et 16 (les doses des essais Cascade de Lafontaine et Shellhammer 2018, H §0 point 3). Le moment se règle par pas de 5′ sur toute la plage, et le jour du dry hop se règle aussi. Les crans bougent à chaque geste. Ahlberg et Shneiderman (CHI 1994) décrivent ce « filtre dynamique » : curseurs et boutons qui mettent à jour le résultat tout de suite [S31, relayé].
- **Pourquoi elle aide.** Le brasseur dit juger « au doigt » et veut voir « ce que ça change » : le retour immédiat est précisément ce pour quoi le filtre dynamique a été conçu. [I]
- **Chez nous.** Cible d'au moins 24 px pour chaque commande (DESIGN.md). Le geste doit se voir (mémoire, 19.10). Les valeurs entre deux marques ne sont pas affichées comme mesurées. Les familles sans donnée passent en « inconnu » et ne bougent pas.
- **Risque.** Un curseur continu invite à lire des différences entre deux marques : aimanter, et écrire « estimé ». Les moments sans donnée ne doivent pas faire bouger le profil comme s'ils étaient mesurés (H §7.5).

### 8. Un point par lot, et des unités comptées

- **Ce que c'est, qui l'utilise.** Quand des lots mesurés existent (Cascade : 29 lots, 19 fermes, OSU 2015 : H §0.5 [21]), chaque lot devient un point sur la même échelle de crans. Kay, Kola, Hullman et Munson (CHI 2016) ont conçu les quantile dotplots pour petit écran ; ils réduisent l'étalement des estimations de probabilité d'environ 1,15 fois par rapport aux densités [S22, relayé]. Fernandes et coll. (CHI 2018) montrent que ce type d'affichage améliore les décisions de bus, pas seulement la lecture [S23, relayé]. Les « hypothetical outcome plots » animent des tirages et aident à juger une tendance dans des données ambiguës [S21, relayé]. Les icon arrays aident les personnes à faible numératie, selon des résumés de Garcia-Retamero et Galesic [S24, relayé] ; Garcia-Retamero et Cokely (2013) insistent sur des éléments clairement définis et une relation partie-tout [S25, relayé]. Les fréquences naturelles améliorent le raisonnement bayésien [S26, relayé].
- **Pourquoi elle aide.** Un point par lot montre la variabilité réelle, que H place au même niveau que la variété (§0.5) : « ça varie d'un lot à l'autre » se voit sans lire un écart-type.
- **Chez nous.** Sous la barre de cran : 29 points, avec « 1 point = 1 lot (2015) ». Le toucher ouvre la liste des lots. Les hypothetical outcome plots restent en plan 2 : leur animation doit répondre à un toucher (DESIGN.md). Pour les autres variétés, pas de points : « pas assez de lots », jamais un zéro. [I]
- **Risque.** 29 lots d'un seul essai, en 2015, pour une seule variété : cela ne dit rien du lot que le brasseur achètera. Le point peut suggérer une précision. Les quantile dotplots sont faits pour une distribution modélisée ; avec des lots réels, un point par lot suffit. [I]

### 9. « Pourquoi ? » en une phrase, détail à un toucher

- **Ce que c'est, qui l'utilise.** Une réponse courte à « pourquoi » sous le graphique : une phrase avec le mécanisme et le chiffre, la source au toucher. Tintarev et Masthoff distinguent plusieurs buts d'une explication : transparence, possibilité de contester, efficacité, persuasion, confiance, satisfaction [S33, relayé]. Leur étude de 2012 rapporte qu'une explication personnalisée augmente la satisfaction mais réduit l'efficacité dans certains essais [S33, relayé].
- **Pourquoi elle aide.** Le brasseur est expert : il veut le mécanisme, pas un score. Pour « pourquoi 10′ et pas 60′ ? » : Janish signale que la majorité des huiles est perdue à l'ébullition [S9, lu] ; le modèle de Brewing.it retient environ 5 % pour une ébullition de 60′, hypothèse d'outil non validée [S10, relayé] ; un résumé cite −91 % de 4MMP après 60′ d'ébullition [H §0.4 [13]]. Phrase proposée : « À 60′, la plupart des huiles aromatiques partent : l'amertume reste. » L'amertume qui reste est une lecture générale de brasserie [I].
- **Chez nous.** Plan 1 : « À 60′, presque tout part. » (5 mots). Un toucher ouvre la phrase et la source ; un second geste ouvre le détail (plan 3).
- **Risque.** Une explication convaincante peut rendre le choix moins bon. Il faut mesurer si le brasseur choisit mieux, pas s'il est satisfait (Tintarev, [S33]). Éviter le ton de vente : les fabricants présentent leurs assemblages comme apportant des arômes qu'aucun houblon seul n'apporterait [S1, S2, relayés].

### 10. Quatre mots de confiance, toujours visibles

- **Ce que c'est, qui l'utilise.** Chaque chiffre ou cran porte un mot qui dit sa nature. H (§7.5) emploie quatre formes : « chiffre en plage », « sens », « drapeau », « inconnu ». Pour le brasseur, je propose des mots plus simples : « mesuré » (COA ou lot), « panel » (sens, fabricant, houblon broyé), « estimé » (calcul de l'outil), « inconnu » (pas de donnée). Janish précise que ses valeurs sont des moyennes par variété et que les lots peuvent différer [S9, lu]. Brewing.it publie ses hypothèses de rétention, sans validation citée [S10, relayé]. Le dépôt demande de distinguer mesure, cible et prévision [S34 : ui-compacte l. 196].
- **Pourquoi elle aide.** Le brasseur fait confiance selon la nature du chiffre. « Quitte à tricher » : la façon honnête de tricher est de dire quel type de chiffre on montre, en un mot. [I]
- **Chez nous.** Un mot par bloc, pas par cellule, sinon le premier écran se remplit. Le mot est du texte, pas seulement une couleur. Le toucher explique le mot en une ligne. « Drapeau » est un terme interne de H : à ne pas afficher.
- **Risque.** Quatre mots de plus au premier écran. À tester avec le brasseur, en contrôle, avant d'intégrer.

---

## Langage visuel : verdict sur les éléments demandés

| Élément | Verdict | Condition |
|---|---|---|
| 12 pictos au trait | Oui, en complément | 20–24 px à gauche du nom, jamais seuls ; sinon « pictogrammes mystérieux » [S34] |
| Barres verticales par famille en crans | À tester | 12 colonnes à 390 px : libellés trop larges ; repli en 12 lignes horizontales [I] |
| Piste d'objectif avec zone du style | Oui | Idée 5 ; repère cible en trait fin ; bande avec sa source |
| Le mot « au style » | Oui | Avec « hors style » en alerte unique ; jamais « bon » ou « meilleur » |
| « ? » de légende | Oui, hors premier plan | Le « ? » ouvre une feuille d'explication (plan 2) ; légende au premier plan interdite [S34] |
| Appui long ouvre la fiche | À compléter | Geste invisible (mémoire, 19.10) : ajouter un « Voir la fiche › » visible ; l'appui long reste un raccourci |

---

## Profil simulé : des huiles et des composés aux familles

**Réponse courte.** Oui, certains outils le font. Le schéma commun : dose × rétention selon le moment → poids par famille → saturation → échelle. Ce qui diffère, c'est la publication des constantes, et presque personne ne les publie.

| Outil | Entrées | Méthode | Sortie | Statut |
|---|---|---|---|---|
| Panels fabricants (Yakima Chief, BarthHaas, Hopsteiner) | Houblon broyé ou bière dégustée | Mesure sensorielle, pas de simulation | Profils 0–100 ou catégories | Fabricant ; [S1–S5, S7, S8] ; [H §1.1] |
| Scott Janish, Hop Oils Calculator | Variété, grammes, moment (whirlpool, pré-fermentation, dry hop) | Composition d'huile de la variété × dose ; ébullition exclue ; pas de formule publiée ; référence « dry hop » : 2 g dans 200 mL à 20 °C, 30 min | Composition finale et radar, données du Compendium | Lu [S9] ; date 2014 (pied de page) ; moyennes par variété ; Nelson Sauvin exclu, données absentes |
| Brewing.it, Hop Flavor Radar | Dose (g/L), moment | Rétention : dry hop ~80 %, whirlpool 50–100 %, ébullition 60′ ~5 % ; intensité par axe = 5 × (1 − e^(−0,7 × w)), w = dose pondérée, tel que résumé | Radar à 9 axes, 0–5 | Relayé [S10] ; constantes non vérifiées (page refusée deux fois) ; pas de validation sensorielle citée |
| BeerSmith Hop Control | Variétés, dose, moment, durée, température, type de houblon | Huiles essentielles des ajouts, ajustées au temps et à la température ; thiols inclus si pertinents ; formule non publique | Arôme de bière à côté du style BJCP ; jusqu'à six variétés | Relayé [S11] ; environ 300 variétés ; moyennes industrielles |
| Hopsteiner FlavorWheel (2013/2014) | Dégustation de bières | Outil de dégustation : le jury nomme l'influence du houblon ; pas de simulation | 7 ou 8 catégories | Relayé [S7, S8] |
| Chaîne de H (§7.4) | Charge (mL/hL, µg/L) → transfert → rapport au seuil → repère du style | Calcul par plages ; validé seulement sur l'étalonnage Cascade 2015 | Plages de sources, pas d'intervalle de confiance | Dépôt, H §7.4 |
| Thiols | Aucun calculateur trouvé | Nyséos publie un indicateur de potentiel thiol (TP) par lot ; la TP de Citra varie d'un lot à l'autre | Mesure de laboratoire | Relayé [S17] |

**Ce qu'on en retient.**
1. Les profils fiables sont des panels sur un produit donné (forme, étape). Un profil « simulé » n'est pas une mesure : le libellé doit le dire. [I]
2. Les méthodes les plus claires (Janish, Brewing.it) reposent sur quelques constantes choisies à la main. Si nous calculons, nous publions nos constantes et leur source, ou nous ne calculons pas. [I]
3. Une somme « huile × poids » présentée comme intensité est exactement ce que le dépôt refuse (`docs/index-houblon-recherche.md` §3, cité par H). [S34]

**Ce que « tricher un peu » peut vouloir dire, sans mentir.**
- Acceptable, signalé : arrondir en crans ; regrouper en 12 familles ; une seule bande pour une plage étroite de sources ; reprendre le mot du fabricant avec sa source.
- Non acceptable : un chiffre unique pour une plage qui va de ×10 à ×80 (seuils, H §0.6) ; une intensité pour un assemblage ou pour l'ordre de deux ajouts (H §7.3) ; un profil présenté comme mesuré sur le lot du brasseur ; un zéro à la place d'« inconnu » ; un cran plein sur une donnée absente.

---

## Pièges : ce qui rend ces outils incompréhensibles

1. **Commencer par la chimie.** Composés, µg/L, ng/L, plages comme « ×0,27–2303 » : le brasseur ne lit pas cela comme un goût.
2. **Des plages qui paraissent précises.** Un seuil varie d'un facteur 10 à 80 selon la source (H §0.6). Un rapport unique, « ×3 », ment si la plage est large.
3. **Unités mélangées.** mL/100 g (fabricants), mL/hL (H), µg/L, ng/L, µg/kg, mg/100 g. Une seule famille d'unités à l'écran (g/L, crans) ; le reste dans la fiche. Conversion donnée par H : 0,01 mL/hL ≈ 86 µg/L de linalol.
4. **Radar par défaut.** Dans une comparaison de vues radiales pour indicateurs composites, le radar est le moins efficace et le moins apprécié [S29, relayé]. Brewing.it et Janish l'utilisent quand même ; le dépôt l'interdit comme décoratif [S34]. À n'employer que pour des axes stables et des valeurs lisibles.
5. **Séries superposées sur de longs écarts.** Javed et coll. : la superposition se dégrade quand les valeurs sont éloignées [S28, relayé].
6. **Pictos ou couleurs seuls.** Interdit par le dépôt [S34].
7. **Légende au premier plan.** Interdite [S34].
8. **Libellés de durée ambigus.** « 4 days » ou « 7 days » lus de deux façons, et un ajout « au conditionnement » compté comme un jour de contact [S13, relayé].
9. **Thiols affichés comme goût.** Chez Lallemand, Diamond produit le plus de 3SH libérés, mais le panel juge les bières à levure ale plus fruitées [S15, relayé ; H §8.4]. Un chiffre de thiol ne dit pas ce qui se sent : la levure reste un drapeau, pas un chiffre. [I]
10. **Un profil de panel en houblon broyé pris pour un dry hop.** Citra et Cascade paraissent identiques sur ce support (H §1.1) : le libellé doit dire « houblon broyé ».
11. **Un verdict dans l'outil.** « Bon », « meilleur », « recommandé » : le brasseur choisit (mémoire, 18.10).
12. **Geste invisible.** Appui long sans indice (mémoire, 19.10) ; cibles sous 24 px [S34].
13. **Mouvement sans action.** Une animation de tirages au premier plan est interdite [S34].
14. **Inconnu lu comme zéro.** Interdit (mémoire, D65).
15. **Promesse de vente.** Les assemblages présentés par des phrases de vente [S1, S2, relayés].

---

## Ce qui n'a pas été trouvé, et limites

- **Brewfather** : aucune page trouvée sur son graphique houblon ni sur sa chronologie ; à refaire à partir de son changelog.
- **Beer Maverick** : aucune page de profil ni de substitution trouvée.
- **Brewer's Friend** : pas de calculateur d'arôme ; son calcul d'IBU ne prend pas le dry hop (forum, [S13]).
- **Calculateur de thiols** : aucun trouvé. Seuls des indicateurs de laboratoire et des résultats de fabricants.
- **Roue Hopsteiner actuelle** : le PDF de 2014 n'a pas pu être lu par l'outil ; les catégories de 2013 et 2014 diffèrent ; aucune version actuelle trouvée.
- **Brewing.it** : deux refus HTTP 429 ; contenu lu via un résumé de moteur ; constantes à vérifier avant tout usage.
- **Articles de recherche** (Gleicher, Kay, Fernandes, Kale, Tintarev, Garcia-Retamero, Shneiderman) : résumés, pages projet ou notices ; texte intégral non lu.
- **Pas de test utilisateur** trouvé sur les dotplots ou les radars en français, ni sur mobile.
- **Dates manquantes** : plusieurs pages n'en portent pas (Yakima, BarthHaas, Brewing.it, Brewbound, Murphy & Son).
- Aucun fichier modifié hors de ce rapport ; aucune donnée de l'app lue ou écrite.

---

## Décisions à trancher (pour le pilote et le brasseur)

1. Le « faux profil » : crans sourcés + mots de confiance (recommandé, option prudente) plutôt qu'un chiffre par famille.
2. Liste des 12 familles : garder la nôtre, ou la caler sur BarthHaas (crème-caramel et menthe absents de la nôtre). [I]
3. Présentation des 12 familles à 390 px : barres verticales à tester contre liste horizontale.
4. Source des bandes « au style » : BJCP ou styles du brasseur.
5. Contrôles avant tout lot : mots au premier écran (60 maximum), loupe ×3 pour le geste, couleurs (contrôle D74), inconnu ≠ zéro.

---

## Sources

Dates de consultation : 19.10.2026 pour toutes. Statut : *lu* = page ouverte ; *relayé* = résumé de moteur ou notice ; *dépôt* = fichier du dépôt.

- **[S1]** Yakima Chief, « Veterans Blend » (assemblage 2025, profil « fruit à noyau et tropical ») — https://www.yakimachief.com/veterans-blend.html — relayé ; date 2025.
- **[S2]** Yakima Chief, méthode des assemblages et « Product Usage Matrix » — https://www.yakimachief.com/resources/hop-blends — relayé ; date non trouvée.
- **[S3]** Yakima Chief, fiche Ahtanum (notes, myrcène) — https://www.yakimachief.com/ahtanum.html — relayé ; date non trouvée.
- **[S4]** BarthHaas, Hop Aroma Standards Kit (12 catégories et sous-termes) — https://www.johnihaas.com/aromastandardskit — lu ; date non indiquée.
- **[S5]** BarthHaas, Compendium (3 volumes, plus de 100 variétés) et sommet 2025 — https://www.barthhaas.com/company/news/news-article/bh/summit-meeting-for-brewing-professionals — relayé.
- **[S6]** Roue Hop Union, 11 familles, archivée — https://www.homebrewfinds.com/hop-union-aroma-wheel-dozens-of-hops-into-11-classifications/ — relayé ; date non trouvée.
- **[S7]** Hopsteiner, FlavorWheel, article Brauwelt International 2014 (Feiner et al.) — https://cdn.hopsteiner.de/assets/cdn/service/technical_information_and_support/technical-publications/2014-05_a-tasting-of-specially-hopped-beers_feiner-et-al_bwi.pdf — relayé ; PDF non lisible par l'outil.
- **[S8]** Hopsteiner, panel sensoriel (article sponsorisé Brauwelt, 2013) — https://brauwelt.com/en/news/hopsteiner/622279-hopsteiner-sensory-panel — relayé.
- **[S9]** Scott Janish, Hop Oils Calculator — https://scottjanish.com/?p=104 — lu ; © 2014 (pied de page), sources citées de 2008 et 2013.
- **[S10]** Brewing.it, Hop Flavor Radar — https://brewing.it.com/learn/hop-flavor — relayé ; deux refus HTTP 429 ; date non indiquée.
- **[S11]** BeerSmith, Hop Control — https://beersmith.com/blog/?p=14507 et https://beersmith.com/blog/?p=14787 — relayé ; texte d'environ 2024–2025 (déduit).
- **[S12]** BeerSmith, dry hop (2013) et version 3.1 — https://beersmith.com/blog/2013/11/25/dry-hopping-for-beer-revisited-part-1-of-2/ ; https://beersmith.com/blog/?p=8864 — relayé.
- **[S13]** Brewer's Friend, forum : durées de dry hop ambiguës ; pas de calcul d'utilisation au dry hop — https://www.brewersfriend.com/forum/goto/post?id=48606 ; https://www.brewersfriend.com/forum/goto/post?id=80284 — relayé ; dates non trouvées.
- **[S14]** Captain Brew et Homebrew Academy, substitutions par style et filtres par arôme — https://captainbrew.com/hop-substitutions-by-beer-style ; https://homebrewacademy.com/hops-chart/ — relayé.
- **[S15]** Lallemand Brewing, biotransformation, Pomona, Diamond, Verdant — https://www.lallemandbrewing.com/en/asia/resources/whats-new/biotransformation-ongoing-research/ ; https://admin.lallemandbrewing.com/wp-content/uploads/2020/08/IPA-Solutions-BP-ENG-17x11-web-LalBrew-2024.pdf — relayé ; source fabricant.
- **[S16]** Omega Yeast, Cosmic Punch (thiolisée) — https://omegayeast.com/all-about-thiolized-yeast ; Beer & Brewing, « Thiols unchained » — https://www.beerandbrewing.com/course/copy-of-a-scientific-look-at-hop-aroma-and-flavor/hot-side-hopping/thiols-unchained-more-ways-to-unlock-tropical-aromas — relayé ; source fabricant pour les chiffres.
- **[S17]** Beer & Brewing, « The complex case of thiols » (indicateur TP, Nyséos) — https://beerandbrewing.com/the-complex-case-of-thiols/ — relayé ; attribution à confirmer.
- **[S18]** Brewbound, cinétique d'extraction du dry hop — https://www.brewbound.com/?p=109916 — relayé ; date non trouvée.
- **[S19]** Brülosophy, Shellhammer et saturation du dry hop (essai 2019) — https://brulosophy.com/2019/02/21/the-surprising-science-of-dry-hopping-lessons-from-tom-shellhammer/ ; https://brulosophy.com/2019/06/24/investigating-the-dry-hop-saturation-point-exbeeriment-results/ — relayé.
- **[S20]** Murphy & Son, note technique « hop requirements » (maximum après 21 jours) — https://www.murphyandson.co.uk/resources/technical-articles/hop-requirements/ — relayé ; date non trouvée.
- **[S21]** Hullman, Resnick et Adar (2015, PLoS ONE) ; Kale et al., hypothetical outcome plots sur les tendances ambiguës (InfoVis 2018) — https://ideas.repec.org/a/plo/pone00/0142444.html ; https://idl.uw.edu/papers/hops-trends — relayé.
- **[S22]** Kay, Kola, Hullman, Munson (CHI 2016), « When(ish) is my bus? » — https://mucollective.northwestern.edu/project/when-ish-is-my-bus — relayé (résumé).
- **[S23]** Fernandes et coll. (CHI 2018), affichages d'incertitude et décisions de transport — https://mucollective.northwestern.edu/project/uncertainty-bus — relayé (résumé).
- **[S24]** Icon arrays : résumés de Garcia-Retamero et Galesic (faible numératie et littératie graphique) — https://digitalcommons.mtu.edu/michigantech-p/3546 — relayé ; article complet non ouvert.
- **[S25]** Garcia-Retamero et Cokely (2013), « Communicating Health Risks With Visual Aids », Current Directions in Psychological Science, 22(5) — https://journals.sagepub.com/doi/10.1177/0963721413491570 — relayé (résumé) ; dépôt : https://digitalcommons.mtu.edu/michigantech-p/12874.
- **[S26]** Gigerenzer et Hoffrage (1995), « How to improve Bayesian reasoning without instruction », Psychological Review, 102(4) — https://serval.unil.ch/notice/serval:BIB_285729DDD792 — relayé (notice ; chiffres repris d'une synthèse).
- **[S27]** Gleicher et coll., « Considerations for Visualizing Comparison » (IEEE TVCG, 2018) — https://pages.graphics.cs.wisc.edu/VisSnacks/papers/comparison ; https://par.nsf.gov/servlets/purl/10062070 — relayé.
- **[S28]** Javed, McDonnel, Elmqvist (2010), « Perception of Multiple Time Series » — https://www.academia.edu/2785994/Perception_of_Multiple_Time_Series — relayé (résumé).
- **[S29]** IBM Research et Université de Haïfa, « Off the Radar » (comparaison des vues radiales pour indicateurs composites) — https://research.ibm.com/publications/off-the-radar-comparative-evaluation-of-radial-visualization-solutions-for-composite-indicators — relayé ; date non trouvée.
- **[S30]** Graphique en barres cibles (Few, 2005) — https://en.wikipedia.org/wiki/Bullet_graph ; https://domo-webflow.domo.com/learn/charts/bullet-graphs — relayé ; source secondaire.
- **[S31]** Ahlberg et Shneiderman (CHI 1994), « Visual Information Seeking » — https://drum.lib.umd.edu/items/bfd2de84-fb14-4f5d-a798-dd9df05488f4/full — relayé.
- **[S32]** Shneiderman (1996), « The Eyes Have It » (vue d'ensemble, filtre et zoom, détail à la demande) — https://hci.stanford.edu/seminar/abstracts/97-98/980220-shneiderman.html — relayé (résumé).
- **[S33]** Tintarev et Masthoff (2012), User Modeling and User-Adapted Interaction, 22 ; revue de 2020 — https://abdn.elsevierpure.com/files/20864620/USER700.pdf ; https://arxiv.org/pdf/2006.08672 — relayé.
- **[S34]** Dépôt, lu : `DESIGN.md` (l. 390–410 « Trois plans » ; l. 592 mouvement) ; `docs/ui-compacte.md` (l. 188–210, tableau des représentations ; l. 208) ; `.claude/rules/affinee-frontend.md` ; `work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md` (§0, §1.1, §0.3–0.6, §6.5, §7.3–7.5, §8.4). Mémoires du 18.10 et du 19.10 (historiques, à vérifier contre le dépôt).
