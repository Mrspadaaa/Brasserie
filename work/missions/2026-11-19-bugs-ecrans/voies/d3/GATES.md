# Gates: voie d3 — relance des ouverts

OWNS: src/ui/depense/**, src/ui/finance/controlesCroises.ts, functions/src/invoiceVisionReview.ts, src/services/purchase*.ts, src/domain/purchase*.ts, tests/unit/depense/**, tests/unit/bugs-d3-*.test.ts(x)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs d3
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs d3 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
