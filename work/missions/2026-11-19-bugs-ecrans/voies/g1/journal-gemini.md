# Journal Gemini — voie g1 (bugs-ecrans, 20.11) : tests Gemini réels, budget IA du brasseur

Accord (SPEC-BRASSEUR ~l. 2324, 20.11) : « oui pour les test de 5 chf à 7chf Max budget ia ». Pilote : 7 CHF au plus pour TOUT le budget IA de ces
tests, dépensé compris ; arrêt dès que cumul + lot suivant dépasserait **6,80 CHF**.

## Déjà dépensé de ce budget, calculé avant le premier appel (20.11)

**Total du budget IA du 18.11 (« 5chf de crédit IA pour les tests en ligne du carnet », SPEC ~l. 2096), porté à 7 CHF le 20.11 : 0,00 CHF mesuré.**

- Journaux `journal-gemini.md` des deux worktrees (`Brasserie`, `port-carnet`) et des deux autres copies (`port-calendrier`, `ports-nuit`) : aucune ligne
  datée du 16.11 au 20.11 (dates présentes : seulement 14.11 et 15.11). Lot G du port du carnet (`voies/G/journal-gemini.md`, 17.11) : « 0 appel ».
- Journal du banc de lecture (`2026-11-01-banc-lecture/journal-gemini.md`) : dernière ligne le 09.11 (cumul 10,694 CHF), budgets D234 et D242, clos.
- Lignes du 14.11 et du 15.11, **hors de ce budget** (accordées avant, d'autres enveloppes) : `2026-11-14-gemini4/journal-gemini.md` 8,869 CHF (14.11 : « 10chf de budget »
  puis « budget jusqu'à 15chf ») ; `2026-11-08-enrichissement/journal-gemini.md` 0,406 CHF le 15.11 (budget de l'enrichissement). Je ne les compte pas : ce budget naît le 18.11.
  Si le pilote les compte, il ne reste rien : à lui de le dire.
- Non mesurable d'ici : les appels réels éventuels des tests en ligne du carnet (18.11 à 20.11) passent par `brewerBudget` (Firestore), que cette voie ne lit pas
  (aucune donnée réelle). Aucune trace de tel appel dans les dépôts. Hypothèse retenue : 0, dite. Marge de sécurité : arrêt à 6,80 et non à 7.

Cumul de départ retenu : **0,0000 CHF**. Plafond d'arrêt : cumul + lot suivant ≤ 6,80 CHF.

## Défauts rejoués, pièces (hors Git : `H13-reels/`, jamais de valeur ici)

| pièce | défauts |
|---|---|
| doc25 (BAUHAUS copie) | LR1-8, LR2-9, LR3-1, LR1-NOTE-3 |
| doc22, doc23 (Sun Store 1 et 2) | LR2-2 |
| doc24 (BAUHAUS tâché) | LR2-NOTE-1, LR1-NOTE-2 |
| doc15 (ticket BAUHAUS) | LR1-NOTE-1 |
| doc7 (Infomaniak) | M9-2, BT-NOTE-3 |
| doc14 (commande BRAU) | LR2-4, M9-2 |
| doc2 (facture papier 2 TVA) | LR2-6 |
| les 13 pièces et 5 tickets | LL-8, TL-NOTE-2, SU-NOTE-6 (relecture, délais) |

Lecture jouée = production déployée : `functions/` de port-carnet, variante `Csv8` du banc (2 Flash-Lite 8 192 jetons en parallèle, 3.8 tranche sur désaccord) + normalisation N,
lancée par `lancer.ts` (même dossier). Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD), pas une facture. Colonnes : date, pièce, tirage, variante, lecture, modèle,
durée, jetons entrée, jetons sortie, coût CHF, cumul CHF de CE journal (0 au départ), état.

