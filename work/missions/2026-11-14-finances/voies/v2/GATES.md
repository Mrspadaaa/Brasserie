# Gates: voie t1 — problèmes du test d'écran efff31bd

OWNS: src/ui/finance, src/components/tabs/FinancesTab.tsx, src/domain/finance, src/components/Header.tsx, tests, work/missions/2026-11-14-finances/voies/v2

Scope: problèmes 1 à 3 du verdict 8b9e1732 corrigés.

- [ ] G1: les tests touchés passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/v2/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le build passe
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/v2/build.txt "built in" BUILD
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
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/v2/emulateur.txt "EMULATEUR OK" EMULATEUR
  EXPECT: EMULATEUR OK
  EVIDENCE: pending
