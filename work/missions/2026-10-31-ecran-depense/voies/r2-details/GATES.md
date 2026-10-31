# Gates: voie r2-details — les cinq détails de la relecture de r1

OWNS: src/services/purchaseEntry.ts, src/ui/finance/ExpenseSheet.tsx, tests/unit/purchaseEntry.test.ts, tests/integration/expenseSheet.test.tsx, tests/unit/depense/raccord/, work/missions/2026-10-31-ecran-depense/voies/r2-details/

Scope: détails 3 à 7 de voies/r1-raccord/RELECTURE.md ; Drive factice, Gemini simulé.

- [ ] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/r2-details
  EXPECT: COMPRIS OK

- [ ] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/r2-details/REVUE-PLAN.md
  EXPECT: REVUE OK

- [ ] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in

- [ ] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G5: les tests du raccord, de l'enregistrement, du stock et de l'écran passent
  CHECK: npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/equipmentProjects.test.tsx --maxWorkers=2 && echo TESTS DETAILS OK
  EXPECT: TESTS DETAILS OK

- [ ] G6: le résultat dit le témoin, les cinq détails et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/r2-details/RESULTAT.md --contient "TEMOIN AVANT,SACHET_MAX_G,Rattacher le justificatif,mutation,isConfirmedWriteRejection,pendingId,Rien ne se perd"
  EXPECT: NOTE OK
