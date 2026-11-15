# Gates: voie f3 — Les 3 bloquants du test d'écran final

OWNS: src/ui/finance/operations, src/ui/finance/TransactionJournal.tsx, src/ui/finance/operations.css, src/ui/finance/annuel, src/ui/finance/TaxWorkspace.tsx, tests/unit/operationsPlageJours.test.ts, tests/integration/operationsPeriode.test.tsx, work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs, work/missions/2026-11-14-finances/voies/f3

Scope: bloquants 1, 2, 3 et mineurs 4, 8, 11, 14 du verdict c398e064 corrigés.

- [ ] G1: la frise suit la règle de s2ap2 (à payer à l'échéance)
  CHECK: node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000
  EXPECT: FRISE OK
  EVIDENCE: pending

- [ ] G2: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G3: l'Annuel reste conforme
  CHECK: node work/missions/2026-11-14-finances/voies/a1/controle-annuel.mjs 3000
  EXPECT: ANNUEL OK
  EVIDENCE: pending

- [ ] G4: les correctifs r1 restent verts
  CHECK: node work/missions/2026-11-14-finances/voies/r1/controle-r1.mjs 3000
  EXPECT: R1 OK
  EVIDENCE: pending

- [ ] G5: les tests passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/f3/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending
