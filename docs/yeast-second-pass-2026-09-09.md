# Levures — seconde passe du 9 septembre 2026

La correction porte sur la souche réellement saisie, les données applicables et la fidélité de l’affichage. L’écran et l’outil `fermentation_advice` du compagnon utilisent le même évaluateur. Elle ne change pas les coefficients du modèle de houblonnage.

## Changements livrés

- Un nom fabricant reconnu sert à analyser la recette sans écrire son association en base. Une identité ambiguë ou un identifiant explicite absent reste inconnu. L’objectif par défaut suit la souche, avec priorité à une conduite équilibrée ou neutre lorsqu’elle existe.
- Sans guide de fermentation, les plages concordantes du catalogue restent utilisables. Les valeurs qualifiées, conditionnelles ou contradictoires ne sont pas fusionnées. Sur « Test houb », Diamond retrouve sa fenêtre 10–15 °C et son atténuation 77–83 %. Pour une DI de 1,046, la projection de DF vaut 1,00782–1,01058 SG. Le calendrier à 19 °C et les paliers à cru sans ajout sont signalés. Ce contrôle ne crée aucun ajout.
- Rattacher explicitement un nom reconnu à la même levure conserve la quantité déjà saisie. Une autre référence explicite ne conserve pas les caractéristiques de l’ancienne souche.
- Les bornes affichées sont arrondies vers l’extérieur : la DF précédente apparaît 1,007–1,011 SG. Le laboratoire conserve également les bornes négatives éventuelles, au lieu de les masquer sur le graphique.
- Les densités actuelles nulles ou négatives ne produisent plus une progression de fermentation. La DI documentaire suit celle de la recette jusqu’à une modification explicite dans le calculateur ; un bouton permet de reprendre la DI de la recette.
- Une température inconnue laisse un trou dans le calendrier. Une durée inconnue empêche de positionner les paliers suivants, mais conserve les consignes antérieures. Ni température zéro ni durée zéro ne sont inventées.
- Deux parcours partagent les données : « Analyser ma levure » et « Choisir pour un arôme ». Comparaison des souches, réglages, mécanismes et sources sont repliés. La consultation reste en lecture seule ; la variante possède son propre état local et ne persiste même pas les références du guide.
- Quitter une préparation en attente empêche un ancien résultat de rappeler la recette ; un changement de recette ou de guide pendant la persistance reste détecté.

Les tableaux de référence restent dans les connaissances existantes et gardent leurs sources et versions. Aucune nouvelle collection, aucun coefficient biologique ajouté au code, aucun import massif dans cette passe. La version `yeast-scenario-1` identifie le nouvel évaluateur documentaire ; les conduites conservées sont toujours relues séparément des références actuelles.

## Contrôle scientifique

Les conditions et les 29 réponses de DM303 proviennent de la fixture transcrite indépendamment du pack, `tests/fixtures/hopScientific/cui-dm303-2015.json`. Quatre régressions sont comparées par exclusion successive d’un essai. Une seconde implémentation algébrique retrouve le modèle du moteur à une tolérance numérique de 10⁻¹⁰. Les candidats exploratoires ne sont pas utilisés comme coefficients de production.

| Formulation | Paramètres | MAE 4VG, mg/L | MAE 4VP, mg/L | RMSE 4VG, mg/L | RMSE 4VP, mg/L |
|---|---:|---:|---:|---:|---:|
| Constante | 1 | 0,15784 | 0,16182 | 0,18640 | 0,18919 |
| Linéaire | 5 | 0,10088 | 0,10430 | 0,12674 | 0,12917 |
| Quadratique sans interactions | 9 | 0,06968 | 0,07581 | 0,09208 | 0,09690 |
| Quadratique complet publié | 15 | 0,08475 | 0,08051 | 0,10041 | 0,09863 |

