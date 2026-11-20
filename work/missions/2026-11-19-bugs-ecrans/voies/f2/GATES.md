# Gates: voie f2 — T3-8, T3-9, LR3-NOTE-1

OWNS: src/ui/finance/** et src/components/tabs/FinancesTab.tsx (t3-carnet y écrit : `git status --short` et `git log -3 -- <fichier>` avant ; fichier modifié non commité par une autre session → verdict « ouvert — hors voie, fichier occupé »), src/domain/finance/**, src/domain/tarifs/**, src/ui/vendre/** et le composant de Vendre (à trouver)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs f2
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs f2 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
