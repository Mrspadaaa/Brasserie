# Validation scientifique des prédictions de houblon et de fermentation

Le benchmark exécute le moteur utilisé par l’application avec des observations transcrites séparément des coefficients. Il ne demande ni réseau, ni Firestore, ni Gemini.

Commandes reproductibles, depuis la racine :

~~~sh
node scripts/check-hop-science.mjs
npx vitest run tests/unit/hopScientificBenchmark.test.ts
~~~

Le premier programme écrit un rapport JSON sur stdout et termine en erreur si une reproduction ou une vérification qualitative échoue. Il contrôle aussi que son graphe de dépendances ne contient aucun service distant. Les résultats détaillent chaque observation, son domaine d’entraînement et les inconnues. Pour conserver un résultat daté, rediriger stdout vers un fichier de travail hors du bundle public.

## Sources et séparation des données

Les fixtures de tests/fixtures/hopScientific/ ont été vérifiées contre les sources primaires le **9 septembre 2026**. Elles ne sont pas générées à partir des packs de coefficients.

| Jeu | Mesures disponibles | Limite de la comparaison |
|---|---|---|
| [Lafontaine et Shellhammer 2018, tableau 3](https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517) | Cinq doses, agrumes et herbacé sur 0–15 ; lettres des groupes Tukey | Un lot, panel répété ; les kegs appariés sont mélangés avant les analyses. |
| [Lafontaine et al. 2018, S6 et S12](https://brewingscience.de/index.php/brewingscience/article/download/277/186/489) | 29 lots Cascade 2015 : géraniol en mg/100 g et moyenne agrumes sur 0–15 | Même récolte et procédé. Une ligne par lot, pas une ligne par répétition analytique. |
| [Cui et al. 2015, tableaux 1–4 et validation](https://onlinelibrary.wiley.com/doi/full/10.1002/jib.189) | 29 expériences DM303, 25 conditions ; 4VG et 4VP en mg/L | Cinq expériences au centre. La condition réservée ne publie qu’une moyenne de trois répétitions par composé. |
| [Samia et al. 2024, compte rendu EBC](https://brewingscience.de/index.php/brewingscience/article/download/241/150/416) | Comparaisons qualitatives Cascade × cinq souches à 15, 22 et 30 °C | CATA, sans tableau d’intensités sensorielles par souche. |

Les paramètres de Student viennent de la [table NIST](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm), colonne 0,975. Sa date de publication n’est pas indiquée : elle reste inconnue dans la fixture. Les degrés de liberté changent avec chaque effectif d’entraînement.

## Ce qui est mesuré

- **Reproduction** : retrouver les données ou statistiques ayant servi à construire le modèle. Une erreur nulle ici ne démontre aucune performance sur une nouvelle bière.
- **Validation interne** : exclure une observation avant tout ajustement, y compris avant la détermination du support et de la marge.
- **Condition publiée réservée** : une condition supplémentaire de la même étude, absente de l’ajustement. Ce n’est pas une validation sur une étude indépendante.
- **Cohérence qualitative** : ne pas tirer une conclusion que les observations contredisent, sans inventer les intensités manquantes.

Aucune étude externe indépendante n’est évaluée dans ce benchmark. Cette limite apparaît dans le JSON.

Les erreurs absolues moyennes (MAE), erreurs quadratiques moyennes (RMSE), largeurs et couvertures restent séparées par étude, axe et unité. Les inconnues sont comptées. Une plage couvrant toute l’échelle peut contenir l’observation, mais ne reçoit **aucun crédit de précision** : pas de MAE fondée sur son centre arbitraire, et aucune couverture informative.

Pour la régression des lots, l’erreur centrale porte sur la moyenne OLS conditionnée par le géraniol publié. Les bornes sont celles du vrai moteur. L’incertitude analytique individuelle du géraniol est indisponible ; les covariables fixes du benchmark ne sont pas des COA prétendument exacts.

## Résultats de référence du 9 septembre 2026

| Évaluation | MAE | RMSE | Largeur moyenne | Couverture et inconnues |
|---|---:|---:|---:|---|
| Agrumes, cinq doses, reproduction 0–15 | Arrondi numérique seulement | Arrondi numérique seulement | 1,782 | 5/5 ; aucune validation indépendante |
| Herbacé, cinq doses, reproduction 0–15 | Arrondi numérique seulement | Arrondi numérique seulement | 0,878 | 5/5 ; aucune validation indépendante |
| Agrumes, trois doses intérieures réservées, 0–15 | 0,644 | 0,668 | 2,688 | 3/3 ; même lot et panel |
| Herbacé, trois doses intérieures réservées, 0–15 | 0,226 | 0,272 | 1,334 | 3/3 ; même lot et panel |
| Agrumes, lots réservés, 0–15 | 0,444 | 0,556 | 2,763 | 26/27 quantifiables ; 2 inconnus sur 29 |
| 4VG, DM303, essai réservé à tour de rôle, mg/L | 0,0847 | 0,1004 | 0,483 | 28/29 |
| 4VP, DM303, essai réservé à tour de rôle, mg/L | 0,0805 | 0,0986 | 0,478 | 26/29 |

La constante calculée uniquement sur l’entraînement donne une MAE de **0,581** pour les mêmes 27 lots quantifiables, contre **0,444** pour la régression. Sur les 29 covariables, le diagnostic OLS donne 0,415 contre 0,616 pour la constante ; ces deux chiffres incluent deux extrapolations hors support et **ne décrivent pas les sorties autorisées par le moteur**.

À chaque pli externe des lots, les 28 observations restantes servent seules à calculer les coefficients, leur variation interne, les résidus, l’enveloppe observée et le support. Les deux lots extrêmes CAS_12_15 et CAS_17_15 sortent de ce support recalculé et restent inconnus. La couverture informative sur l’ensemble est donc **26/29**, pas 26/27 sans réserve.

Pour DM303, les constantes des plis donnent respectivement 0,1578 et 0,1618 mg/L de MAE. La régression améliore ces erreurs internes, mais la couverture observée de 4VP est **26/29** : il n’est pas permis de présenter le 95 % nominal comme une couverture générale démontrée. Les plis recalculent la variance et utilisent 13 degrés de liberté. Retirer ensemble les cinq essais au centre rend le modèle quadratique non identifiable ; le benchmark montre cet échec.

La condition DM303 réservée donne :

| Composé | Moyenne publiée | Moyenne prédite | Erreur absolue |
|---|---:|---:|---:|
| 4VG | 2,418 mg/L | 2,429768 mg/L | 0,011768 mg/L |
| 4VP | 1,402 mg/L | 1,435993 mg/L | 0,033993 mg/L |

Il s’agit d’une moyenne disponible par composé, issue de trois répétitions sans valeurs individuelles accessibles. Les bornes du moteur concernent une future observation : placer cette moyenne à l’intérieur ne valide pas leur couverture. Les valeurs réservées ne participent ni à la régression ni au calcul de sa variance.

## Smoke scientifique « Test houb »

La fixture conserve les ingrédients saisis sans leur inventer d’identifiants. Le résolveur retrouve Cascade et LalBrew Diamond. Le calcul retrouve deux ajouts : 1,2 g/L à dix minutes de la fin d’ébullition et 3 g/L au whirlpool, à 80 °C pendant vingt minutes.

Le rapprochement avec Samia garde les écarts visibles :

- L’essai ajoute le premier houblon **au début** de l’ébullition ; la recette le met à dix minutes de la fin.
- La recette fermente à 19 °C ; les conditions publiées sont 15, 22 et 30 °C.
- Deux paliers portent un nom de houblonnage à cru, mais aucun ajout réel n’est à cru. Le moteur ne crée pas de houblon à partir du texte d’un palier.
- Le résultat qualitatif Diamond associe davantage de thiols à moins de fruité-tropical perçu. Il ne devient ni une promesse tropicale ni une concentration finale calculée.

Ce contrôle ne valide pas quantitativement l’extrapolation d’un assemblage. La validation des événements, du cumul, des invariances et de la fidélité des graphes complète ce benchmark dans les tests du moteur de recette et du navigateur.

## Conservation et import des prédictions

Le test d’intégration hopRecipeSnapshot vérifie un aller-retour complet par parseBackup sur la recette « Test houb » et sur un programme de vingt ajouts utilisant les dix COA publics partiels du dépôt. Les lots et leur provenance sont conservés sans complétion artificielle. Le document reste sous la limite d’import de 700 000 caractères et sous 1 000 000 octets, puis son calcul est rejoué à partir de ses seules preuves figées. Ces limites sont contrôlées séparément, car les caractères accentués occupent plusieurs octets.

Les altérations de dose, température ayant un effet sur les avertissements, résultat central, unité, couverture, contexte, provenance ou structure sont rejetées avant import. Trois cas isolent le repli vers les températures fabricant : plages identiques, plages divergentes et borne qualifiée. Seule une plage cohérente non qualifiée produit une comparaison numérique ; les autres restent explicitement ambiguës.

Première livraison du 9 septembre 2026 : **2 400 tests réussis dans 134 fichiers**, build de l’application et compilation Cloud Functions réussis. Cette suite logicielle complète le benchmark ; elle ne remplace pas une validation scientifique externe ni le contrôle visuel dans le navigateur.

## Seconde passe : comparer avant de resserrer

`node scripts/check-hop-science.mjs` produit également `secondPass`, depuis `tests/scientific/hopSecondPass.ts`. Le benchmark demeure hors réseau et hors Gemini. Les fixtures scientifiques précédentes ne changent pas.

Trois méthodes de bornage de la régression des 29 lots ont été comparées avec exactement les mêmes plis externes, supports et résidus internes :

| Méthode | MAE sur 27 lots | Largeur /15 | Couverts | Inconnus /29 | Décision |
| --- | ---: | ---: | ---: | ---: | --- |
| Rectangles actuels de coefficients | 0,4441 | 2,7631 | 26/27 | 2 | Maintenue |
| Couples pente/interception conservés | 0,4441 | 2,3785 | 25/27 | 2 | Non retenue |
| Ajustement central et même marge résiduelle | 0,4441 | 2,2535 | 25/27 | 2 | Non retenue |

Les variantes resserrent les bandes de 14 % et 18 %, mais perdent CAS_20_15, en plus de CAS_24_15 déjà non couvert. Elles n’améliorent pas l’erreur centrale. Ce compromis n’est donc pas présenté comme une amélioration générale et aucun de ces changements n’entre dans les coefficients de production.

Une autre piste liait la marge documentaire au signal latent effectivement réalisé plutôt qu’à son maximum possible. Sa formule d’extrêmes était mathématiquement correcte, mais modifiait la signification de la marge existante sans validation. Elle n’a pas été retenue non plus.

### Amélioration conservée

La correction v2 de dose inconnue est détaillée dans `hop-recipe-prediction.md`. Elle utilise les contacts et descripteurs déjà bornés. Sur douze scénarios logiciels, tous les cas entièrement renseignés restent identiques ; aucune inconnue n’est supprimée artificiellement et aucun centre ou niveau de confiance n’est créé. Les quarante complétions testées de doses manquantes, de zéro à un million de g/L pour éprouver la borne limite, restent incluses. Le million n’est évidemment pas une suggestion de brassage.

Exemple **Cascade × US-05 × ébullition de 60 minutes, à 100 °C, dose inconnue** : agrumes `0–100 → 0–59,288` ; largeur moyenne sur les douze axes `100 → 65,451 %` de l’échelle. La confiance reste faible et aucun centre n’est affiché. Un contact à cru de 1 h gagne très peu ; à 72 h, ou avec dose et contact inconnus, les bandes peuvent rester complètes. Ces résultats mesurent une meilleure utilisation des contraintes du modèle, pas une amélioration d’erreur gustative observée.

La recette « Test houb » garde ses résultats et ses alertes : Diamond à 19 °C hors de sa fenêtre fabricant chargée, et palier d’ajout sans houblon à cru. Le modèle ne transforme pas le résultat qualitatif Samia en intensités.

### Trois consignes de brasseur

Les mêmes quatre doses documentées (2, 3,86, 8 et 16 g/L) sont classées sans modifier les profils en fonction de la cible. Les consignes sont des entrées de test, pas des coefficients scientifiques :

| Consigne, indice local 0–100 | Première dose classée | Interprétation |
| --- | ---: | --- |
| Agrumes 60–100 | 8 g/L | Plages d’adéquation recouvrant celles de 16 et 3,86 g/L : aucun gagnant certain. |
| Agrumes 40–60, herbacé 0–40 | 3,86 g/L | Compromis entre expression agrumes et limite herbacée ; plusieurs scores se recouvrent. |
| Herbacé 60–80 | 16 g/L | Cette forte dose convient à cet objectif particulier, pas à toutes les recettes. |

Ce classement reste une convention de distance à l’objectif dans le protocole publié. Le score n’est ni une probabilité de réussite ni une mesure d’intensité. Les tests garantissent qu’un changement d’objectif ne change jamais les arômes calculés.

Contrôle de cette seconde passe : **2 410 tests réussis dans 135 fichiers**, benchmark sans échec, build de production et compilation Functions réussis. Une comparaison supplémentaire a compilé le moteur de recette du commit `05a9f0c458ad7afaa5f9eca79b355a90c0913440` : ses douze résultats complets sont identiques à la branche de rejeu v1 actuelle, explications et unités comprises. Le contrat d’import vérifie séparément l’archive v1 et refuse son réétiquetage v2.

## Discipline de correction

Une régression de transcription, d’unité, de domaine ou de calcul bloque la livraison. Un résultat scientifique peu convaincant reste visible : il ne justifie pas un ajustement uniquement sur le cas réservé, une marge agrandie jusqu’à faire disparaître l’échec, ou un changement de dénominateur masquant les inconnues.

Toute amélioration doit comparer avant/après les mêmes cas, unités et critères, puis rejouer les autres études. Une nouvelle collecte externe demeure nécessaire avant de relever la confiance de transfert vers d’autres souches, formes, recettes ou procédés.