La sélection est ensuite répétée **à l’intérieur** de chaque ensemble d’apprentissage : l’essai extérieur ne participe ni au choix du modèle ni à son ajustement. La version sans interactions est choisie dans 28 plis sur 29. Cette sélection donne des MAE de 0,07219 / 0,07714 mg/L, mais des RMSE de 0,09708 / 0,09885 mg/L : le RMSE du 4VP augmente légèrement face au modèle complet. L’incertitude de sélection n’a pas été calibrée. Le modèle publié reste donc la référence ; les résultats ne justifient pas de rétrécir ses intervalles.

Le contrôle conserve aussi reproduction, largeurs d’intervalles, couvertures et indéterminations du modèle effectivement utilisé. La condition de validation publiée reste réservée : 4VG prédit 2,42977 contre 2,418 mg/L rapporté ; 4VP prédit 1,43599 contre 1,402 mg/L. Ces moyennes ne sont pas trois observations indépendantes. L’exclusion de toutes les répétitions centrales rend le modèle complet non identifiable. Aucune validation externe sur une autre étude n’est revendiquée.

Sources reconsultées : [Cui et al., 2015](https://onlinelibrary.wiley.com/doi/full/10.1002/jib.189), [Wyeast 3068](https://wyeastlab.com/product/weihenstephan-weizen/), [Lallemand, contrôle des arômes, 2025](https://www.lallemandbrewing.com/en/global/resources/whats-new/precision-flavor-through-fermentation-control/), [fiche Diamond 2022](https://connect.lallemandbrewing.com/wp-content/uploads/2017/03/TDS_LPS_BREWINGYEAST_DIAMOND_ENG_A4.pdf), [Omega Bananza](https://omegayeast.com/products/bananza-next).

Les consignes propres à Munich Classic, Wyeast 3068 et Bananza restent distinctes. Une hausse de température, une réduction d’ensemencement ou un caractère POF ne deviennent pas un multiplicateur universel d’arôme. Les périodes indicatives n’autorisent pas automatiquement refroidissement ou conditionnement.

## Présentation et vérification

Palette existante conservée : fond cave #12100E, surface #1A1613, texte #D8CEC5, secondaire #9A8A7E, consignes dorées #F2C14E, informations bleues #5B8AA6. Typographie et composants restent ceux de l’application. Le choix de souche remplace la liste ouverte ; le calendrier est visible avant les explications longues.

```text
Levure & fermentation
[Analyser ma levure] [Choisir pour un arôme]
Souche / objectif
Fenêtre documentée · repères de densité ou durée
Calendrier des consignes, avec trous si inconnu
▸ Réglages  ▸ Arômes et chimie  ▸ Sources
Action explicite / variante locale
```

Le banc compile la vraie application avec les adaptateurs QA existants. Le plugin Browser est absent ; Puppeteer du dépôt contrôle Chromium. Les artefacts restent dans TEMP, séparés du build livré. Les nouvelles commandes `test:science:yeast` et `test:smoke:yeast` sont incluses dans la frontière des tests sans Gemini payant.

Parcours vérifiés à 320, 390 et 1280 px : création, six objectifs, modification/effacement des consignes, leviers avec confiance moyenne, chimie repliable, point DM303 réservé, écriture refusée puis reprise, sauvegarde/rechargement, lecture seule, variante abandonnée et recette Diamond. Les ordonnées et abscisses sont comparées aux valeurs numériques ; les barres de phénols aux bornes brutes. La tolérance des pourcentages CSS tient compte de la sérialisation à six chiffres significatifs du navigateur.

Après chargement des références : zéro requête, zéro écriture et zéro appel de fonction pour les changements d’objectif et les variantes. Les contrôles enregistrent aussi erreurs de console, débordements et performances, sans accès de test en production. Le benchmark et le smoke test des houblons sont rejoués pour vérifier la partie partagée.

Résultats numériques et mesures finales : `docs/qa/yeast-second-pass-2026-09-09.json`. La suite complète réussit 2 423 tests dans 136 fichiers. La mise à jour saisie → graphique mesure 26–37 ms ; l’évaluation de vingt paliers reste sous 3 ms sur cette machine de contrôle. Aucun résultat de performance universel n’en est déduit. Les graphiques restent des consignes ou des intervalles du procédé DM303, jamais des concentrations universelles de banane, phénols ou thiols.
