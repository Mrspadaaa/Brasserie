# Gates: voie s2 — AM-56, BT-2, TL-10, GE-NOTE-1

OWNS: src/domain/stock/**, src/ui/stock/** (pas StocksTab.tsx : E1-1), src/ui/StockDetailSheet.tsx, src/ui/StockRow.tsx, src/components/tabs/Dashboard*, src/domain/planning*/**, src/data/malts*/** et le catalogue de malts (à trouver : grep), src/domain/fermentescibles/** (TL-10)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs s2
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs s2 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
