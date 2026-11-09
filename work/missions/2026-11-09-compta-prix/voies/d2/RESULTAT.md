PLAN PRÊT — d2 étape 1 : `PLAN.md` écrit (prévision dérivée, domaine seul), en attente de revue ; aucun code.

Fichiers écrits : `voies/d2/PLAN.md`, `voies/d2/tests-head.txt` (rejeu des appelants sur HEAD : `Test Files 6 failed | 192 passed | 1 skipped (199)`, `Tests 2630 passed` ; les 6 échecs sont des fichiers non chargés, `firebase-admin` absent, déjà vus par d1 et d3), `voies/d2/RESULTAT.md`.

Points du plan à relire en revue :
- Décision 1 : réemployer `estimateBrewBudget` par brassin (même 64,26 que l'écran c3a), coût mesuré avant branchement (seuil 20 ms, repli mémoïsation).
- Décision 10 : écart assumé au plan métier : une facture `batchId` ne réduit pas l'item achats (le stock est déjà à jour, `purchaseEntry.ts:732`) ; elle réduit seulement l'emballage.
- Branchement `FinancesTab` / `assistantContext` hors Possède (Q1) : sans lui, rien ne se voit à l'écran.

DÉCISION À PRENDRE : Q1 à Q5 de `PLAN.md` § 7 (branchement, frais par défaut, factures `batchId`, brassins commencés, période d'impôt). Recommandations écrites dans le plan.

CONNAISSANCE : une facture d'achat saisie met le stock à jour (`src/services/purchaseEntry.ts:732`) : toute prévision qui soustrait aussi la facture du besoin d'achat compte deux fois.
LEÇON PROPOSÉE : aucune
