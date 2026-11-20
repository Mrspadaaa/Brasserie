# Gates: voie r3 — relance des ouverts

OWNS: src/pages/BrewWizard.tsx, src/ui/wizard/**, src/ui/water/WaterSummary.tsx, src/pages/RecipePage.tsx, src/ui/recette/**, src/ui/production/recettes/**, src/domain/recipe*.ts, src/services/nomsIngredients*.ts (si tu le crées), tests/integration/brewWizard*.test.tsx, tests/unit/bugs-r3-*.test.ts(x). FeuilleBrasser.tsx est occupé : si la feuille demande un changement là, rends « ouvert — fichier occupé » avec le changement exact, et corrige à la source partagée si elle existe.

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs r3
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs r3 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
