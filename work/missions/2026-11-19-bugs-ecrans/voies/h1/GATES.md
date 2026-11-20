# Gates: voie h1 — T3B-4, T3B-5

OWNS: src/ui/hopIndex/** SAUF src/ui/hopIndex/HopRecipeWorkbench.tsx, src/ui/hopIndex/suggerer/** et src/ui/hopIndex/biere/** ; src/domain/hopIndex/v4/data.ts (libellés seulement)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs h1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs h1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
