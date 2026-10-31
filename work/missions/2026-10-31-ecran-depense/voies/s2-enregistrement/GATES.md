# Gates: voie s2-enregistrement — la dépense enregistrée juste, et son justificatif prouvé

OWNS: src/services/purchaseEntry.ts, src/services/purchasePrefill.ts, src/services/financeDocuments.ts, src/services/driveFileStore.ts, src/domain/finance/brewBudget.ts, tests/unit/purchaseEntry.test.ts, tests/unit/purchasePrefill.test.ts, tests/unit/financeDocuments.test.ts, tests/integration/driveFileStore.test.ts, tests/unit/depense/enregistrement/, work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/

Scope: A7, A11, A12, S5, S7, S8, DR1, DR4 (message), DR5 ; Drive factice, Gemini simulé.

- [ ] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending

- [ ] G2: les tests de l'enregistrement et du Drive factice passent
  CHECK: npx vitest run tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/financeDocuments.test.ts tests/integration/driveFileStore.test.ts tests/unit/depense/enregistrement --maxWorkers=2 && echo TESTS ENREGISTREMENT OK
  EXPECT: TESTS ENREGISTREMENT OK
  EVIDENCE: pending

- [ ] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: pending

- [ ] G4: le résultat dit le témoin, la mouture et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/RESULTAT.md --contient "TEMOIN AVANT,Zuschlag Schrotung,webViewLink,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: pending
