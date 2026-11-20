# Gates: voie v3 — relance des ouverts

OWNS: src/ui/finance/** sauf les fichiers occupés, src/ui/vente/** et les fichiers de Vendre (grep « Encaisser »), src/ui/calendrier/** et les fichiers du détail de brassin du Calendrier (grep « au plus tôt »), src/ui/EnTete.tsx, src/domain/stock*.ts et src/services/stock*.ts (pas storage.ts : occupé), tests/unit/bugs-v3-*.test.ts(x)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs v3
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs v3 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
