# Gates: voie s3b — Budget d'un brassin m4bb-a

OWNS: src/ui/finance/BrewBudgetDialog.tsx, src/ui/finance/BrewBudgetSheet.tsx, src/ui/finance/brew-budget.css, src/ui/finance/budget, src/components/tabs/FinancesTab.tsx, tests/integration/budgetPiles.test.tsx, work/missions/2026-11-14-finances/voies/s3b

Scope: Budget d'un brassin m4bb-a, porté, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s3b/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G3: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending
