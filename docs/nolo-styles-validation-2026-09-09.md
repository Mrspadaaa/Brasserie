# Styles étendus et NOLO — validation du 9 septembre 2026

La recette porte un objectif NOLO indépendant de son style. Le premier parcours est un moût neuf avec une souche à fermentation limitée. Les autres voies restent comparables et enregistrables ; aucune ne garantit automatiquement ≤ 0,5 % vol.

## Données livrées

- 293 fiches de référentiel, et non 293 styles uniques : 123 BJCP 2021, 1 complément provisoire, 168 BA 2026, 1 tradition Keptinis. Plusieurs éditions peuvent décrire un même style. Les noms ambigus demandent un choix explicite.
- 8 procédés comparés et 4 souches NOLO documentées : LA-01, LoNa, WLP618 et Zero Hero. Les 1 733 fiches du catalogue de levures existant restent disponibles.
- Paramètres et sources dans les documents typés de la collection existante `hopKnowledge`. Les recettes conservent leur référence de style et les paramètres NOLO utilisés.
- Import réel : 5 créations, 5 relectures conformes, 4 identités de levure existantes préservées, aucun conflit. Le second calcul du plan d’import propose zéro écriture.
- Aucun changement de collection ou de règle Firestore ; backup et restauration comprennent les nouveaux types.

## Calcul et conflits corrigés

Le moteur `nolo-mass-balance-v1`, associé à la configuration version 1, sépare alcool présent, potentiel des sucres et analyse au conditionnement. Il couvre resucrage, fruits explicitement liés, supports aromatiques, assemblages, dilution et retrait d’alcool dans l’ordre enregistré. Une analyse remplace uniquement les étapes qu’elle inclut ; les sucres résiduels nécessitent leurs propres mesures.

Les sucres partiels restent partiels, un zéro mesuré reste un zéro, et les arrondis ne rétrécissent pas les plages. Une ancienne analyse devient inapplicable si le moût, la souche ou une opération déjà analysée change. Désactiver le mode conserve les mesures.

L’atténuation n’est plus forcée à 45 %. Le NOLO ne réutilise ni l’alcool OG/FG conventionnel, ni des concentrations finales ou coefficients sensoriels issus d’une matrice alcoolisée. Le programme houblonné version 4 conserve la relecture des versions 1, 2 et 3.

Le compagnon emploie le même bilan, conserve le NOLO dans son contexte et tient compte du resucrage du brassin. Il ne peut pas appliquer une cible scalaire contradictoire, une DF générique ou une correction de malt neuf aux drêches. Les 293 fiches sont résumées dans son aperçu, sans recopier le catalogue entier dans chaque prompt. Les tests utilisent uniquement des appels simulés.

La seconde extraction utilise le volume et la densité récupérés. Ni deuxième absorption de grain sec, ni rendement ou tampon de malt neuf ne sont appliqués. Le lit de drêches ne débite pas une deuxième fois le stock de malt. Une quantité nulle de levure ne débite plus un sachet fictif.

## Benchmarks scientifiques

| Cas | Résultat | Portée |
| --- | --- | --- |
| LA-01, quatre points publiés | Erreur moyenne et RMSE de reproduction : 0 % vol. | Reproduction de la relation fabricant, pas validation externe. Aucune marge statistique publiée. |
| Drêches 2024, cinq observations | 5 sorties prédictives indéterminées | Sucres et protocoles insuffisants pour fermer un bilan externe. Les résultats avant resucrage et la contradiction YAN sont conservés. |
| Contact à froid 2022, deux conditions | 2 sorties prédictives indéterminées | Souches et durées distinctes ; aucun transfert à toutes les Torulaspora. |
| Comparaison Lager/Weizen 2026 | Conclusions qualitatives seulement | Aucun chiffre extrait de tableaux non accessibles. |
| Conservation 2026 | Alertes vérifiées | Ni pH seul, ni froid, ni CO₂, ni valeur universelle de pasteurisation ne délivrent une certification. |

