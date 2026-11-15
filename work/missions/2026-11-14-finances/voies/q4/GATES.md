# Gates: voie q4 — Modifier = m5mo-c, tout se modifie, montant payé compris

OWNS: src/components/EditTransactionModal.tsx, src/ui/finance/modifier, src/domain/finance/correctionMontant.ts, tests/unit/correctionMontant.test.ts, tests/integration/modifierMontant.test.tsx, work/missions/2026-11-14-finances/voies/q4

Scope: m5mo-c porté dans l'app, branché, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/q4/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending
