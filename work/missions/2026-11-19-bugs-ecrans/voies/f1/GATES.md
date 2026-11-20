# Gates: voie f1 — T3B-6, T3B-11, T3B-12

OWNS: src/pages/RecipePage.tsx, src/ui/hopIndex/HopRecipeWorkbench.tsx, src/ui/hopIndex/suggerer/**, src/ui/hopIndex/biere/**, src/services/hopV55/**, src/ui/recipe/**, src/domain/recipeImport/**, src/services/recipeImport*, src/domain/recipe*.ts

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs f1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs f1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
