# Gates: voie ct4a — critique tour 4

OWNS: src/ui/etapeLevure/** (autorisé depuis le 20.11), src/ui/YeastPitchingPanel.tsx, src/ui/YeastRecipeWorkbench.tsx, src/ui/FermentationWorkshop.tsx, src/ui/conduite/**, src/ui/BatchDetailSheet.tsx, src/ui/brewDay/** et les fichiers du jour J (grep « Ensemencement »), src/ui/mesures/** et la courbe de densité (grep), src/domain/yeast*.ts, src/ui/RecapEtat.tsx (point 3)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs ct4a
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs ct4a --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
