# Gates: voie t1 — problèmes du test d'écran efff31bd

OWNS: src/ui/finance/prevision, src/ui/finance/projet, src/ui/finance/UpgradeSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/ui/finance/upgrades.css, src/ui/finance/previsions, src/ui/finance/budget, src/ui/finance/profil, src/ui/finance/FinanceForms.tsx, src/ui/finance/BrewBudgetSheet.tsx, src/domain/finance/upgrades.ts, tests, work/missions/2026-11-14-finances/voies/u2

Scope: Prévisions et projets : supprimer (21, 27), « Rien de prévu » (22), « de4 » (24), frise des mois (25), étiquettes du projet (26).

- [ ] G1: les tests touchés passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/u2/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le build passe
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/u2/build.txt "built in" BUILD
  EXPECT: BUILD OK
  EVIDENCE: pending

- [ ] G3: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G4: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G5: l'émulateur accepte chaque plan
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/u2/emulateur.txt "EMULATEUR OK" EMULATEUR
  EXPECT: EMULATEUR OK
  EVIDENCE: pending
