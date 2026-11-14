# Gates: voie f2 — Finitions d'Opérations et suite complète

OWNS: src/ui/finance/operations, src/ui/finance/TransactionJournal.tsx, src/ui/finance/operations.css, tests/integration/operationsPeriode.test.tsx, tests/unit/operationsPlageJours.test.ts, work/missions/2026-11-14-finances/voies/f2

Scope: lien Matériel à part, libellés de la frise, tests d'Opérations alignés, suite complète sans rouge neuf, build vert.

- [ ] G1: les tests d'Opérations passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/f2/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: la frise reste conforme
  CHECK: node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000
  EXPECT: FRISE OK
  EVIDENCE: pending

- [ ] G3: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G4: les rouges de la suite sont comparés à la base
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/f2/ROUGES.md "base rouge" ROUGES
  EXPECT: ROUGES OK
  EVIDENCE: pending

- [ ] G5: le build passe
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/f2/build.txt "built in" BUILD
  EXPECT: BUILD OK
  EVIDENCE: pending
