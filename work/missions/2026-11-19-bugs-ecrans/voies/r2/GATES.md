# Gates: voie r2 — BK2-1, BK2-2, BK2-3, BK2-4, BK2-6, BR-100, BE-53, RJ-14, TE-53, TE-54, GE-NOTE-5

OWNS: src/ui/recette/Dessins.tsx, src/domain/hopStage.ts, src/ui/YeastCataloguePanel.tsx, src/ui/YeastRecipeWorkbench.tsx, src/ui/YeastPitchingPanel.tsx, src/ui/NoloRecipeSimulator.tsx, src/ui/FermentationWorkshop.tsx, src/ui/conduite/**, src/ui/hopIndex/** (TE-53, TE-54 ; l'atelier V5.5 : src/ui/hopV55/** appartient à w1, ne pas y écrire), src/ui/identite/** (BK2-6)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs r2
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs r2 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
