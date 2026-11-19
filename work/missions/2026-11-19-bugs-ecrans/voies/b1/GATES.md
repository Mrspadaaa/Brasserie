# Gates: voie b1 — défauts ouverts

OWNS: src/pages/BrewDayPage.tsx, src/pages/brew-day.css, src/ui/Brew*.tsx (sauf BrewerBudget.tsx), src/ui/brew-*.css, src/ui/companion/**, src/ui/lot/**, src/ui/production/**, src/ui/atelier/**, src/ui/BatchDetailSheet.tsx, src/ui/equipment/**, src/components/tabs/Brassins*, src/ui/FermentationTemperatureChart.tsx (BE-42 seulement ; touché par ma-levure : git status d'abord)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs b1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs b1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
