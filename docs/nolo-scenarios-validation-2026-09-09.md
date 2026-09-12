# Simulations NOLO, eau et recettes compactes — validation

Le calcul distingue désormais la préparation conditionnelle, les bornes physiques et les analyses finales. Une opération incompatible avec le procédé est écartée et peut être récupérée. Une fin inconnue ne supprime plus la bière mère.

## Changements

- Couche NOLO `nolo-scenario-v2`, moteur historique v1 conservé ; relations LA-01 2022 et novembre 2025 séparées.
- Moteur aromatique de recette v5 : cumul et saturation v4 conservés, étapes avant/après traitement, hypothèses sensorielles explicites. Snapshots v1–v4 toujours rejouables ; v5 contrôlé par recalcul à l’import.
- Bilan ordonné : alcool présent, conversion possible, dilution, retrait et analyse après opération. Les fractions de composition inconnues partagent une même masse disponible.
- Une proposition d’eau pour minimum trouvé, Doser et recalcul de recette, avec contraintes de sels et doses conservées. Diagnostics séparés des ions, du pH et du rinçage.
- Sections indépendantes fermées par défaut ; volumes osmosée/réseau/total visibles ; détails chimiques et sels inutilisés repliés ; accès au compagnon unique.

Le dossier détaillé est servi par `getFermentationResearch` après contrôle du compte autorisé. Aucune porte de test ni rapport n’est incorporé au bundle de production.

Le dépôt Git distant étant public, le dossier personnel est également exclu de Git. Seul un exemple générique est versionné ; le build serveur le copie sur un nouvel environnement sans jamais remplacer un dossier personnel existant. Les recettes réelles passent au banc navigateur par un fichier privé fourni à l’exécution ; les fixtures versionnées sont synthétiques.

## Vérifications réalisées

- **2 482 tests locaux réussis**, sans appel Gemini. Une exécution simultanée aux builds avait dépassé les 30 secondes du fuzz de saisie ; la suite complète, relancée sans concurrence de build, passe avec les mêmes assertions et délais.
- Benchmark NOLO : quatre points LA-01 2025 reproduits, RMSE nulle ; ancien protocole 2022 maintenu. C’est une reproduction, sans validation externe ni intervalle statistique publié.
- Benchmark aromatique existant réussi ; aucune amélioration de précision externe revendiquée par le changement de domaine NOLO.
- Tests des huit procédés, arrêt SG/atténuation, alcool de support, sucre, retrait, dilution, invalidation d’analyse, bornes de composition communes et rejeu de snapshot.
- Eau à 100 %, 65 % avec deux sels, 65 % avec tous les sels : doses, ions, pH, export/relecture cohérents. Minimum au pas de 5 points : 65 % avec deux sels et 35 % avec tous les sels sur la fixture de référence. Une dose conservée incompatible produit un diagnostic, pas une fausse conformité.
- App réelle compilée avec adaptateurs QA isolés : création, saisie, simulation, quatre combinaisons des cases, COA partiel, sauvegarde/relecture, consultation et variante. Recherche rapide, annulation, navigation, réponse périmée et reprise idempotente après erreur de persistance contrôlées.
- Deux pilotes préparés exécutés à **320, 390 et 1280 px** ; contrôles des opérations, nombres affichés, géométrie des graphes, effacement d’hypothèse, clavier, sections multiples, litres d’osmosée et absence de débordement. Captures inspectées.
- Après chargement des références : **zéro requête distante, zéro écriture** pour les simulations. Vingt ajouts : mise à jour aromatique du banc principal **11,1–15,1 ms** ; bilan NOLO **1,1 ms maximum**, changement de procédé environ **8 ms** sur cette machine. Ces mesures locales ne sont pas une garantie sur tout appareil.
- Builds TypeScript/Vite et Functions réussis ; 22 collections couvertes par les règles ; rapports absents des assets publics ; accès anonyme et comptes non autorisés refusés par les tests serveur.

## Compatibilité avec la version actuellement installée

La livraison a été recomposée avec les fonctions financières et de suivi des stocks déjà présentes, dans un checkout de validation isolé. Les modifications plus récentes du compagnon restent séparées de cette publication.

- **3 046 tests réussis** sur cette version combinée, sans suite en échec. Une régression supplémentaire vérifie que les drêches ne provoquent ni une nouvelle pesée ni un nouvel achat du malt déjà utilisé ; les ajouts neufs restent comptés.
- Parcours NOLO complet et parcours houblons rejoués sur l’application combinée à **320, 390 et 1280 px**. Captures de la consultation compacte, des eaux et des projections inspectées ; aucun débordement ni erreur de console.
- Vingt ajouts : **10,7–14,5 ms** sur le dernier parcours, toujours sans requête distante ni écriture pendant la simulation.
- Build client final et build serveur réussis ; les **29 collections** de cette version sont couvertes par les règles.

Le code métier NOLO reste versionné sur sa branche. La copie de travail commune reçoit les fichiers fusionnés avec préconditions et sauvegarde, sans inclure les travaux financiers ou les nouvelles modifications du compagnon dans ce commit.

## Limites conservées

Les courbes d’arôme restent largement incertaines hors des protocoles documentés. Une fraction sensorielle saisie après traitement est un jugement de pilote, pas un rendement chimique. Une plage entière ne compte pas comme précision utile. La banane de restitution doit être réglée par dégustation de fractions.

Une projection proche de 0,4 % issue de la formule LA-01 ne dispose pas d’une marge expérimentale publiée. L’analyse d’alcool après les ajouts et le conditionnement, ainsi que la validation de conservation, restent des étapes distinctes. La correction des bicarbonates ne garantit pas la consigne de pH.

Les modifications en base utilisent des préconditions `updateTime` et `exists:false`, puis une relecture intégrale. L’historique serveur conserve les valeurs précédentes. La modification préexistante de `docs/yeast-second-pass-2026-09-09.md` est exclue de cette livraison.