Les benchmarks houblon et levure existants passent également. Un résultat indéterminé ou une plage élargie n’est pas comptabilisé comme gain de précision.

## Contrôles exécutés

- `npm test` : **139 fichiers, 2 466 tests réussis**.
- `npm run test:science`, `test:science:yeast`, `test:science:nolo` : aucune anomalie du benchmark.
- `npm run test:smoke:nolo`, `test:smoke:hop`, `test:smoke:yeast` : composants réels compilés dans un banc isolé, adaptateurs de données de test, navigateur Chrome local.
- Création, choix de souche, changement de procédé, sucres et mesures partiels, quatre combinaisons des cases, COA partiel, sauvegarde, rechargement, consultation et variante locale. Le parcours houblon couvre annulation, navigation, réponse périmée et échec de persistance avec reprise idempotente.
- À **320, 390 et 1280 px** : captures inspectées, détails repliés, clavier, débordements et console contrôlés. Les valeurs, unités, confiances et positions des graphes sont comparées aux sorties brutes ; les inconnues ne sont pas dessinées à zéro.
- Après chargement des références et du module technique : **0 requête et 0 écriture** pendant les simulations. Un premier chargement différé d’asset reste distinct du calcul.
- Vingt ajouts : calcul NOLO ≤ 0,3 ms dans la série locale ; changement de procédé rendu en 7,1–7,7 ms ; quatre combinaisons des cases en **10,6–44,3 ms**. Parcours houblon existant : 10,7–15,1 ms ; recherche rapide : environ 120–123 ms. Ces mesures décrivent la machine de contrôle, pas une garantie matérielle universelle.
- Build client et Functions réussi. Vérification des 22 collections, de la frontière des tests IA payants et de l’absence de marqueurs QA/auth de développement dans le bundle livré.
- Le dossier comparatif est un asset serveur lu après `requireBrewer`, disponible dans le panneau NOLO connecté. Aucun rapport privé dans `public`, `dist` ou les bundles du navigateur.

Les rapports JSON de contrôle sont conservés dans `docs/validation/`. Les captures et journaux détaillés sont produits dans le répertoire temporaire local par les scripts reproductibles. Le banc QA reste séparé du build distribué.

## Mise à jour des connaissances

Les faits, coefficients, conditions, unités et provenances se modifient dans les connaissances sans redéploiement. Incrémenter la version pour une révision ; conserver les sources anciennes et le snapshot des recettes.

Pour réviser un import : archiver les deux packs actuels, exécuter explicitement `scripts/collect-brewing-styles.mjs`, puis `scripts/build-nolo-reference.mjs`, inspecter les différences, vérifier les sources et incrémenter les versions. Le scrapeur est un outil de maintenance d’édition, pas une tâche automatique.

Après compilation des Functions, `scripts/import-fermentation-science.mjs --pack=nolo-styles --project=<projet>` calcule un plan sans écrire. L’option `--apply` applique les seuls documents validés avec préconditions et vérification de relecture. Pour mettre à jour des documents déjà importés, fournir `--previous=<ancien-pack-combiné.json>` ; toute divergence personnelle doit être conservée ou résolue explicitement, jamais écrasée.

## Limites restantes

Les bornes des sucres sont physiques, pas des rendements attendus ni des intervalles statistiques à 95 %. Elles supposent les volumes saisis et les capacités documentées de la souche ; la libération enzymatique ultérieure et la contamination restent des risques distincts. Les volumes d’assemblage sont additifs par approximation, à remplacer par des mesures.

La banane et le girofle restent des objectifs et caractères documentaires lorsque leur intensité en matrice NOLO n’est pas étalonnée. La proximité avec une hefeweisse alcoolisée et la conservation commerciale exigent des pilotes, des dégustations comparatives et des analyses réelles.

Le build signale encore des chunks volumineux du catalogue existant. La réactivité des simulations a été mesurée séparément ; ce contrôle ne revendique pas une optimisation générale du temps de chargement initial.
