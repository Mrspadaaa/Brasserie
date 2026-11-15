# Gates: voie r2 — intégration du port du 15.11

OWNS: src/ui/finance/TransactionDetails.tsx, src/ui/finance/fiche, src/ui/finance/DocumentProofLink.tsx, tests/integration/financeWorkspace.test.tsx, tests/integration/depenseMedicament.test.tsx, work/missions/2026-11-14-finances/voies/r2

Scope: justificatif de paiement visible, tests voisins réalignés, suite sans rouge neuf, build vert.

- [ ] G1: les tests touchés passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/r2/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: les rouges de la suite sont comparés à la base
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/r2/ROUGES.md "base rouge" ROUGES
  EXPECT: ROUGES OK
  EVIDENCE: pending

- [ ] G3: le build passe
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/r2/build.txt "built in" BUILD
  EXPECT: BUILD OK
  EVIDENCE: pending

- [ ] G4: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending
