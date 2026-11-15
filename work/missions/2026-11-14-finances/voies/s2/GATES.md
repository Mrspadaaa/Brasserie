# Gates: voie s2 — Ajouter une prévision m3pr-c, Projet matériel m3pm-d, Bien amorti m3im-c, Profil m4pf-c

OWNS: src/ui/finance/FinanceForms.tsx, src/ui/finance/UpgradeSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrades.css, src/ui/finance/prevision, src/ui/finance/projet, src/ui/finance/bien, src/ui/finance/profil, tests/integration/previsionAjout.test.tsx, tests/integration/projetPiste.test.tsx, tests/integration/bienAmorti.test.tsx, tests/integration/profilEffets.test.tsx, work/missions/2026-11-14-finances/voies/s2

Scope: Ajouter une prévision m3pr-c, Projet matériel m3pm-d, Bien amorti m3im-c, Profil m4pf-c, porté, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s2/tests.txt
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
