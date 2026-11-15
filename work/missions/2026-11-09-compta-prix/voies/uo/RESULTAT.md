ECHEC — étape 2 incomplète (plafond de tours) : port codé et testé en partie ; manquent test d'écran, tsc/build finaux, captures ouvertes, branchement FinancesTab (us)

## Ce qui est fait (étape 1 et étape 2 partielle)
- `PLAN.md` corrigé constat par constat (§ 8 : retenu / écarté + raison, table état → affichage, tests 12 à 19 ajoutés). Revues A et B traitées.
- `periodeSynthese.ts` (us) était présent avec 31 tests verts (`tests/unit/periodeSynthese.test.ts`) avant que je code la barre du mois : la bande l'importe, aucun calcul de « dépensé » ni de « matériel à part » chez uo.

## Fichiers écrits (dans Possède)
- `src/ui/finance/TransactionJournal.tsx` (réécrit, mêmes exports et props ; + prop optionnelle `assistant`), `src/ui/finance/TransactionRow.tsx` (réécrit ; + props optionnelles `onAddProof`, `onPay`)
- `src/ui/finance/operations/{calculs.ts, groupes.ts, Piles.tsx, Bande.tsx}`, `src/ui/finance/operations.css`
- `tests/integration/operationsCalculs.test.tsx` (11 tests, verts)
- tests adaptés (sélecteurs seulement, aucune garde retirée) : `financeJournalUx`, `financeArchives`, `financeJournalDoublons`, `financeJournalDoubleSomme`, `ta2-compteur`
- `voies/uo/tests-head.txt` (rejeu HEAD), `tests-apres-port.txt` (premier passage : 38 rouges avant adaptation)

## Sorties décisives
- Tests : `npx vitest run` sur `financeArchives`, `financeJournalDoubleSomme`, `financeJournalDoublons`, `financeJournalUx`, `ta2-compteur`, `operationsCalculs` : tous verts à la dernière exécution (financeJournalUx 8/8, financeArchives 6/6, doublons 3/3, DoubleSomme + ta2 8/8, calculs 11/11).
- `npx tsc --noEmit` (hors firebase-admin) relancé en fin de voie : 0 erreur (`voies/uo/tsc.txt` vide). `voies/uo/tests.txt` : 6 fichiers, 36 tests verts.
- Non faits : `npx vite build`, captures 390 et 1280 (clair, cave) côte à côte avec la maquette, test d'écran `operationsEcran.test.tsx` (✓ Payé / Annuler / Encaissé / à confirmer / + pièce / pastille de filtre / piles masquées en Par date et Archives), test `FinancesTab` (assistant une fois).
- Honnêteté sur la méthode : les tests purs ont été écrits après le code (verts du premier coup), pas rouges d'abord ; les 5 tests existants étaient bien rouges après le port (38 échecs avant adaptation).

## DEMANDE EXECUTANT (série mécanique)
1. `npx tsc --noEmit 2>&1 | grep -v firebase-admin > work/missions/2026-11-09-compta-prix/voies/uo/tsc.txt` : attendu aucune ligne sous `src/ui/finance/operations`, `TransactionJournal.tsx`, `TransactionRow.tsx`.
2. `npx vitest run tests/integration/financeArchives.test.tsx tests/integration/financeJournalDoubleSomme.test.tsx tests/integration/financeJournalDoublons.test.tsx tests/integration/financeJournalUx.test.tsx tests/unit/depense/onglets/ta2-compteur.test.tsx tests/integration/operationsCalculs.test.tsx --reporter=dot > work/missions/2026-11-09-compta-prix/voies/uo/tests.txt 2>&1` : attendu 6 fichiers verts.
3. `npx vite build` : attendu vert.
4. Captures (`?dev-local&finance-demo`, onglet Opérations) 390 tactile et 1280, clair et cave, états : mois normal, après « ✓ Payé » + Annuler, Par date, Filtres ouvert, loupe ouverte, Archives, vide ; côte à côte avec `p4/v6b/v6b-page.png` et `v6b-1280.png` ; à ouvrir en image (L12). Je juge ensuite.

## Décisions et limites (à lire par le pilote)
- Légende : « payé » hors matériel (payé + à payer = dépensé), valeurs de `periodeSynthese` : sur la fixture 296,80 + 400,00 = 696,80, alors que la maquette écrit 325,40 (matériel compris). Écart à dire au brasseur. Le reste à payer du matériel n'existe pas dans le domaine : sa pile est pleine.
- « ✓ Payé » écrit un paiement du reste dû, aujourd'hui, par banque (hypothèse du geste rapide, dite dans la pastille) ; « ✓ Encaissé » pour une vente ; état « à confirmer » : « À confirmer » ouvre la feuille (`onPay`) sans rien écrire ; « Annuler » = contre-écriture le jour même seulement (après : fiche).
- « + pièce » ouvre `onAddProof` (FinancesTab → `EditTransactionModal`, pièce en base64 `legacy-inline`, `amountCents` recalculé en flottant) ; sans lui, la fiche. Limite connue (REVUE-B 7). Une vente sans pièce reste signalée comme une charge : question au pilote.
- Lecture de « Par date » : toutes les dates classées par jour (lecture étroite écartée, UO-6). Recherche : loupe dans la bande (la maquette la met dans l'en-tête d'app). Le panneau « Filtres » porte états, périmètre, catégorie, annulées, « Gérer les archives ». Doublons : puce du pied avec compte, l'avertissement s'ouvre au toucher.
- `type="month"` : sans sélecteur natif (Firefox bureau) le champ est un texte ; ‹ › est le chemin principal.
- Un compteur « N opérations » n'existe plus (D5) : il est dans le nom accessible de chaque groupe.

## Besoins hors Possède (à passer à us / pilote)
- `FinancesTab.tsx` (us) : dans `row()` passer `onAddProof={()=>setEditing(t)}` et `onPay={()=>setPaying(t)}` ; passer `assistant={financeAssistant}` à `TransactionJournal` et retirer le `{financeAssistant}` posé après lui. Sans cela : « + pièce » ouvre la fiche, « À confirmer » ouvre la fiche, l'assistant reste sous la liste.
- Tests hors Possède à adapter par leurs propriétaires : `financeWorkspace.test.tsx` (us ; 19 tests rouges pour l'instant à cause de la Synthèse en chantier : `periodeSynthese` appelée sans transactions ; et lignes 37-44, 53 : ouvrir « Filtres » et la loupe avant) ; `mobileDailyViews.test.tsx` l. 113-130 (champ de recherche visible à l'ouverture, bouton « Archives » : ouvrir la loupe d'abord) ; `tests/ux-mobile/financePeriodDrilldown.test.tsx` hors périmètre de la config vitest (non exécuté ici).
- `scripts/check-invoice-journey-emulator.mjs` l. 1048-1057 : compatible (classes `finance-op`, `journal-date-toggle`, onglet inchangés) ; non rejoué (émulateur). `scripts/agents/inventaire-ecrans.mjs` l. 128 : ajouter `operations/**` et `operations.css`.
- Orphelins à lister après la voie us : `FinancePeriodBar`, `journal-period-reading`, la classe `finance-journal`, `journal.css` (sauf `journal-chip` utilisé par FinancesTab), `CostComposition`.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un nombre affiché par deux écrans = une seule fonction de domaine (déjà proposée par la revue de us) ; et un fichier de test peut être en CRLF : les remplacements de texte multi-lignes échouent sans erreur claire.
