# Gates: voie q2 — Apport = m5ap-a, les deux poches avec justificatif

OWNS: src/ui/finance/MovementSheet.tsx, src/ui/finance/mouvement, tests/integration/apportPoches.test.tsx, work/missions/2026-11-14-finances/voies/q2

Scope: m5ap-a porté dans l'app, branché, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/q2/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending
