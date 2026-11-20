# Gates: voie l3 — relance des ouverts

OWNS: src/ui/etapeLevure/**, src/ui/YeastPitchingPanel.tsx, src/ui/YeastRecipeWorkbench.tsx, src/ui/BrewLaunchPanel.tsx, src/domain/brewLaunch.ts, src/domain/yeast*.ts, tests/integration/yeastPitchingExecution.test.tsx, tests/unit/bugs-l3-*.test.ts(x)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs l3
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs l3 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
