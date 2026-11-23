# Concevoir une bière NOLO avec des décisions de brasseur

La création d’une recette NOLO doit permettre de comparer librement plusieurs procédés, puis de choisir une charge de malt, une souche, un volume de dilution et une dose d’ajout compatibles entre eux. Pour une brasserie de 30 L sans désalcooliseur, les outils prioritaires sont un comparateur de voies, un budget d’alcool, un simulateur d’extrait et d’atténuation, un calculateur de dilution ou d’assemblage, un bilan des sucres ajoutés et un carnet d’essais comparables. Leur intérêt tient à une décision concrète : modifier le brouillon, dimensionner un essai ou identifier la mesure qui manque.

Les études et documents fabricants ci-dessous ont été consultés le 12 septembre 2026. Les résultats publiés sont séparés des exemples de calcul propres à L’Affinée. Les exemples ne sont ni des recettes validées, ni des analyses de produit. Le périmètre couvre la formulation et le suivi analytique ; la stabilité du produit et les conditions de commercialisation demandent une validation professionnelle propre au procédé.

## 1. Les questions qui méritent un outil

| Décision du brasseur | Information immédiatement utile | Action que l’outil doit permettre |
|---|---|---|
| Quelle quantité de malt pour ma cible ? | OG visée, plage d’alcool selon l’atténuation, marge réservée aux ajouts | Recalculer la charge, conserver sa composition, comparer avant/après |
| Puis-je corriger une bière trop alcoolisée ? | Eau nécessaire, volume final, capacité disponible, effet sur IBU et extrait | Ajouter une opération de dilution chiffrée |
| Puis-je apporter du goût avec une bière plus forte ? | Quantité maximale du composant, alcool du mélange, sucres encore fermentescibles | Créer un assemblage avec une quantité réelle |
| Combien de fruit ou de sucre reste possible ? | Masse de sucres, alcool déjà apporté, potentiel supplémentaire, marge restante | Adapter la dose ou le conditionnement |
| Quel essai fera progresser la recette ? | Petits volumes, une variable modifiée, résultats mesurés côte à côte | Mémoriser une comparaison reproductible |
| Puis-je me fier au nombre affiché ? | Origine de chaque donnée, portée, incertitude et opérations postérieures | Distinguer calcul de conception et analyse du produit fini |

Ce classement est une recommandation produit. Il privilégie les calculs réalisables avec les données d’une petite brasserie. Un écran qui demande d’emblée une chromatographie complète des sucres sera rarement utilisé ; une simulation explicite peut fonctionner avec une hypothèse d’atténuation, à condition de conserver l’état « estimation » et de ne jamais convertir cette hypothèse en mesure.

### Comparer librement les voies de production

Le comparateur doit conserver une même cible finale tout en laissant le choix du procédé et de la souche. Les besoins matériels ci-dessous sont une analyse d’adéquation pour L’Affinée ; ce tableau ne prétend pas valider un procédé de production. Chaque colonne de comparaison doit montrer le résultat calculable, ce qui manque, les ajouts finaux et le volume obtenu. Un résultat inconnu reste une option comparable et documentable.

| Voie | Besoin matériel à examiner | Attente calculable | Ce qui reste à mesurer ou à établir |
|---|---|---|---|
| Fermentation limitée par la souche | Installation de brassage et fermentation maîtrisée ; souche documentée | Plage OG × atténuation, puis bilan des ajouts | Fermentescibilité réelle du moût et résultat propre à la souche |
| Faible extrait, avec ou sans empâtage adapté | Pesée de petites charges, volumes reproductibles, suivi de densité | Charge de malt et alcool selon l’OG et l’atténuation retenues | Rendement d’extraction, équilibre gustatif et atténuation réelle |
| Fermentation interrompue | Capacité de pilotage et procédé aval validé ; contrôle analytique | Densité d’arrêt théorique : `OG − budget_base/131,25` | Instant permettant d’atteindre cette densité et alcool encore formable ; aucune durée d’arrêt automatique |
| Extraction à froid du malt | Maintien au froid, séparation des solides, traitement du moût extrait | Volume et OG mesurés ; projection ensuite selon la souche choisie | Rendement spécifique et profil extrait, sans reprendre le rendement d’un empâtage classique |
| Contact à froid avec la levure | Cuve et maîtrise du froid ; contrôle analytique et procédé aval validé | Bilan à partir d’un alcool mesuré ou d’une hypothèse explicite issue d’un essai | Température et durée seules ne déterminent pas l’alcool final |
| Seconde extraction ou seconde collecte | Collecte séparée, mesure de volume et densité, place pour un second lot | Quantité d’extrait collectée et alcool selon la fermentation envisagée | Fraction effectivement récupérable, composition et intérêt sensoriel |
| Désalcoolisation | Équipement adapté ou prestation extérieure | À retrait mesuré connu : `m_final = m_initial × (1 − fraction_retirée)`, puis conversion au volume final | Efficacité réelle, pertes de volume et de composés ; sans ces données, pas de taux de retrait inventé |
| Restitution ou assemblage après désalcoolisation | Dosage reproductible de composants caractérisés | Alcool et sucres rapportés au volume final, modèles B et C | Composition du support et évolution possible après ajout |

