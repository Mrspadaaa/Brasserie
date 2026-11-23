# Grille du niveau Max (écrite avant les passes, 14.11.2026, voie t2c)

Fixtures synthétiques ; chaque contrôle est appliqué par le code (`scripts/banc-t2c-max.ts`), sans juge.

## A-anomalies-1 (choix, detectAnomalies)
Défauts plantés : doublon T05+T06 ; montant T09 ; tva T11 ; justificatif T13 ; date T15. Qualité = 0,5 rappel + 0,3 précision + 0,2 types ; faux positif = anomalie sans défaut planté.

## D1-calage (choix, diagnoseBatch)
- atténuation apparente 31 % (±2)
- gravité surveiller ou agir (ni normal, ni urgent)
- cause : température trop basse
- cause : levure (quantité, vitalité, réhydratation)
- action : réchauffer ou remuer

## D3-chaud (choix, diagnoseBatch)
- atténuation apparente 51 % (±2)
- gravité surveiller ou agir
- cause : température trop élevée
- esters, alcools supérieurs, solvant
- action : refroidir

## M1-non-assujetti (choix, monthlySummary)
- charges 2 159,50
- recettes 1 910,50
- solde −249,00
- matières premières 263,00
- loyer 1 200,00
- aucune TVA inventée (non assujetti)
- montant manquant de la levure signalé, non complété

## B-anomalies-2 (jugement, detectAnomalies)
Défauts plantés : doublon U01+U02 ; montant U05 ; justificatif U10 ; date U11 ; tva U12. Qualité = 0,5 rappel + 0,3 précision + 0,2 types ; faux positif = anomalie sans défaut planté.

## D2-normal (jugement, diagnoseBatch)
- atténuation apparente 78 % (±2)
- gravité normal
- le verdict dit que c’est normal, sans inventer de problème
- aucune cause probable à plus de 40 % (rien d’inventé)

## D4-donnees-rares (jugement, diagnoseBatch)
- aucune atténuation inventée (un seul relevé)
- gravité normal ou surveiller (pas agir, pas urgent)
- dit qu’il manque des relevés / mesurer la densité
- pistes : étanchéité du couvercle, patience, délai de démarrage

## M2-assujetti (jugement, monthlySummary)
- charges 2 251,20
- recettes 1 621,50 (apport privé exclu)
- solde −629,70
- TVA collectée 121,50
- TVA déductible 51,20
- loyer 1 500,00
