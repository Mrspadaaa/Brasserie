# Gates: voie w1 — TL-7, TL-19, TL-16, T3-11, BK2-5, TE-27

OWNS: src/pages/BrewWizard.tsx (t3-corrections y corrige B1-NOTE-3, BR-91, TE-13 : `git status --short src/pages/BrewWizard.tsx` AVANT chaque modification ; s'il est modifié et non commité par une autre session, n'écris pas : mets ton changement en patch dans voies/w1/patches/<id>.diff et verdict « ouvert — patch prêt, BrewWizard occupé » ; s'il est propre, modifie, teste et committe aussitôt, par chemin), src/ui/wizard/**, src/ui/Nolo*.tsx, src/ui/nolo/**, src/ui/water/** (TL-16), src/ui/hopV55/** (TE-27), src/domain/recipeDraft*.ts

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs w1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs w1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
