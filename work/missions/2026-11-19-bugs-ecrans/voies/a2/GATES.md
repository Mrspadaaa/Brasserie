# Gates: voie a2 — défauts ouverts

OWNS: src/ui/identite/**, src/ui/paliers/**, src/ui/recap/**, src/ui/Nolo*.tsx, src/ui/nolo-*.css, src/ui/RecipeThermalPlan.tsx, src/pages/BrewWizard.tsx et src/pages/recipe-wizard.css (zones Identité, Paliers, NOLO, Récap seulement), la fonction de saccharification du moteur (BR-5)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs a2
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs a2 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