Le guide Lallemand distingue réduction de fermentescibilité et interruption/contact à froid, et insiste sur le contrôle analytique de ces dernières approches. Cela justifie de comparer séparément une voie qui agit sur le moût et une voie qui agit sur l’avancement de fermentation. [4 — Lallemand, guide NABLAB](https://admin.lallemandbrewing.com/wp-content/uploads/2023/08/NABLAB-BP-ENG-Digital-LalBrew.pdf)

Briess rapporte ses propres essais d’extraction à froid du malt : les proportions récupérées diffèrent de celles d’un moût de référence et des sucres simples sont tout de même extraits. L’auteur présente le travail comme exploratoire. Une recette d’extraction à froid doit donc demander ses propres mesures de rendement, et ne pas être assimilée au contact à froid du moût avec une levure. [16 — Dan Bies, Briess, 10 février 2020](https://brewingwithbriess.com/blog/cold-extraction-of-malt-components-and-their-use-in-brewing-applications/)

Une présentation de Zoë Edwards, de Fuller, Smith and Turner, montre des moûts forts et faibles intégrés à la fabrication par parti-gyle. Ce cas documente la collecte et l’assemblage de moûts de forces différentes ; il ne documente pas une bière NOLO obtenue automatiquement par seconde extraction. [17 — Fuller’s, présentation sur les contributions à l’amertume](https://s3.eu-west-2.amazonaws.com/brewers/QS6oB1gTThmPy4P1lRgE-2018-bitterness-contributions-to-fuller-s-beers-pdf)

Alfa Laval décrit une désalcoolisation avec récupération et redosage possibles des arômes. Cela montre pourquoi retrait d’alcool et restitution sont deux opérations distinctes. Pour un lot de 30 L, l’absence d’équipement sur place est une information de faisabilité à afficher ; elle n’empêche pas de comparer un scénario avec traitement extérieur et données documentées. [18 — Alfa Laval, module de désalcoolisation](https://www.alfalaval.com/id/products/process-solutions/brewery-solutions/beer-de-alcoholization-modules/de-alcoholization-module/)

## 2. Six cas concrets et leurs conséquences

### Cas 1 — LA-01 : la densité de départ reste une décision déterminante

Fermentis publie un programme d’essais sur des moûts de 6, 8, 10 et 15 °P fermentés à 20 °C. Dans ce programme, les alcools obtenus vont approximativement de 0,4 à 1,2 % vol. pour une atténuation apparente voisine de 14 %. Le fabricant décrit LA-01 comme consommant les sucres simples, avec conservation d’une grande partie des sucres du moût. Ce sont des observations de son protocole, utiles comme point de départ, et non une relation garantie pour toute recette. [1 — Fermentis, essais LA-01](https://fermentis.com/en/knowledge-center/expert-insights/beer/low-alcohol-beer-trend/)

**Décision pour 30 L.** Avant de choisir une cible de densité, le brasseur doit voir ce que deviennent les deux extrémités de son hypothèse d’atténuation. Le simulateur doit relier le curseur d’OG au résultat en alcool et afficher la densité maximale compatible avec le budget de la bière de base. La température d’empâtage peut être consignée comme variable d’essai ; elle ne doit pas générer automatiquement une précision fictive sur les sucres fermentescibles.

**Exemple de conception, non publié.** Avec OG = 1,024 et une atténuation supposée de 13–17 %, l’approximation en densité donne environ 0,41–0,54 % vol. avant ajouts. Le même brouillon peut donc sembler convenir avec une seule valeur centrale et dépasser sa cible à l’autre extrémité. Afficher la plage et sa provenance rend cette incertitude actionnable.

### Cas 2 — LoNa : une petite densité et une levure spécialisée ne suffisent pas

Schubert et ses coauteurs ont comparé LA-01, LoNa et W-34/70 sur des moûts proches de 6,6 °P. Le tableau 1 rapporte 0,53 % vol. pour LA-01, 0,56 % pour LoNa et 2,33 % pour W-34/70 ; les atténuations apparentes correspondantes sont 15,51 %, 16,26 % et 68,91 %. Les deux levures spécialisées dépassent ici 0,5 % vol. La conclusion utile est l’importance de l’essai et de l’analyse, sans généraliser ces trois valeurs à une autre installation. [2 — Schubert et al., 17 juin 2025, tableau 1](https://www.mdpi.com/2076-3417/15/12/6797)

La fiche actuelle de LoNa annonce une atténuation de 16–20 % dans les conditions standard indiquées, avec une dépendance au moût et au procédé. Son guide général NABLAB mentionne aussi 10–15 % dans un contexte d’empâtage adapté. Ces informations correspondent à des contextes différents : les réunir en une seule constante « LoNa = 15 % » perd une information décisive. [3 — Lallemand, fiche LoNa](https://admin.lallemandbrewing.com/wp-content/uploads/2023/04/LoNa-TDS-ENG-A4-Print-LalBrew.pdf), [4 — Lallemand, guide NABLAB](https://admin.lallemandbrewing.com/wp-content/uploads/2023/08/NABLAB-BP-ENG-Digital-LalBrew.pdf)

La page Lallemand relaie par ailleurs le témoignage de Sun King Brewery, qui rapporte plus de 70 itérations de développement avant sa formule NOLO satisfaisante. Ce témoignage commercial ne fournit pas un protocole transférable ; il illustre l’utilité d’un historique d’essais. [5 — Lallemand, témoignages LoNa](https://www.lallemandbrewing.com/en/united-states/products/lalbrew-lona/)

**Décision pour 30 L.** L’interface doit proposer une hypothèse éditable et sourcée, puis permettre son remplacement par l’expérience propre à la brasserie. Une plage issue de trois essais maison reste une plage observée, pas un intervalle de confiance statistique. Changer le malt, la souche ou le procédé doit rendre visible que le transfert de ces essais devient moins direct.

### Cas 3 — Dilution : elle peut faire partie de la recette

Une étude originale de 2026 a brassé des moûts concentrés avec LA-01, LoNa et une fermentation limitée de W-34/70. Avant dilution, les variantes LA-01 et LoNa se situent autour de 1,5 % vol. ; le tableau 3 rapporte ensuite environ 0,41–0,44 % vol. pour ces variantes. La dilution appartient ici à un procédé complet avec eau préparée et opérations de finition ; le chiffre final ne découle pas d’un simple changement de champ « volume ». [6 — Schubert et al., 3 mars 2026, sections 2.4 et 3, tableau 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC13000620/)

**Décision pour 30 L.** Afficher simultanément l’eau à ajouter, le volume fini, les IBU dilués et la concentration d’extrait. Une correction qui exige 50 L dans une installation de 30 L doit être signalée avant application. La capacité utile est une donnée séparée : une cuve nominale de 30 L n’implique pas automatiquement 30 L de capacité de travail.

**Exemple de calcul, non publié.** Pour 20 L à 0,60 % vol., atteindre 0,40 % demande approximativement 10 L d’eau et produit 30 L. Une bière à 18 IBU et 55 g/L d’extrait connu passe respectivement à 12 IBU et 36,7 g/L, avant les éventuelles interactions et pertes. Le calcul informe sur les concentrations ; il ne prédit ni le corps perçu, ni la qualité aromatique, ni le pH.

L’assemblage avec une seconde bière répond au même bilan d’alcool. Il mérite un contrôle distinct, car le second composant peut apporter ses propres sucres fermentescibles : connaître son alcool actuel ne suffit pas à décrire l’évolution ultérieure du mélange.

### Cas 4 — Framboise et resucrage : deux apports qui s’additionnent

Galli et ses coauteurs ont étudié une bière à la framboise avec des souches de S. cerevisiae. L’essai ajoute 150 g/L de purée après le début de fermentation, puis 5 g/L de saccharose au conditionnement. Les auteurs mesurent dans la purée du glucose et du fructose et observent un apport de sucres ainsi qu’une hausse de l’alcool des bières aux fruits. Cette étude porte sur une bière alcoolisée, pas sur une NOLO ; elle établit l’existence des contributions, sans fournir une vitesse de fermentation transférable à une levure NOLO. [7 — Galli et al., 7 septembre 2023, sections 2.5 et 3.3–3.4](https://www.mdpi.com/2304-8158/12/18/3354/html)

**Décision pour 30 L.** Un ajout de fruit doit avoir une masse, une teneur en sucres avec son unité et une contribution au volume. « Purée de framboise » ne permet pas d’inventer ces données. Le brasseur doit voir séparément la dilution de l’alcool déjà présent et l’alcool encore formable à partir des sucres ajoutés. Le conditionnement fait ensuite partie du même bilan.

**Exemple de calcul, non publié.** Ajouter 6 g/L de saccharose à 30 L représente 180 g et un plafond stœchiométrique d’environ +0,409 point de % vol., à volume constant. Une bière initialement à 0,25 % vol. peut ainsi atteindre environ 0,66 % dans ce scénario maximal. La carbonatation forcée n’apporte pas de sucre de resucrage ; elle ne supprime pas le potentiel des sucres déjà présents.

### Cas 5 — Une IPA NOLO ne doit pas ignorer l’ajout de houblon

Kirkpatrick et Shellhammer ont montré expérimentalement que l’ajout de Cascade à une bière déjà fermentée pouvait libérer des sucres à partir des dextrines et provoquer une reprise de fermentation. Leur résultat dépend de la dose, de la température et du temps. Il concerne leur matrice, leurs houblons et leur levure ; aucun pourcentage supplémentaire universel ne peut être affecté à la simple présence d’un dry hopping. [8 — Kirkpatrick et Shellhammer, août 2018](https://pubmed.ncbi.nlm.nih.gov/30084254/)

White Labs décrit WLP618 NA All Day comme une souche de Saccharomycodes ludwigii consommant glucose, fructose et saccharose, avec une atténuation dépendante de la recette et de l’empâtage. Un choix « maltose négative » ne justifie donc pas d’ignorer toute apparition ultérieure de sucre simple. [9 — White Labs, WLP618](https://www.whitelabs.com/yeast-single?id=179&type=YEAST)

**Décision pour 30 L.** Le carnet doit distinguer les mesures avant et après le dernier ajout, et le bilan doit signaler une contribution non caractérisée. Le produit peut aider à comparer deux essais de houblonnage et leurs mesures. Il ne doit pas générer une courbe d’alcool dans le temps à partir de la seule durée de dry hopping.

### Cas 6 — Le laboratoire mesure autre chose qu’une estimation OG–FG

Le service White Labs LS6646GC décrit une analyse par chromatographie gazeuse destinée notamment aux boissons à faible teneur en alcool, avec un domaine annoncé de 0,01–3 % vol. Le plan de contrôle ASBC distingue de son côté densité, alcool, pH et dégustation comme des informations séparées. Ces sources montrent qu’un suivi densimétrique et une mesure spécifique de l’alcool répondent à des questions différentes. [10 — White Labs, LS6646GC](https://www.whitelabs.com/lab-services-product-detail?id=94&type=PRODUCT), [11 — ASBC, Brite Tank](https://www.asbcnet.org/lab/samplingplan/Documents/Brite.html)

**Décision pour 30 L.** Préparer une fiche de mesure qui conserve date, lot, méthode, résultat, marge analytique fournie et position dans les opérations. Si une dilution ou un resucrage suit l’échantillonnage, l’analyse reste valide pour l’échantillon analysé ; elle ne devient pas une analyse du produit après ces opérations. La prochaine action doit être explicite : compléter le volume, documenter la composition de l’ajout ou mesurer l’alcool du produit fini.

## 3. Modèles calculables et domaine de validité

### Conventions communes

Dans les formules suivantes, `A` est une teneur en alcool exprimée en **% vol.**, `V` un volume en litres, `m` une masse en grammes, `a` une atténuation en fraction, et `SG` la densité relative. Les variables doivent porter leur unité à l’écran et dans les données. Une masse de fruit n’est pas un volume de purée ; un degré Brix n’est pas une analyse de glucose ; l’extrait total n’est pas une masse de sucres fermentescibles.

La masse volumique de l’éthanol retenue pour les exemples est `ρ = 789,24 g/L` à 20 °C. Elle provient des tables alcoométriques OIML. Le facteur 100 dans la conversion suivante est nécessaire parce que l’alcool est exprimé en pourcentage : `A = 100 × m_éthanol / (ρ × V)`. [12 — OIML, tables alcoométriques internationales](https://www.oiml.org/fr/files/pdf_r/r022-f75.pdf/@@download/file/R022-f75.pdf)

### Modèle A — Cible d’extrait à partir d’un budget d’alcool

La convention de simulation en densité est :

```text
FG_estimée = 1 + (OG − 1) × (1 − a)
A_estimé = 131,25 × (OG − FG_estimée)
          = 131,25 × (OG − 1) × a

Budget_base = cible_finale − réserve_ajouts − réserve_de_conception
OG_max = 1 + Budget_base / (131,25 × a_max)
```

Le coefficient 131,25 est une approximation brassicole de conception, déjà présente dans L’Affinée, et non une méthode analytique validée pour certifier une NOLO. Ce modèle ne doit pas être combiné silencieusement avec une atténuation calculée sur une autre échelle, par exemple un ADF exprimé à partir des degrés Plato. La conversion entre échelles et la provenance des hypothèses doivent rester explicites.

Cette inversion simple suppose un volume de référence constant et une atténuation maximale strictement positive. Si la bière de base est ensuite diluée, le budget destiné à la base, exprimé sur le volume fini, doit être multiplié par `V_final/V_base` avant l’inversion d’OG. Les réserves et contributions des ajouts doivent toutes se rapporter au même volume final. Une atténuation nulle ne permet pas d’inverser la formule pour obtenir une OG maximale.

La réserve de conception est une décision du brasseur. Elle ne doit être ni une mesure préremplie, ni une « marge légale », ni une incertitude statistique fabriquée. Avec un budget de base de 0,40 % et `a_max = 0,20`, l’OG maximale de ce modèle vaut environ 1,01524. Si les réserves consomment tout le budget, le résultat utile est « aucun budget disponible pour la base ».

Pour modifier la charge de malt, une première approximation est `masse_nouvelle = masse_actuelle × (OG_cible − 1)/(OG_actuelle − 1)`, à volume et rendement constants. Elle n’est applicable que lorsque la base de calcul est complète, que tous les ingrédients concernés participent à la même mise à l’échelle et qu’aucune contribution fixe ne doit être conservée séparément. Après modification, le moteur de recette doit recalculer l’OG, le rendement restant une hypothèse.

### Modèle B — Dilution et assemblage

```text
A_mélange = Σ(V_i × A_i) / V_final
V_final ≈ Σ(V_i)

Avec de l’eau sans alcool :
V_eau = V_base × (A_base / A_cible − 1)

Ajout d’une bière plus forte à une base moins alcoolisée :
V_forte = V_base × (A_cible − A_base) / (A_forte − A_cible)
```

Ce sont des bilans de quantité d’alcool avec approximation de volumes additifs. Un volume final mesuré, à température définie, est préférable à leur simple somme. Le modèle n’est pas un calcul de désalcoolisation : une évaporation ou une séparation membranaire modifie le bilan et exige ses propres données.

Pour une substance dissoute connue en g/L, on conserve la masse : `C_final = Σ(V_i × C_i)/V_final`. Pour les IBU, la moyenne pondérée fournit une estimation de dilution pratique si aucune nouvelle extraction ni réaction n’intervient. Elle ne prédit pas l’amertume perçue. Le pH ne doit jamais être moyenné ainsi, car le pouvoir tampon des composants intervient.

Un exemple d’assemblage fictif : 25 L à 0,20 % et une bière à 5,0 % permettent environ 1,087 L d’ajout pour une cible de 0,40 %, avant toute fermentation supplémentaire. L’outil doit aussi demander les sucres résiduels du composant ou annoncer leur contribution inconnue.

Avec des intervalles d’alcool, le besoin en eau qui couvre la borne haute se calcule sur `A_base_max`. Si cette borne manque, aucune dilution « suffisante » ne peut être affirmée. Une cible égale à zéro rend le solveur impossible pour une quantité positive d’alcool ; une cible déjà atteinte ne doit pas produire un volume d’eau négatif.

### Modèle C — Fruits, sucres et supports aromatiques

Le plafond théorique de fermentation découle de la stœchiométrie. Une mole d’hexose donne au maximum deux moles d’éthanol ; après hydrolyse, une mole de saccharose peut en donner quatre. Les masses molaires conduisent à environ 0,5114 g d’éthanol/g de glucose ou fructose et 0,5383 g/g de saccharose anhydre. Ce calcul propre à L’Affinée est un plafond sans pertes, pas le rendement attendu d’une fermentation. [13 — NIST, masse molaire de l’éthanol](https://webbook.nist.gov/cgi/cbook.cgi?Name=ethanol&cTC=on)

```text
m_sucres = masse_ajout_g × teneur_sucres_g_pour_100g / 100
ΔA_max = 100 × Σ(m_sucre_j × rendement_max_j) / (ρ × V_final)
m_sucre_max = budget_restant × ρ × V_final / (100 × rendement_max)

Alcool apporté par un arôme liquide :
A_apport = V_arôme_L × A_support / V_final
```

La conversion masse → sucres utilise l’étiquette ou l’analyse de l’ingrédient choisi. Si seule une teneur Brix est disponible, la présenter comme hypothèse de solides solubles ; ne pas la transformer en profil de sucres complet. Avec des sucres non ventilés, conserver un plafond conservateur fondé sur les catégories possibles et afficher cette incertitude. Une poudre hydratée, une solution ou un mélange de sucres ne reçoit pas automatiquement le rendement du sucre anhydre pur.

Avec 0,10 point de % vol. de budget restant dans 30 L, le plafond correspondant à du saccharose pur est d’environ 44,0 g, soit 1,47 g/L. Cette quantité ne comprend aucun sucre résiduel non documenté. À l’inverse, 100 mL d’un support aromatique hypothétique à 40 % ajouté à 30 L à 0,40 % donne environ 0,532 % vol. avant toute contribution de sucre : une dose aromatique peut compter même quand elle paraît faible.

**Exemple fruit entièrement fictif.** Une base de 27 L à 0,30 % reçoit un ajout caractérisé contenant 300 g de glucose/fructose ; on suppose 30 L finis. L’alcool déjà présent devient 0,27 % par dilution. Le plafond supplémentaire des sucres est de 0,648 point, soit environ 0,918 % au total si tous ces sucres suivent la conversion maximale. Aucune teneur standard de fruit ni consommation effective de sucre n’est supposée à partir du seul nom de l’ingrédient.

### Modèle D — Comparaison d’essais et sensibilité aux mesures

Un comparateur utile conserve volume, OG, FG, souche, composition, profil d’empâtage, ajouts et observations de dégustation pour chaque essai. Il calcule l’atténuation apparente en densité avec `(OG − FG)/(OG − 1)` lorsque l’OG est supérieure à 1. Une mesure d’alcool indépendante conserve son propre champ et ne doit pas être remplacée par ce calcul.

La différence entre essais doit porter sur les données observées. Une note sensorielle « corps : 2/5 » est une observation locale ; elle n’autorise pas un algorithme à prédire le corps d’une autre recette. Le comparateur peut montrer sucre résiduel connu, extrait connu et IBU, tout en laissant le résultat sensoriel à l’évaluation du brasseur.

**Exemple d’incertitude instrumentale.** Dans le modèle `131,25 × (OG − FG)`, deux lectures hypothétiquement bornées à ±0,001 SG peuvent produire une variation de ±0,2625 point de % vol. sur la différence, au pire des erreurs opposées. Ce n’est pas une spécification de densimètre ni une erreur automatique à ajouter : c’est un exemple montrant pourquoi la résolution, l’étalonnage et la méthode doivent être saisis ou documentés.

## 4. Spécification des outils recommandés

| Outil | Entrées nécessaires | Sorties et effet concret | Calcul testable | Limites visibles |
|---|---|---|---|---|
| **Comparer les voies** | Même cible finale, procédé et souche au choix, données propres à chaque voie | Avant/après, matériel nécessaire, volume final, hypothèses manquantes ; application du scénario choisi | Même bilan d’opérations ; modèles de production distincts selon la voie | Inconnu reste inconnu ; aucun changement forcé de levure ; résultat faible en alcool distinct de faisabilité |
| **Cibler le moût** | Cible finale, réserves choisies, OG, plage d’atténuation et origine | Plage d’alcool, OG maximale, facteur de charge, comparaison des ingrédients | Modèle A ; inversion puis recalcul de la recette | Approximation de conception ; pas de sucres déduits de l’OG |
| **Diluer** | Volume, alcool ou plage, cible ; IBU/extrait facultatifs | Litres d’eau, volume final, concentrations, dépassement de capacité | Modèle B ; conservation de la quantité d’alcool | Volume additif approximatif ; pas de corps ou pH prédits |
| **Assembler** | Volumes et alcools des composants, cible, sucres documentés | Quantité admissible, alcool présent, potentiel restant | Modèle B puis bilan des sucres | Alcool mesuré du composant distinct de son potentiel |
| **Budgéter les ajouts** | Masse, sucres avec unité, catégories connues, volume ; alcool du support si présent | Grammes de sucre, alcool ajouté, plage de potentiel, marge restante | Modèle C | Composition absente ≠ zéro ; plafond ≠ résultat probable |
| **Comparer des essais** | Variables d’essai et mesures datées ; notes du brasseur | Tableau avant/après, différences, hypothèses à réutiliser | Modèle D et soustraction des observations | Pas de causalité prouvée sur un seul essai |
| **Relire le bilan final** | Suite ordonnée des opérations, analyses liées à leur contexte | Frise des apports, mesure encore applicable, donnée manquante prioritaire | Quantités conservées à chaque opération ; nouvelle analyse au bon état | Aucune certification de stabilité ou de commercialisation |

Le visualiseur le plus informatif est une évolution **par opération** : bière de base, dilution, fruit, arôme, conditionnement. L’axe indique ces opérations, pas une durée de fermentation supposée. Une partie solide peut représenter l’alcool mesuré ou apporté ; une plage distincte représente ce qui reste formable. Si une borne supérieure est inconnue, le graphique doit le montrer, et conserver la liste des données manquantes lisible sans devoir interpréter la couleur.

Le simulateur de moût peut fournir une grille compacte d’OG × atténuation et mettre en évidence la cellule du brouillon. Les lignes voisines aident à décider de diminuer l’extrait ou de consacrer un essai à l’atténuation. Il est préférable de montrer cinq variantes compréhensibles à un nuage continu dont la précision n’a pas de fondement.

Les champs d’analyse avancée doivent rester disponibles à la demande. L’usage quotidien commence par le volume, la cible et l’action envisagée. Toute valeur appliquée à la recette doit réutiliser les composants et les unités habituels, conserver les valeurs antérieures pour comparaison et ne pas réécrire les brassins déjà lancés.

## 5. Cas numériques de contrôle

Les cas suivants sont construits pour contrôler les calculs. Aucun n’est présenté comme un résultat de brassage publié. Les chiffres sont arrondis pour la lecture ; les calculs intermédiaires doivent conserver leur précision.

| Contrôle | Données | Résultat attendu |
|---|---|---|
| Sensibilité à l’atténuation | OG 1,024 ; 13–17 % | Environ 0,410–0,536 % vol. |
| Cible de la bière de base | Budget 0,40 % ; atténuation maximale 20 % | OG maximale ≈ 1,01524 |
| Dilution simple | 20 L ; 0,60 % → 0,40 % | +10 L ; 30 L finaux |
| Concentrations après cette dilution | 18 IBU ; extrait 55 g/L | 12 IBU ; 36,7 g/L |
| Assemblage | 25 L à 0,20 % ; ajout à 5,0 % ; cible 0,40 % | Ajout ≈ 1,087 L |
| Resucrage | 30 L ; saccharose 6 g/L | 180 g ; plafond supplémentaire ≈ 0,409 point de % vol. |
| Fruit caractérisé | Base 27 L à 0,30 % ; ajout avec 300 g d’hexoses ; 30 L finis | Alcool présent 0,270 % ; plafond supplémentaire 0,648 point ; total ≈ 0,918 % |
| Budget de sucre | 30 L ; marge 0,10 point de % vol. | Saccharose pur ≈ 44,0 g au maximum dans le modèle |
| Support aromatique | 30 L à 0,40 % ; 100 mL à 40 % | Alcool présent ≈ 0,532 % vol. |
| Lecture d’essai | OG 1,025 ; FG 1,0205 | Atténuation SG 18,0 % ; alcool estimé ≈ 0,591 % |
| Inconnue | Ajout actif dont les sucres ne sont pas renseignés | Potentiel total indéterminé ; aucune borne inventée |

Les contrôles d’intégration doivent aussi vérifier qu’une opération ajoutée deux fois compte deux fois, qu’une opération retirée disparaît du bilan, qu’une analyse antérieure demeure identifiable et qu’une donnée explicitement nulle reste différente d’une donnée absente. Il faut recalculer après une modification de volume : additionner des points de % vol. calculés sur des volumes différents produit un résultat faux.

## 6. Portée suisse et choix de validation

L’OFDF rappelle que la bière dont l’alcool ne dépasse pas 0,5 % du volume est exonérée de l’impôt sur la bière. Cette règle fiscale donne un repère concret, sans constituer à elle seule une validation d’étiquetage ou de procédé. [14 — OFDF, brochure sur l’impôt sur la bière, section 2.3](https://www.bazg.admin.ch/dam/fr/sd-web/SSeweISeFsBZ/Brosch%C3%BCre%20Biersteuer%20Schweiz%20def%20Version%20fr.pdf)

Pour la définition alimentaire, le texte consolidé de l’ordonnance sur les boissons, état au 1er août 2026, place la limite des boissons sans alcool à 0,5 % vol. pour la boisson prête à consommer, et traite la bière sans alcool aux articles 67–68. Le texte a été consulté dans sa reproduction consolidée ; le lien Fedlex officiel est fourni pour la version juridique de référence. [15 — Ordonnance, texte consolidé consulté](https://ch.odat.ch/fr/cc/817.022.12-20260801-fr.html), [Fedlex, RS 817.022.12](https://www.fedlex.admin.ch/eli/cc/2017/220/fr?version=20260801)

Une cible interne inférieure à 0,5 % peut réserver de la place aux ajouts et aux variations du procédé. Le niveau de cette réserve doit résulter des essais et de l’incertitude de mesure ; aucune valeur universelle n’est proposée. Un affichage arrondi « 0,5 » ne permet pas de décider d’une conformité à une limite de 0,5.

Pour la stabilité, la documentation LoNa demande un procédé adapté et une maîtrise du produit après fermentation. Un calcul de recette ne remplace pas cette validation. L’application doit conserver les références du procédé validé et des analyses utiles, sans fournir de seuil universel de pH, de durée de conservation ou de barème thermique. [5 — Lallemand, utilisation et stabilité de LoNa](https://www.lallemandbrewing.com/en/united-states/products/lalbrew-lona/)

La première itération utile pour L’Affinée réunit donc des décisions locales et réversibles : comparer plusieurs procédés, dimensionner le moût, chiffrer une dilution, budgéter un ajout, comparer des essais et préparer une analyse. La preuve d’utilité est le parcours complet : partir d’un brouillon trop alcoolisé ou incomplet, comprendre la cause, produire une modification chiffrée et conserver une distinction nette entre estimation et mesure.

## Sources

Toutes les pages et tous les documents cités ont été consultés le 12 septembre 2026. « Sans date » signifie qu’aucune date de publication suffisamment claire n’était disponible ; une date d’indexation n’a pas été utilisée comme date de publication.

1. **Fermentis.** [Low-Alcohol beer: how to answer this global trend?](https://fermentis.com/en/knowledge-center/expert-insights/beer/low-alcohol-beer-trend/). Sans date. Essais fabricants LA-01 sur plusieurs densités ; portée limitée au protocole présenté.
2. **Schubert, C., Maxminer, J., Aitkens, M., Maust, A., Pontes Guimarães, B., Sen, R., Lafontaine, S.** [Filtration Challenges in Non-Alcoholic and Low-Alcohol Beer Production with a Focus on Different Yeast Strains](https://www.mdpi.com/2076-3417/15/12/6797). *Applied Sciences*, 15(12), 6797, 17 juin 2025. DOI : 10.3390/app15126797. Résultats analytiques, tableau 1.
3. **Lallemand Brewing.** [LalBrew LoNa — Technical Data Sheet](https://admin.lallemandbrewing.com/wp-content/uploads/2023/04/LoNa-TDS-ENG-A4-Print-LalBrew.pdf). Version accessible au jour de consultation, date de révision non confirmée. Atténuation et limites d’utilisation.
4. **Lallemand Brewing.** [Best Practices — Non-Alcohol and Low-Alcohol Beer Production](https://admin.lallemandbrewing.com/wp-content/uploads/2023/08/NABLAB-BP-ENG-Digital-LalBrew.pdf). Sans date clairement confirmée. Différence entre comportement de souche et fermentescibilité du moût.
5. **Lallemand Brewing.** [LalBrew LoNa, page produit et témoignages](https://www.lallemandbrewing.com/en/united-states/products/lalbrew-lona/). Sans date. Données fabricant actuelles, témoignage Sun King, portée générale de la stabilité.
6. **Schubert, C., Escobar, K., Sen, R., Maskell, D., Lafontaine, S.** [High-Gravity Brewing, Yeast Strain Selection, and Glucose Oxidase Effects on the Quality of Nonalcoholic Beer](https://pmc.ncbi.nlm.nih.gov/articles/PMC13000620/). *ACS Omega*, 11(10), 16744–16755, publication en ligne le 3 mars 2026. DOI : 10.1021/acsomega.5c13295. Cas expérimental de dilution, tableau 3.
7. **Galli, V., Venturi, M., Guerrini, S., Mangani, S., Barbato, D., Vallesi, G., Granchi, L.** [Exploitation of Selected Sourdough Saccharomyces cerevisiae Strains for the Production of a Craft Raspberry Fruit Beer](https://www.mdpi.com/2304-8158/12/18/3354/html). *Foods*, 12(18), 3354, 7 septembre 2023. DOI : 10.3390/foods12183354. Étude sur bière alcoolisée ; ajouts de purée et saccharose. [Copie institutionnelle de l’article](https://flore.unifi.it/retrieve/d81efabf-e7c3-4e82-b71a-e21ab9382aea/foods-12-03354.pdf).
8. **Kirkpatrick, K. R., Shellhammer, T. H.** [Evidence of Dextrin Hydrolyzing Enzymes in Cascade Hops (Humulus lupulus)](https://pubmed.ncbi.nlm.nih.gov/30084254/). *Journal of Agricultural and Food Chemistry*, 66(34), 9121–9126, publication en ligne le 17 août 2018. DOI : 10.1021/acs.jafc.8b03563. Résumé de l’article original consulté.
9. **White Labs.** [WLP618 NA All Day](https://www.whitelabs.com/yeast-single?id=179&type=YEAST). Sans date. Profil d’assimilation et dépendance de l’atténuation au procédé.
10. **White Labs.** [Alcohol by Volume by Gas Chromatography — LS6646GC](https://www.whitelabs.com/lab-services-product-detail?id=94&type=PRODUCT). Sans date. Exemple de méthode analytique spécifique aux faibles teneurs ; aucun achat ni prestataire imposé.
11. **American Society of Brewing Chemists.** [Quality Management — Step 10: Brite Tank](https://www.asbcnet.org/lab/samplingplan/Documents/Brite.html). Sans date. Distinction des familles de mesures de contrôle.
12. **Organisation internationale de métrologie légale.** [Tables alcoométriques internationales, R 22](https://www.oiml.org/fr/files/pdf_r/r022-f75.pdf/@@download/file/R022-f75.pdf). 1975. Masse volumique de l’éthanol à 20 °C.
13. **National Institute of Standards and Technology.** [NIST Chemistry WebBook, SRD 69 — Ethanol](https://webbook.nist.gov/cgi/cbook.cgi?Name=ethanol&cTC=on). Base de données, sans date de page. Masse molaire de l’éthanol ; les rendements stœchiométriques sont des calculs de L’Affinée.
14. **Office fédéral de la douane et de la sécurité des frontières.** [Impôt sur la bière en Suisse, brochure](https://www.bazg.admin.ch/dam/fr/sd-web/SSeweISeFsBZ/Brosch%C3%BCre%20Biersteuer%20Schweiz%20def%20Version%20fr.pdf). Version accessible au jour de consultation, sans date identifiée. Section 2.3, page 4.
15. **Département fédéral de l’intérieur.** [Ordonnance du 16 décembre 2016 sur les boissons, RS 817.022.12](https://www.fedlex.admin.ch/eli/cc/2017/220/fr?version=20260801), état au 1er août 2026. Articles 2 et 67–68 consultés dans la [reproduction consolidée odat](https://ch.odat.ch/fr/cc/817.022.12-20260801-fr.html). La reproduction ne remplace pas la publication officielle.
16. **Bies, Dan, Briess Malt & Ingredients.** [Cold Extraction of Malt Components and Their Use in Brewing Applications](https://brewingwithbriess.com/blog/cold-extraction-of-malt-components-and-their-use-in-brewing-applications/). Republication le 10 février 2020. Travail exploratoire du fabricant ; distinction extraction et fermentation.
17. **Edwards, Zoë, Fuller, Smith and Turner.** [Bitterness contributions to Fuller’s beers](https://s3.eu-west-2.amazonaws.com/brewers/QS6oB1gTThmPy4P1lRgE-2018-bitterness-contributions-to-fuller-s-beers-pdf). Présentation, date non confirmée dans les diapositives ; fichier référencé 2018. Schéma des moûts forts et faibles, diapositive 6.
18. **Alfa Laval.** [De-alcoholization module](https://www.alfalaval.com/id/products/process-solutions/brewery-solutions/beer-de-alcoholization-modules/de-alcoholization-module/). Sans date. Description fabricant du retrait et de la restitution d’arômes ; aucun rendement de transfert présumé.
