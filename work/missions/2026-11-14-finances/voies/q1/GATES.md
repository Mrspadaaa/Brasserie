# Gates: voie q1 — Payer = m5pa-d, un virement pour plusieurs pièces

OWNS: src/ui/finance/FinanceForms.tsx, src/ui/finance/payer, src/domain/finance/repartition.ts, src/domain/finance/types.ts, tests/unit/repartitionVirement.test.ts, tests/integration/payerVirement.test.tsx, work/missions/2026-11-14-finances/voies/q1

Scope: m5pa-d porté dans l'app, branché, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/q1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending
