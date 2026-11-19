# Gates: voie r1 — défauts ouverts

OWNS: src/pages/RecipePage.tsx, src/pages/recipePageLoader.ts, src/ui/recette/**, src/ui/RecipeReview.tsx, src/ui/RecipeDisclosure.tsx, src/ui/BrewerBudget.tsx, src/ui/HopBitternessPanel.tsx, src/components/tabs/Recettes* (liste et carte de recette)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs r1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs r1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
