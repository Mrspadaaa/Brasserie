# Gates: voie dc1 — relance des ouverts

OWNS: src/services/decoupe.ts, functions/src/invoiceMorceaux.ts, les scripts de mesure du banc de découpe que tu crées sous voies/dc1/, tests/unit/bugs-dc1-*.test.ts et les tests existants de la découpe (grep « decoupe » dans tests/)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs dc1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs dc1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
