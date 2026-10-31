# Gates: voie l1-lecture — la lecture d'une facture contrôlée par le code

OWNS: functions/src/invoiceScanCore.ts, functions/src/prompts.ts, functions/src/ai.ts, tests/unit/invoiceScanCore.test.ts, tests/unit/invoiceVisionReview.test.ts, tests/unit/depense/lecture/, work/missions/2026-10-31-ecran-depense/voies/l1-lecture/

Scope: C1 à C3, A10, A6, A9, P1, P2, A3 du diagnostic d1 ; un point typé par contrôle qui échoue ; Gemini simulé.

- [ ] G1: le code des fonctions est typé
  CHECK: npx tsc -p functions/tsconfig.json --noEmit && echo FONCTIONS TYPEES OK
  EXPECT: FONCTIONS TYPEES OK
  EVIDENCE: pending

- [ ] G2: les tests de la lecture passent, la vérité de sa facture comprise
  CHECK: npx vitest run tests/unit/invoiceScanCore.test.ts tests/unit/depense/lecture tests/unit/invoiceVisionReview.test.ts tests/unit/purchasePrefill.test.ts tests/integration/invoiceReview.test.ts tests/unit/invoiceScanTransport.test.ts --maxWorkers=2 && node scripts/check-prompts.mjs && echo TESTS LECTURE OK
  EXPECT: TESTS LECTURE OK
  EVIDENCE: pending

- [ ] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/l1-lecture/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: pending

- [ ] G4: le résultat dit le témoin, le contrat et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/l1-lecture/RESULTAT.md --contient "TEMOIN AVANT,contrat,Rien ne se perd,372765"
  EXPECT: NOTE OK
  EVIDENCE: pending
