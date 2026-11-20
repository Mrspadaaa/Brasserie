# Gates: voie ct4b — critique tour 4

OWNS: src/pages/RecipePage.tsx, src/ui/recette/**, src/ui/production/recettes/**, src/ui/hopIndex/** (carte de la fiche), src/ui/wizard/**, src/ui/floating-actions.css, src/ui/page-shell.css, src/pages/BrewWizard.tsx (une autre voie y retire l'atelier V5.5 : `git status --short src/pages/BrewWizard.tsx` juste avant chaque Edit ; modifié par une autre session → attends la fin de ta voie pour ce point ou rends « ouvert — BrewWizard occupé »)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs ct4b
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs ct4b --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
