# Gates: voie e1 — T3B-7, T3B-8, T3B-9

OWNS: src/ui/identite/**, src/ui/nolo/**, src/ui/Nolo*.tsx, src/domain/nolo/**, src/ui/fermentescibles/**, src/ui/IngredientPicker.tsx, src/domain/fermentescibles/**. src/pages/BrewWizard.tsx appartient à t3-corrections : s'il faut y toucher, verdict « ouvert — hors voie : BrewWizard.tsx l.N, changement exact » (le pilote transmet)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs e1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs e1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
