# Gates: voie v1 — T3B-10, T3B-13

OWNS: le composant du graphique Prévisions (à trouver : grep), src/domain/tarifs/**, le composant de la tuile Vendre (à trouver). t3-carnet écrit dans src/ui/finance/** ces jours : `git status --short` et `git log -3 -- <fichier>` avant ; fichier sale d'une autre session → verdict « ouvert — hors voie »

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs v1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs v1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
