# Gates: voie stock — Stocks : Courses une fois, totaux alignés, défilement par la fenêtre

OWNS: src/components/tabs/StocksTab.tsx, src/ui/stock/, src/ui/EntityList.tsx, tests/integration/stocksTour3.test.tsx, tests/integration/stocksVision1911.test.tsx

Scope: Stocks : Courses une fois, totaux alignés, défilement par la fenêtre

- [ ] G1: le test de la voie passe (il échouait avant la correction, sortie rouge citée dans RESULTAT.md)
  CHECK: cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && npx vitest run tests/integration/stocksTour3.test.tsx --reporter=dot > /dev/null && echo VITEST OK
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && npx tsc --noEmit -p . && echo TSC OK
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G3: RESULTAT.md cite la sortie rouge d'avant
  CHECK: grep -q -i "avant" work/missions/2026-11-19-tour3-correctifs/voies/stock/RESULTAT.md && echo ROUGE CITE
  EXPECT: ROUGE CITE
  EVIDENCE: pending
