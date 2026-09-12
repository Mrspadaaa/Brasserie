# Levure : interface et cohérence des calculs

L’étape de création gardait un formulaire technique complet sous l’atelier, avec des températures affichées par défaut et un second calcul d’ensemencement. La simulation, le solveur et le cumul utilisaient aussi des règles différentes pour les paliers et les sources. Cette passe corrige ces divergences ; elle ne revendique aucun gain de précision sensorielle.

## Interface

- Souche, quantité et température d’ensemencement accessibles avant l’atelier. Un champ effacé reste inconnu, y compris après perte du focus. Saisie de 40 °C vérifiée : aucune butée artificielle à 28/30 °C.
- Actions sous le graphe. Conseils, chimie, densité et sources regroupés ; bibliothèque et fiche manuelle repliées. Le raccourci aromatique global est retiré de cette étape où l’atelier est déjà présent.
- Alertes résumées par leur nombre ; une température hors fenêtre reste signalée dans l’intitulé. Les messages complets sont disponibles à l’ouverture.
- La fiche de consultation ne répète plus une ancienne plage saisie sous le même intitulé que le calendrier. L’atténuation manuelle et la DF issue de la plage fabricant sont identifiées comme deux estimations de portée différente.

## Conflits corrigés

`functions/src/fermentationContext.ts` est commun au panneau levure, au solveur, à la simulation cumulée et au compagnon. Il contrôle les phases, inconnues, durées, températures et ajouts réellement présents. Garde froide et refermentation ne sont pas assimilées à une primaire. Un ajout de fruits ou sucre ne devient pas un houblonnage ; une ligne de houblon de zéro gramme ne valide pas le calendrier.

Une conduite active est la référence explicite de température, puis les faits concordants du catalogue. Les anciens repères du solveur ne peuvent écraser cette référence ni masquer un guide désactivé ou des données contradictoires. Les plages qualifiées ou affectées à une autre application (vin/cidre) restent documentaires. Les preuves POF opposées restent présentes et produisent un résultat indéterminé dans le solveur.

L’application d’un guide conserve la fenêtre fabricant dans les repères de la fiche, au lieu d’y copier les extrêmes du programme. Les consignes et durées effectives restent dans les paliers. Les anciens guides figés sont relus sans réécriture, et les repères manuels explicitement modifiés sont respectés.

La recommandation générique de sachets, qui supposait 150 milliards de cellules par sachet et choisissait le taux selon le nom du style, n’alimente plus cet écran ni ses besoins en stock. Le stock suit la quantité réellement saisie ; les doses fabricant sourcées restent consultables en grammes, sans conversion supposée vers les sachets.

## Versions et preuves

- Contexte levure `yeast-scenario-2` ; programme cumulé `hop-recipe-experimental-v3`. La v3 harmonise les diagnostics, sans changer les bornes numériques de la v2. Les v1/v2 restent rejouables avec leurs messages historiques ; import de sauvegarde et refus de réétiquetage testés.
- 2 434 tests de la suite normale réussis dans 137 fichiers, puis un test supplémentaire d’import/rejeu v2 réussi. Aucune requête Gemini payante.
- Onze régressions de cohérence : comparaison réelle entre les quatre parcours, révisions, POF contradictoire, vin/cidre, zéro gramme, notes d’ajout, anciennes fiches et brassin sans levure.
- Benchmarks scientifiques levure et houblon réussis. Aucune nouvelle validation externe ni réduction artificielle des intervalles.
- Parcours compilé avec les vrais composants : six objectifs à 320, 390 et 1280 px, saisie/effacement, chimie, laboratoire, erreur de persistance, sauvegarde, rechargement et variante locale. Captures inspectées pour les vues compactes, techniques, détails, inconnues et consultation. Aucun débordement horizontal ni erreur de console détecté par les parcours.
- Vingt paliers : calcul maximal 5,7 ms ; saisie → graphe de 26 à 70 ms durant les contrôles. Simulation : zéro écriture et zéro requête distante. Smoke houblon rejoué aux trois largeurs : 12–17 ms pour vingt ajouts, annulation/navigation et COA partiel vérifiés.
- Build client et fonctions, règles des 22 collections, exclusion des outils QA et du rapport privé du bundle de production vérifiés. Mesures détaillées dans `docs/qa/yeast-front-consistency-2026-09-09.json`.

La fenêtre fabricant est un domaine documentaire, pas une garantie de concentration d’ester, de rendement thiol ni de durée de fermentation. Les chiffres de DF ne remplacent pas les mesures de densité et de fin de fermentation. Aucun nouveau coefficient chimique n’a été inventé ou modifié dans cette passe.
