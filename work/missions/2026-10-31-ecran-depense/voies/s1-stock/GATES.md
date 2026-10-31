# Gates: voie s1-stock — chaque ligne de facture reliée au bon article, ou à aucun

OWNS: src/services/stockLineMatching.ts, src/services/ingredientIdentity.ts, src/ui/finance/ExpenseSheet.tsx, tests/unit/stockLineMatching.test.ts, tests/unit/depense/stock/, work/missions/2026-10-31-ecran-depense/voies/s1-stock/

Scope: S1 à S4, A8, A9, B-V3-5 ; la chasse du 17.10 sans fausse proposition ; Gemini simulé.

- [ ] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending

- [ ] G2: les tests de l'appariement passent, la chasse et sa facture comprises
  CHECK: npx vitest run tests/unit/stockLineMatching.test.ts tests/unit/depense/stock tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts --maxWorkers=2 && echo TESTS STOCK OK
  EXPECT: TESTS STOCK OK
  EVIDENCE: pending

- [ ] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/s1-stock/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: pending

- [ ] G4: le résultat dit le témoin, la chasse et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/s1-stock/RESULTAT.md --contient "TEMOIN AVANT,0 fausse proposition,Rien ne se perd,372765"
  EXPECT: NOTE OK
  EVIDENCE: pending
