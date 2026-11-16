# Gates: voie r3 — intégration du port des 8 vues

OWNS: src/ui/finance, src/components/tabs/FinancesTab.tsx, src/components/EditTransactionModal.tsx, tests, work/missions/2026-11-14-finances/voies/r3

Scope: branchements finis, tests réalignés, suite sans rouge neuf, build vert.

- [ ] G1: les rouges de la suite sont comparés à la base
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/r3/ROUGES.md "base rouge" ROUGES
  EXPECT: ROUGES OK
  EVIDENCE: pending

- [ ] G2: le build passe
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/r3/build.txt "built in" BUILD
  EXPECT: BUILD OK
  EVIDENCE: pending

- [ ] G3: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G4: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending
