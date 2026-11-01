# Compris : voie l2-rapprochement

## Objectif
Faire du rapprochement des lectures de facture un rapport juste et typé, jusqu'au client : un seul point par champ (A1), un statut qui vient des contrôles du code et du désaccord entre lectures, pas du bavardage du modèle (A2), chaque doute typé avec ses valeurs concurrentes gardées (U1), une troisième lecture payante seulement sur une vraie divergence (LE1), une ligne de journal par lecture et une lecture coupée dite telle quelle (LE4). Les quatre relais de l1 : le client garde `points`, `controls`, `vat`, `proForma`, `documentTypeRetenu`, `linesLost`, `rejets`, `vatCode`, `alphaPct` ; le vote les prend ; `scannedPayment` lit `documentTypeRetenu` ; une fonction pure côté client recalcule les points de ligne et de somme quand le brasseur corrige une valeur. Gemini n'est jamais appelé.

## Écrit dans
`functions/src/invoiceVisionReview.ts`
`functions/src/ai.ts`
`functions/src/invoiceScanCore.ts`
`src/services/geminiScanner.ts`
`src/services/purchasePrefill.ts`
`tests/unit/invoiceVisionReview.test.ts`
`tests/unit/depense/rapprochement/`
`work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/`

Étendu après la revue du plan (GATES.md relu) : functions/src/invoiceControls.ts (module pur neuf, où les règles de calcul de l1 sont déplacées sans changement), functions/src/invoiceScanBudget.ts et tests/unit/invoiceScanBudget.test.ts (cache d'une lecture coupée).

Aussi, listés dans la même puce de VOIE.md et dans le OWNS de GATES.md (le contrôleur ne lit que le premier chemin d'une puce, donc sans accents graves ici) : tests/unit/invoiceScanCore.test.ts (ajouts seulement), tests/unit/purchasePrefill.test.ts, tests/unit/geminiScanner.test.ts (à créer), et le fichier client du recalcul src/domain/finance/invoicePoints.ts (nommé dans le OWNS de GATES.md, « hors src/ui » dans VOIE.md).

## Fini quand
- G1 : COMPRIS OK. G2 : `REVUE-PLAN.md` relu par deux regards neufs, sans bloquant laissé (écrit par le pilote).
- G3 : `npm run build` affiche « built in ». G4 : `TYPES OK` côté app et côté fonctions.
- G5 : `TESTS RAPPROCHEMENT OK` (dossier `tests/unit/depense`, les tests de revue, de lecture, de pré-remplissage, d'intégration de la revue, du transport et du budget, `geminiScanner`, `expenseSheet`).
- G6 : `RESULTAT.md` contient « TEMOIN AVANT », « 372765 », « needsCorrection », « documentTypeRetenu », « troisième lecture », « Rien ne se perd ».
- Chaque défaut (A1, A2, U1, LE1, LE4, relais 1 à 4) a un test qui échoue sur le code d'aujourd'hui, lancé avant la correction, sortie sous « TEMOIN AVANT ».
- Le nombre de troisièmes lectures sur les lectures simulées baisse, mesuré avant et après ; `SCAN_MAX_CALLS = 3` reste.

## Ne fait pas
- Pas de modification de l'écran (`ExpenseSheet.tsx`, `InvoiceScanReview.tsx`, `QuickActionModal.tsx` en lecture seule), ni de `purchaseEntry.ts`, `stockLineMatching.ts`.
- Pas de nouvelle règle de contrôle arithmétique (C1 à C4 sont ceux de l1) ; `prompts.ts` ne bouge pas.
- Pas d'appel réel à Gemini, pas de Drive, pas de déploiement, pas de donnée réelle ; lectures simulées et fournisseurs factices seulement.
- Pas de lecture de `functions/.env`, de `.codex/`, de `source4-portable-bundle-manifest-01.json`, de `work/refonte-frontend/v4/choix/`, ni de `brasseur/`. Pas de `git stash`, pas de commit, pas de code écrit par heredoc ni par `node -e`, pas d'installation.
- Aucun champ retiré d'un document Firestore ; `review` garde ses quatre clés quand il n'y a rien de plus (des tests d'intégration le figent).
- Pas de modification de `VOIE.md` ni de `GATES.md`.

## Doutes
- `src/services/invoicePoints.ts` figure dans le `OWNS` de `GATES.md` mais pas dans le « Possède » de `VOIE.md` : le plan place le recalcul dans `src/domain/finance/invoicePoints.ts` (nommé dans les deux).
- `tests/unit/geminiScanner.test.ts` n'existe pas (le test existant est `tests/integration/geminiScanner.test.ts`, hors Possède, qui doit rester vert) : je crée le premier.
- « Un écart multiple de 5 centimes ne déclenche pas la troisième lecture », pris à la lettre, laisserait passer un écart de 124,20 CHF (60 Kg lus pour 6) : le plan borne la règle et le dit.
- Une source unique de règles entre serveur et client n'est pas possible sans nouveau fichier pur dans `functions/src/` (hors Possède) : le plan propose un second exemplaire gardé par un test de parité.
- Le sens exact de « une remarque libre ne compte que si elle porte un doute » n'est pas défini par le code : le plan tranche une règle structurelle.
- Le plafond de 40 tours pour le plan ; j'écris le plan puis je m'arrête, sans coder.