| date | doc | tirage | variante | lecture | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-20 11:39:32 | doc2 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 3520 ms | 3617 | 1232 | 0.005207 | 0.005207 | STOP |
| 2026-11-20 11:39:32 | doc2 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 3527 ms | 3638 | 1226 | 0.005196 | 0.010403 | STOP |
| 2026-11-20 11:39:41 | doc2 | 1 | Csv8 | 3 | gemini-3.8-flash | 8718 ms | 3653 | 792 | 0.014275 | 0.024678 | STOP |
| 2026-11-20 11:39:45 | doc7 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 3745 ms | 3638 | 1227 | 0.005199 | 0.029877 | STOP |
| 2026-11-20 11:39:45 | doc7 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 3911 ms | 3617 | 1226 | 0.005188 | 0.035065 | STOP |
| 2026-11-20 11:39:51 | doc14 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 6174 ms | 3617 | 2722 | 0.009863 | 0.044928 | STOP |
| 2026-11-20 11:39:51 | doc14 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 6643 ms | 3638 | 2615 | 0.009537 | 0.054465 | STOP |
| 2026-11-20 11:40:16 | doc14 | 1 | Csv8 | 3 | gemini-3.8-flash | 24263 ms | 3653 | 1785 | 0.023584 | 0.078049 | STOP |
| 2026-11-20 11:40:23 | doc15 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 7506 ms | 3624 | 2662 | 0.009678 | 0.087727 | STOP |
| 2026-11-20 11:40:24 | doc15 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 7848 ms | 3603 | 2827 | 0.010186 | 0.097913 | STOP |
| 2026-11-20 11:40:48 | doc15 | 1 | Csv8 | 3 | gemini-3.8-flash | 24273 ms | 3639 | 1793 | 0.023633 | 0.121546 | STOP |
| 2026-11-20 11:40:51 | doc22 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 3008 ms | 3617 | 724 | 0.003619 | 0.125165 | STOP |
| 2026-11-20 11:40:51 | doc22 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 3072 ms | 3638 | 673 | 0.003468 | 0.128633 | STOP |
| 2026-11-20 11:40:54 | doc23 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 3478 ms | 3638 | 1191 | 0.005087 | 0.133720 | STOP |
| 2026-11-20 11:40:55 | doc23 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 3805 ms | 3617 | 1268 | 0.005319 | 0.139039 | STOP |
| 2026-11-20 11:41:03 | doc23 | 1 | Csv8 | 3 | gemini-3.8-flash | 8496 ms | 3653 | 658 | 0.013019 | 0.152058 | STOP |
| 2026-11-20 11:41:12 | doc24 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 9065 ms | 3638 | 4190 | 0.014458 | 0.166516 | STOP |
| 2026-11-20 11:41:12 | doc24 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 9079 ms | 3617 | 4277 | 0.014722 | 0.181238 | STOP |
| 2026-11-20 11:41:38 | doc24 | 1 | Csv8 | 3 | gemini-3.8-flash | 25750 ms | 3653 | 2905 | 0.034084 | 0.215322 | STOP |
| 2026-11-20 11:41:45 | doc25 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 7129 ms | 3617 | 3198 | 0.011351 | 0.226673 | STOP |
| 2026-11-20 11:41:46 | doc25 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 7658 ms | 3638 | 3534 | 0.012408 | 0.239081 | STOP |
| 2026-11-20 11:42:02 | doc25 | 1 | Csv8 | 3 | gemini-3.8-flash | 15899 ms | 3653 | 2278 | 0.028206 | 0.267287 | STOP |
| 2026-11-20 11:44:52 | doc14 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 5473 ms | 3638 | 2611 | 0.009524 | 0.276811 | STOP |
| 2026-11-20 11:44:55 | doc14 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 7967 ms | 3617 | 2714 | 0.009838 | 0.286649 | STOP |
| 2026-11-20 11:45:03 | doc24 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 8677 ms | 3638 | 4373 | 0.015030 | 0.301679 | STOP |
| 2026-11-20 11:45:04 | doc24 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 9160 ms | 3617 | 4664 | 0.015932 | 0.317611 | STOP |
| 2026-11-20 11:45:27 | doc24 | 1 | Csv8 | 3 | gemini-3.8-flash | 23644 ms | 3653 | 2842 | 0.033494 | 0.351105 | STOP |
| 2026-11-20 11:45:35 | doc25 | 1 | Csv8 | 2 | gemini-3.5-flash-lite | 7067 ms | 3638 | 3317 | 0.011730 | 0.362835 | STOP |
| 2026-11-20 11:45:35 | doc25 | 1 | Csv8 | 1 | gemini-3.5-flash-lite | 7477 ms | 3617 | 3866 | 0.013438 | 0.376273 | STOP |
| 2026-11-20 11:46:20 | doc25 | 1 | Csv8 | 3 | gemini-3.8-flash | 45009 ms | ? | ? | 0.088050 | 0.464323 | délai (coût inconnu : réserve comptée) |
| 2026-11-20 11:46:25 | doc14 | 2 | Csv8 | 1 | gemini-3.5-flash-lite | 5351 ms | 3617 | 2637 | 0.009597 | 0.473920 | STOP |
| 2026-11-20 11:46:26 | doc14 | 2 | Csv8 | 2 | gemini-3.5-flash-lite | 5493 ms | 3638 | 2608 | 0.009515 | 0.483435 | STOP |
| 2026-11-20 11:46:42 | doc14 | 2 | Csv8 | 3 | gemini-3.8-flash | 16012 ms | 3653 | 1807 | 0.023790 | 0.507225 | STOP |
| 2026-11-20 11:46:50 | doc24 | 2 | Csv8 | 1 | gemini-3.5-flash-lite | 7857 ms | 3617 | 4125 | 0.014247 | 0.521472 | STOP |
| 2026-11-20 11:46:51 | doc24 | 2 | Csv8 | 2 | gemini-3.5-flash-lite | 9027 ms | 3638 | 4427 | 0.015199 | 0.536671 | STOP |
| 2026-11-20 11:47:19 | doc24 | 2 | Csv8 | 3 | gemini-3.8-flash | 28424 ms | 3653 | 3036 | 0.035312 | 0.571983 | STOP |
| 2026-11-20 11:47:26 | doc25 | 2 | Csv8 | 1 | gemini-3.5-flash-lite | 6513 ms | 3617 | 3198 | 0.011351 | 0.583334 | STOP |
| 2026-11-20 11:47:26 | doc25 | 2 | Csv8 | 2 | gemini-3.5-flash-lite | 6974 ms | 3638 | 3318 | 0.011733 | 0.595067 | STOP |
| 2026-11-20 11:48:11 | doc25 | 2 | Csv8 | 3 | gemini-3.8-flash | 45002 ms | ? | ? | 0.088050 | 0.683117 | délai (coût inconnu : réserve comptée) |
