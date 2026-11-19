# Gates: voie c1 — défauts ouverts

OWNS: src/ui/vente/**, src/ui/clients.css, src/components/EditClientModal.tsx, src/components/tabs/Clients*, src/ui/prix/**, src/ui/TarifSheet.tsx, la génération de facture client (PDF) et son service

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs c1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs c1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
