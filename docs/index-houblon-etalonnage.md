# Étalonnage exploratoire Cascade 2015

Le pack installable dans **Stocks → Houblons → Sources et modèles** utilise
des observations publiées, distinctes des fixtures des tests. Il fournit une
première projection quantitative limitée à un protocole, avec confiance faible.
Il ne constitue pas une validation du moteur pour toutes les bières.

## Données et domaine

Source primaire : Lafontaine, Pereira, Vollmer et Shellhammer (2018),
[article et annexes de l’éditeur](https://brewingscience.de/index.php/brewingscience/article/download/277/186/489),
[DOI](https://doi.org/10.23763/BrSc18-19lafontaine).
Les 29 identifiants de Cascade 2015 apparient le géraniol du tableau S12 à
l’intensité moyenne Citrus du tableau S6. Les pages ont été contrôlées visuellement.
Le protocole associe Wyeast 1728, bière clarifiée après fermentation, cônes
broyés, dose de 3,86 g/L, contact de 24 h à 13,3–15 °C. La recette de base et
ses limites sont conservées dans les données.

Les concentrations sont en **mg/100 g de houblon**, jamais en pourcentage
d’huile. Les résultats utilisent l’échelle du panel **0–15**, distincte des
axes personnels 0–100. La plage variétale installée représente uniquement les
lots étudiés en 2015. Un nouveau lot comparable reste une extrapolation dans
le temps, expressément signalée et à vérifier par dégustation.

## Méthode locale, reproductible

Le script `node scripts/build-hop-study.mjs` ajuste une régression simple
`Citrus = intercept + pente × géraniol` aux données transcrites. Il ne tourne
pas dans le moteur et ne contacte aucun service. Les paramètres produits sont
des documents JSON importables dans Firestore, modifiables sans redéploiement.

L’ajustement complet donne une pente d’environ 0,54777 et un intercept de
4,15319. Son R² de 0,49970 retrouve l’arrondi 0,50 publié. Ce rapprochement
contrôle la transcription ; **ce n’est pas une validation externe**. Il ne
faut pas confondre cet ajustement simple avec le modèle à deux prédicteurs du
tableau 3.

La construction des marges est un **jugement méthodologique de L’Affinée,
2026**, identifié ainsi dans chaque paramètre :

- Ajuster également 29 modèles, en retirant à chaque fois une observation.
- Conserver les extrema des pentes et intercepts de ces modèles et du modèle
  complet ; ils expriment une sensibilité aux observations, pas un intervalle
  de confiance statistique.
- Conserver les extrema des erreurs sur les observations retirées, environ
  −0,94812 à +1,31626. Ce résidu couvre ces erreurs constatées, sans garantie
  de couverture pour un prochain lot ou un autre panel.
- Propager ces plages par arithmétique d’intervalles. L’association des extrema
  ignore leur covariance et peut élargir le résultat ; elle ne les remplace
  pas par un chiffre central.

La recherche affiche une **plage d’adéquation** et la confiance faible. Les
coupures 5 et 10 de cette échelle, ainsi que son poids égal à un, sont des
conventions locales sourcées. Elles ne sont pas attribuées aux chercheurs.

## Conditions d’utilisation

Un lot accompagné d’un intervalle analytique de géraniol compatible peut
réduire la part d’incertitude venant de l’entrée. Le résidu du modèle subsiste.
Un COA qui donne seulement l’alpha n’améliore pas cette prédiction. Une valeur
ponctuelle sans marge ne reçoit pas de marge inventée. Si une donnée manque,
l’enveloppe expérimentale est élargie au domaine du modèle pour éviter qu’une
absence de mesure rende artificiellement le résultat plus précis.

Un autre produit, une autre levure, un autre timing, une dose ou une durée hors
domaine donnent un résultat non quantifiable. Il faut documenter un nouveau
modèle pour une fermentation active, une bière trouble ou des pellets.
Le modèle ne calcule aucun rendement enzymatique et ne prédit pas le 4MMP.

Les données de 2014 ne sont pas utilisées : l’appairage direct de nos
transcriptions S6/S11 ne reproduit pas la relation de la figure 1. Il faut
résoudre cet appairage avant tout étalonnage ; aucune correspondance n’a été
devinée pour obtenir le résultat attendu.

## Fichiers et contrôles

- `src/data/hopStudies/lafontaine2018.cascade2015.json` : transcription,
  protocole et choix de méthode.
- `src/data/hopStudyBootstrap.json` : documents installables.
- `node scripts/build-hop-study.mjs --check` : vérification reproductible du pack.
- `python scripts/check-hop-study-math.py` (NumPy) : contrôle indépendant
  par moindres carrés SVD et erreurs PRESS `résidu / (1 − levier)`.
  Résultats : pente 0,5477653305077743 ; intercept 4,153189434916725 ;
  R² 0,4996952265544812 ; résidu retiré −0,948121979678181 à
  +1,3162613735900075. Les écarts aux calculs JavaScript restent à la
  précision numérique près ; aucun intervalle à 95 % n’est revendiqué.
- `tests/integration/hopStudy.test.ts` : domaine, provenance, marges,
  point sans incertitude, catalogue complet et séparation des échelles.
  `hopIndexStorage.test.ts` et `hopPredictionWorkflow.test.ts` contrôlent
  les imports, le rejeu idempotent et les instantanés immuables.

Une prédiction conservée copie les documents utilisés. Réviser le modèle ou
un COA ne modifie donc pas les anciennes comparaisons avec les dégustations.
