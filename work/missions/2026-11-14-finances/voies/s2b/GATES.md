# Gates: voie s2b — Projet matériel m3pm-d

OWNS: src/ui/finance/UpgradeSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrades.css, src/ui/finance/projet, tests/integration/projetPiste.test.tsx, work/missions/2026-11-14-finances/voies/s2b

Scope: Projet matériel m3pm-d, porté, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s2b/tests.txt
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
