# Simulation de la recette complète

Version courante `hop-recipe-experimental-v2`, seconde passe du 9 septembre 2026. La convention de coefficients reste `aggregation.version = hop-recipe-experimental-v1` : v2 corrige les bornes mathématiques sans modifier les hypothèses physiques. Le calcul est pur, local et linéaire dans le nombre d’ajouts et d’axes : aucune recherche de combinaisons, requête Firestore, écriture ou tâche IA. La version des coefficients reste indépendante de celle de l’algorithme.

Le contrat `HopRecipeInput` conserve volume, souche unique, tous les triplets d’ajout, leurs identifiants et jours éventuels, ainsi que les paliers réels. La sortie contient les prédictions par ajout, un résultat global sans faux triplet synthétique, les quantités analytiques introduites et les limites de conduite. Une référence de souche contradictoire est remplacée explicitement par la souche de recette, avec avertissement ; la validation stricte de persistance exige leur cohérence.

L’outil du compagnon `predict_hop_aroma` utilise ce même calcul lorsque les triplets ne sont pas fournis : la recette du contexte et les quantités/durées disponibles dans son journal font foi. Les reconnaissances documentaires de noms restent explicites et ne réécrivent pas la recette. Avec des triplets explicitement fournis, l’outil conserve une liste d’alternatives indépendantes, pouvant utiliser différentes souches ; cette liste n’est pas assemblée en une bière.

Dans la réponse de cet outil, les sources et listes d’explications répétées sont conservées une seule fois : `sourceRef` renvoie à `sourceDictionary`, `sourceSetRef` à `sourceSets`, puis aux sources, et `reasonSetRef` à `reasonSets`. Cette représentation est réversible, ne supprime aucun chiffre ni provenance et évite de dépasser la limite d’enregistrement des conversations avec vingt ajouts. Le moteur, les graphes et les instantanés utilisent toujours leur format complet habituel.

## Convention de cumul

Seuls les documents d’extrapolation activés dont `aggregation.version` reconnaît cet algorithme participent au cumul. Cette propriété porte une source datée et ses limites dans la collection de connaissances existante. Les coefficients numériques restent ceux du document d’extrapolation ; cette livraison ne les ajuste pas et n’ajoute aucun rendement biologique.

Pour chaque phase `g` et axe `a`, on définit la dose cumulée `Dg = somme(di)` et la contribution latente :

```
Hga = fga(Dg) × somme_i(di / Dg × pia × ci) × Tg
Ha = somme_g(Hga) × Xa × G × M
Ya = échelle_a(clamp(1 − exp(−(Ba + Ha)) + ra))
```

`f` reprend la réponse à la dose et, lorsqu’elle existe, la courbe publiée transférée dans le document. `p` est le paramètre de descripteur, `c` le contact, `T` l’expression de phase, `X` l’expression avec la souche, `G` le gain, `M` la matrice, `B` le fond aromatique de levure et `r` le résidu. Dose nulle signifie contribution de houblon nulle ; elle ne supprime pas le fond fermentaire.

Les contributions sont combinées avant la transformation sensorielle. Le fond de levure et le résidu sont appliqués une seule fois. Les paramètres communs de souche, matrice et gain restent hors de la somme ; on ne crée pas un tirage indépendant par ajout. La marge documentaire est le maximum des marges existantes des ajouts de dose potentiellement non nulle, appliqué une fois au signal possible total. Une répétition de source ou une scission de ligne ne réduit donc pas l’incertitude.

Le pool par phase est une convention de dose, pas une fusion des événements physiques. J7 et J12 restent distincts ; chacun conserve son contact, sa température et son contexte dans les sorties individuelles. Leur espacement n’accorde aucun bonus numérique sans loi étalonnée. Identifiants et libellés ne modifient pas le calcul. Une ligne 4 g/L divisée en deux lignes identiques de 2 g/L donne les mêmes bornes à l’arrondi machine près. Ajouter un houblon modifie la pondération et ne garantit pas une hausse de chaque arôme.

Si une dose manque, v2 conserve les contraintes documentaires et de contact sur toutes les pondérations possibles, sans moyenne imputée. Une phase inconnue rend le domaine sensoriel complet. Une souche de recette non identifiée ne donne aucune prédiction chiffrée. Le repère central n’est affiché que si les conditions nécessaires sont connues, qu’un support aromatique existe et que la bande discrimine une partie de l’échelle. Le domaine 0–100 n’est jamais une « tendance moyenne ».

### Correction v2 : dose inconnue, contact connu

v1 remplaçait toute la moyenne pondérée des descripteurs et contacts par `[0,1]` lorsqu’une dose manquait. Cela oubliait des contraintes pourtant connues, même pour un ajout unique, et pouvait élargir son résultat au simple cochage du cumul.

Pour une phase non vide, soit `ai = pia × ci`. Dès que `D > 0`, les poids `wi = di/D` sont positifs ou nuls et leur somme vaut 1. Pour toute répartition admissible :

~~~
min_i(ai.min) ≤ somme_i(wi × ai) ≤ max_i(ai.max)
D ≥ D0 = somme des seules doses connues
f_générique(D) ≥ D0 / (D0 + Kmax)
~~~

Ces inégalités restent vraies si les paramètres sont corrélés. La multiplication de facteurs positifs, la somme et la transformation sensorielle monotone donnent une enveloppe extérieure ; elles n’exigent aucun tirage indépendant. Le plancher de dose est calculé avec la fonction stable existante, sans imputer zéro à une dose inconnue. Si une courbe publiée est transférée, sa composante reste `[0,1]` car la dose pourrait sortir de son support : la borne est combinée avec le poids de transfert déjà présent en base.

Le cas `D=0` donne une contribution de houblon nulle ; on ne calcule jamais `0/0`. Une phase vide est ignorée. Une somme non finie conserve le repli prudent. Sans contact ou descripteur exploitable, la borne peut rester aussi large qu’avant. Les doses connues gardent exactement le calcul v1.

La preuve de ces bornes a reçu une vérification mathématique indépendante, distincte des tests numériques de complétion. Elle démontre l’inclusion des possibilités du modèle, **pas** une couverture statistique des bières réelles. Aucun coefficient, année de source, marge empirique ni niveau de confiance n’a été retouché.

### Archives

Les captures nouvelles inscrivent `hop-recipe-experimental-v2`. Le validateur et l’import rejouent les captures v1 avec la branche arithmétique historique, ses explications et ses preuves figées ; ils rejettent une version inconnue. Réétiqueter une capture v1 modifiée par la correction comme v2 est détecté. Aucune migration ni réécriture des prédictions existantes n’est effectuée.

## Ce que la bande garantit

Elle est l’enveloppe **conditionnelle à cette formule et ses paramètres**, calculée sans hypothèse d’indépendance statistique. Ce n’est ni un intervalle de confiance à 95 %, ni une garantie sur la bière réelle. En particulier, le résidu issu du modèle mono-ajout ne démontre aucune couverture des synergies, antagonismes ou effets d’espacement du mélange. `conditionalEnvelope: true` et `interactionsNonQuantifiees` rendent cette distinction disponible à l’interface et aux instantanés.

Les résultats exacts d’un seul ajout conservent leur priorité lorsqu’ils sont applicables. Les sorties de modèles de bière ne sont jamais additionnées : leur fond fermentaire et leur programme pourraient déjà être inclus. Aucun domaine exact n’est transféré silencieusement à une autre recette.

La [réponse à la dose Cascade publiée par Lafontaine et Shellhammer (2018)](https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517) motive une réponse non linéaire, mais ne valide pas cette équation de cumul. Les [essais de mélange de Takoi et al. (2016)](https://brewingscience.de/index.php/brewingscience/article/view/299) documentent des interactions sensorielles ; ils ne fournissent pas un bonus universel réutilisable. Les [essais Samia et al. (2024)](https://brewingscience.de/index.php/brewingscience/article/download/241/150/416) rappellent que plus de thiols ne suffit pas à prédire plus de tropical.

## Chimie et conduite

Les quantités introduites sont calculées uniquement sur les bases et unités compatibles : masse de produit tel quel × concentration absolue, ou volume d’huile total documenté. Ce sont des conversions SI et bilans d’entrée, pas une extraction ni une concentration finale. Le même lot utilisé deux fois conserve sa même marge analytique ; ses incertitudes ne sont jamais moyennées.

Chaque contribution conserve le plafond de confiance de sa catégorie de source défini dans la politique modifiable. Un jugement, une année absente ou une politique manquante imposent une confiance faible même si la mesure déclare « high ». La confiance totale ne dépasse jamais celle de la contribution la plus fragile. Une somme numérique non finie reste inconnue avec une explication et une confiance faible. Un ajout de dose nulle ne participe pas non plus aux alertes globales.

Un COA ponctuel sans marge peut donner un **nominal** `reported`, explicitement sans intervalle. Une analyse partielle donne uniquement `partialRange` ou `partialReported` et le nombre d’ajouts documentés ; ces sous-totaux ne représentent pas le total de recette. Matière sèche sans humidité, pourcentage d’huile sans base de conversion attestée, équivalents analytiques et HSI ne deviennent pas des masses absolues. Une non-détection est bornée seulement si une limite a été fournie.

Les concentrations finales ne sont reprises que pour un modèle exact couvrant l’unique ajout actif. Dans le schéma actuel, cela concerne `4mmpFree` en ng/L ; les autres concentrations finales restent inconnues. Aucun précurseur n’est transformé automatiquement en thiol libre, aucun acétate n’est créé et aucun rendement enzymatique n’est supposé.

Les paliers sont contrôlés contre la conduite de la souche lorsqu’elle est disponible. Sinon, les faits du catalogue sont utilisables seulement si toutes les températures sont des plages explicites en °C aux bornes identiques : aucune moyenne ou union de références contradictoires. Cela permet notamment de signaler Diamond à 19 °C lorsque sa plage documentaire chargée est 10–15 °C, sans guide détaillé de fermentation. Un palier à phase inconnue reste à vérifier ; la garde froide explicitement identifiée n’est pas contrôlée comme une fermentation primaire. Un palier d’ajout sans houblon à cru dans la recette est signalé. La température de fermentation n’est pas confondue avec celle du contact houblon ; il n’existe pas ici de loi numérique générale de production d’esters ou de phénols à partir de ces paliers.

## Vérifications

La suite couvre la réduction au cas mono-ajout, le fond levure unique à dose nulle, la permutation/scission, la conservation des événements et contacts, les données manquantes, les sources répétées, les domaines entiers sans centre trompeur, les unités et marges analytiques, les sous-totaux incomplets, ainsi qu’un scénario de vingt ajouts. Les tests de recette ne remplacent pas le benchmark scientifique séparant reproduction de sources, validation interne et transfert hors protocole.
