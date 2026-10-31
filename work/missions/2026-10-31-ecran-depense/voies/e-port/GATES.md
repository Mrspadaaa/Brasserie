# Gates: voie e-port — l'écran Nouvelle dépense devient r2b (le ticket)

OWNS: src/ui/finance/ExpenseSheet.tsx, src/ui/finance/InvoiceScanReview.tsx, src/ui/depense/, src/components/QuickActionModal.tsx, src/domain/finance/forecast.ts, src/ui/finance/FinanceForecastSummary.tsx, tests/integration/expenseSheet.test.tsx, tests/unit/depense/ecran/, work/missions/2026-10-31-ecran-depense/voies/e-port/

Scope: le port de v1/r2b dans ExpenseSheet, ses greffes et les relais des voies de correction ; Drive factice, Gemini simulé.

- [ ] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/e-port
  EXPECT: COMPRIS OK

- [ ] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/e-port/REVUE-PLAN.md
  EXPECT: REVUE OK

- [ ] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in

- [ ] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G5: les tests de la dépense, de l'enregistrement, du stock et de l'écran passent
  CHECK: npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/equipmentProjects.test.tsx --maxWorkers=2 && echo TESTS ECRAN OK
  EXPECT: TESTS ECRAN OK

- [ ] G6: les champs passent par le composant protégé
  CHECK: node scripts/audit_inputs.mjs
  EXPECT: INPUT PROTECTION AUDIT PASSED

- [ ] G7: l'écran servi joue la maquette r2b, geste par geste, aux trois modes
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5616 --strictPort" --port 5616 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/e-port/capturer-depense.mjs --sortie=work/missions/2026-10-31-ecran-depense/voies/e-port/captures
  EXPECT: DEPENSE OK

- [ ] G8: le résultat dit le témoin, ce qui ne se perd pas et les relais
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/e-port/RESULTAT.md --contient "TEMOIN AVANT,Rien ne se perd,pendingId,S8,mouture,recomputeInvoicePoints,captures"
  EXPECT: NOTE OK
