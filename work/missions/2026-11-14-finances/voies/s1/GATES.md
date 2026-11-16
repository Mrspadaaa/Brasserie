# Gates: voie s1 — Doublons m1do-a, Archives m1ar-c, FN-2

OWNS: src/ui/finance/TransactionJournal.tsx, src/ui/finance/operations, src/ui/finance/operations.css, src/ui/finance/journal.css, src/ui/finance/ArchiveManagerSheet.tsx, src/ui/finance/TransactionRow.tsx, src/domain/finance/duplicates.ts, src/domain/finance/archive.ts, tests/integration/doublonsPaire.test.tsx, tests/integration/archivesFrise.test.tsx, tests/integration/operationsPeriode.test.tsx, work/missions/2026-11-14-finances/voies/s1

Scope: Doublons m1do-a, Archives m1ar-c, FN-2, porté, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s1/tests.txt
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
