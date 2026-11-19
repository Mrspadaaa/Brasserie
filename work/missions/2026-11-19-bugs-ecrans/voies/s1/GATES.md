# Gates: voie s1 — défauts ouverts

OWNS: src/components/tabs/StocksTab.tsx (touché par t3 ce jour : git status d'abord), src/ui/stock/**, src/ui/stocks.css, src/ui/StockDetailSheet.tsx, src/ui/StockRow.tsx, src/ui/hopIndex/**, src/ui/hopV55/**, src/components/tabs/Dashboard* (BT-2), src/components/BottomNav.tsx (nom Stocks)

Scope: chaque défaut de BUGS-VOIE.md a un verdict prouvé dans RESULTAT.md.

- [ ] G1: chaque id de BUGS-VOIE.md a un verdict valide, chaque commit cité existe
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs s1
  EXPECT: VERDICTS OK
  EVIDENCE: pending

- [ ] G2: les tests de la voie passent (tests.txt sans échec)
  CHECK: node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs s1 --tests
  EXPECT: TESTS OK
  EVIDENCE: pending
