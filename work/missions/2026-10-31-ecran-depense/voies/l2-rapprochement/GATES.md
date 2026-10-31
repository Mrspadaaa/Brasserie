# Gates: voie l2-rapprochement — rapprochement des lectures, statut, points typés jusqu'au client

OWNS: functions/src/invoiceVisionReview.ts, functions/src/ai.ts, functions/src/invoiceScanCore.ts, src/services/geminiScanner.ts, src/services/purchasePrefill.ts, src/services/invoicePoints.ts, src/domain/finance/invoicePoints.ts, tests/unit/invoiceVisionReview.test.ts, tests/unit/invoiceScanCore.test.ts, tests/unit/purchasePrefill.test.ts, tests/unit/geminiScanner.test.ts, tests/unit/depense/rapprochement/, work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/

Scope: A1, A2, U1, LE1, LE4 et les relais 1 à 4 de l1 ; Gemini simulé ; aucun déploiement.

- [ ] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement
  EXPECT: COMPRIS OK

- [ ] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/REVUE-PLAN.md
  EXPECT: REVUE OK

- [ ] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in

- [ ] G4: les types tiennent, côté app et côté fonctions
  CHECK: npx tsc --noEmit -p . && npx tsc --noEmit -p functions && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G5: les tests de la lecture, du rapprochement et du pré-remplissage passent
  CHECK: npx vitest run tests/unit/depense tests/unit/invoiceVisionReview.test.ts tests/unit/invoiceScanCore.test.ts tests/unit/purchasePrefill.test.ts tests/integration/invoiceReview.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceScanBudget.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx --maxWorkers=2 && echo TESTS RAPPROCHEMENT OK
  EXPECT: TESTS RAPPROCHEMENT OK

- [ ] G6: le résultat dit le témoin, la facture 372765, les troisièmes lectures et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/RESULTAT.md --contient "TEMOIN AVANT,372765,needsCorrection,documentTypeRetenu,troisième lecture,Rien ne se perd"
  EXPECT: NOTE OK
