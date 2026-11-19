# Gates: voie t1 — défauts ouverts

OWNS: src/ui/FloatingActions.tsx, src/ui/floating-actions.css, src/pages/PageShell.tsx, src/pages/page-shell.css, src/components/Header.tsx (touché par t3 ce jour : git status d'abord), src/components/recherche/**, src/ui/CommandPalette.tsx, src/ui/rechercheAvancee/**, src/ui/water/**, src/ui/Water*.tsx, src/ui/SaltSolver.tsx

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs t1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs t1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
