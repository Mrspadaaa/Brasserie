# Gates: voie a1 — défauts ouverts

OWNS: src/ui/fermentescibles/**, src/ui/IngredientPicker.tsx, src/ui/MaltDetails.tsx, src/ui/RecipeImportSheet.tsx, src/ui/RecipeAutoComplete.tsx, le lecteur d'import collé (un fichier de src/services ou src/domain, celui de l'import seul)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs a1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs a1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
