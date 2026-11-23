# Recherche et intégration de la fermentation

Synthèse accessible dans l’application après connexion, depuis « Lire la synthèse de recherche sur la fermentation ». Le document est fourni par `getFermentationResearch` après vérification serveur du compte autorisé ; il n’est ni publié dans Hosting ni inclus dans le JavaScript du navigateur. Recherche arrêtée le 8 septembre 2026 après vérification des principales contradictions et des limites de transfert.

Le pack ajoute 9 conduites aux 4 Weissbier existantes, 21 leviers qualitatifs, 12 composés/familles, 7 repères fabricant et un jeu de 29 essais. Les références des autres cultures du catalogue restent disponibles sans leur attribuer une conduite non documentée.

## Données et mises à jour

- Sources et faits : `scripts/fermentation-science/`.
- Génération reproductible : `node scripts/build-fermentation-science.mjs`.
- Données en production : `hopKnowledge`, type `fermentationScience` et guides `fermentation`. Une révision Firestore, désactivée ou invalide comprise, prévaut sur le socle fourni.
- Modification sans redéploiement : Index → Sources et modèles → rechercher « Fermentation » → Modifier. Changer la version ; garder les sources et les dates inconnues explicites.
- Vérifier un import : `node scripts/import-fermentation-science.mjs --project=brasserie-l-affinee`.
- Appliquer : ajouter `--apply`. Sauvegarde, préconditions et relecture sont intégrées. Aucun effacement, aucune modification des identités/catalogues existants.
- Mettre à jour un guide déjà importé : fournir `--previous=<ancien-pack-revu.json>`. L’ancien document doit être identique à cette référence et la nouvelle version différente. Toute divergence est conservée et signalée avant écriture.

Reconsulter les fiches fabricant lorsqu’elles changent, puis le DOI et ses suppléments pour une nouvelle étude. La date du chemin PDF n’est pas une année bibliographique. Les points fabricant sans dispersion restent des points documentaires ; aucun intervalle statistique n’est fabriqué.

## Mathématiques retenues

DF documentaire : `1 + (DI − 1) × (1 − atténuation/100)`, appliquée aux deux bornes dans le bon ordre. Cette approximation sur les points SG ne mesure pas la fermentescibilité et ne remplace pas le modèle complet du moût, notamment avec des sucres non fermentescibles ou tardifs.

Progression vers la DF : `(DI − densité actuelle)/(DI − DF attendue)`. Le seuil 65–75 % et la hausse 2–4 °C proviennent de Lallemand 2023, sont dans le pack et ne sont pas des constantes biologiques du code. Les bornes de DF sont propagées. Une progression supérieure à 100 % reste visible.

DM303 : ajustement quadratique complet, 15 paramètres, 29 observations, 14 degrés de liberté. Les coefficients sont reconstruits depuis les observations Firestore. La matrice codée a un conditionnement d’environ 4,62 ; résolution pivotée, pas de coefficients aromatiques en dur. Une matrice singulière rend le calcul indisponible sans bloquer l’aide.

`PI = xβ ± t × sqrt(MSE × (1 + x (XᵀX)⁻¹ xᵀ))`.

Le `1 +` conserve la variabilité d’une nouvelle observation ; il ne s’agit pas d’un intervalle de la moyenne. Le quantile 2,145 pour 14 degrés de liberté et une couverture nominale individuelle de 95 % est fourni avec sa référence NIST. Les deux sorties ne sont pas un intervalle conjoint. Modèle complet fixé, sans sélection opportuniste de variables.

Vérification indépendante avec NumPy :
- MSE 4VG : 0,005684716666667 ; R² : 0,915273890716345.
- MSE 4VP : 0,005571541666667 ; R² : 0,919392418014215.
- Au centre : PI 4VG 2,155437–2,509763 mg/L ; PI 4VP 1,155610–1,506390 mg/L.
- Les statistiques retrouvent celles publiées après arrondi. La validation de l’article est une moyenne de trois répétitions, pas un nouveau brassin individuel mesuré par l’application.

Restrictions : DM303, moût/pitch et protocole confirmés ; mash-in discret couplé à sa durée ; facteurs dans le domaine et `Σ|zᵢ| ≤ 2`, enveloppe convexe du plan Box–Behnken à quatre facteurs. Aucun transfert implicite à WLP300/3068, ni extrapolation aux coins non étudiés, ni conversion mg/L → intensité girofle. Les hypothèses résiduelles limitent la couverture réelle.

## Choix de conduite

Les sous-plages thermiques, consignes centrales et jours des nouveaux guides sont des **jugements L’Affinée 2026**, dans les fenêtres fabricant. Ils sont modifiables et annoncés avec une confiance faible. Une consigne centrale sert à piloter un équipement ; elle n’est pas une prédiction aromatique ponctuelle.

Le calendrier sert à préparer les opérations. Densité, stabilité après le dernier ajout et contrôle VDK décident de la suite. Les mécanismes ATF1, POF, STA1 et thiols restent distincts. Les interactions non quantifiées ne deviennent pas des multiplicateurs dans le moteur houblon existant.

## Compagnon et validation

`lookup_yeast_reference` recherche tout le catalogue ; `fermentation_advice` expose les guides, leviers, sources et calculs partiels. Chargement à la demande plafonné explicitement à 5 000 connaissances. L’aperçu de prompt contient 20 identités ; les outils disposent des fiches complètes. Les propositions ne conservent que les identités de levure nécessaires, sans dupliquer tous les catalogues dans Firestore.

Tests unitaires : validation, provenance, plages/repères, domaine convexe, erreurs de protocole, révisions et invariants d’import. Tests intégrés : recherche d’objectif, conduite, calcul local, lecture seule, compagnon simulé et taille du contexte. Aucun vrai appel Gemini dans ces tests.

## Limites restant ouvertes

- Aucun modèle universel validé d’esters, phénols, soufre ou thiols pour toutes les cultures.
- Pas de calibration sensorielle de L’Affinée ; les marges expertes existantes ne sont pas des couvertures statistiques validées.
- Modèles industriels d’esters écartés pour incohérences et contexte trop étroit.
- Plusieurs articles récents accessibles seulement en résumé ; aucun coefficient extrait de leurs figures.
- Fiabilité de source, applicabilité au procédé et absence de donnée sont distinguées verbalement ; aucune pondération numérique arbitraire de fiabilité n’est ajoutée.

La prochaine amélioration quantitative demande des essais comparables avec souche, lots, moût, cellules viables, températures réelles, densités, pression référencée et dégustations conservés. Un modèle validé devra être évalué sur des brassins indépendants, en séparant entraînement, choix du modèle et évaluation de ses intervalles.
