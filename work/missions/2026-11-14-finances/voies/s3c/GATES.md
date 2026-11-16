# Gates: voie s3c — Compagnon m4ia-c

OWNS: src/ui/finance/FinanceAssistant.tsx, src/ui/finance/compagnon, tests/integration/compagnonContexte.test.tsx, work/missions/2026-11-14-finances/voies/s3c

Scope: Compagnon m4ia-c, porté, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s3c/tests.txt
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
