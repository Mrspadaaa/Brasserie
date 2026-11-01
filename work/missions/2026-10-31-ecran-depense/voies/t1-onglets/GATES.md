# Gates: voie t1-onglets — Opérations, Synthèse et Prévisions disent les mêmes nombres

OWNS: src/domain/finance/ledger.ts, src/domain/finance/forecast.ts, src/ui/finance/TransactionJournal.tsx, src/components/tabs/FinancesTab.tsx, src/ui/finance/FinanceForecastSummary.tsx, tests/integration/dashboardNavigation.test.tsx, tests/integration/equipmentProjects.test.tsx, tests/integration/financeArchives.test.tsx, tests/integration/financeWorkspace.test.tsx, tests/integration/fix114.test.tsx, tests/integration/mobileDailyViews.test.tsx, tests/ux-mobile/financePeriodDrilldown.test.tsx, tests/unit/finance.test.ts, tests/unit/financeForecast.test.ts, tests/unit/forecastHorizon.test.ts, tests/unit/depense/onglets/, work/missions/2026-10-31-ecran-depense/voies/t1-onglets/

Scope: TA2, TA3, TA4, TA6 du diagnostic d2, dans le calcul ; la forme des vues ne change pas.

- [x] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=98a824d5c4f7bb6104c0157d3f2ccd297794a69fdaca8edcdd42c868631e3fbe; output-bytes=47377; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests des finances passent, les sondes du diagnostic comprises
  CHECK: npx vitest run tests/unit/finance.test.ts tests/unit/financeForecast.test.ts tests/unit/forecastHorizon.test.ts tests/unit/brewerBudgetLedger.test.ts tests/integration/financeJournalUx.test.tsx tests/unit/fribourgTax.test.ts tests/unit/financeArchiveContinuity.test.ts tests/unit/financeRefunds.test.ts tests/integration/dashboardNavigation.test.tsx tests/integration/equipmentProjects.test.tsx tests/integration/financeArchives.test.tsx tests/integration/financeWorkspace.test.tsx tests/integration/fix114.test.tsx tests/integration/mobileDailyViews.test.tsx tests/ux-mobile/financePeriodDrilldown.test.tsx tests/unit/depense/onglets --maxWorkers=2 && echo TESTS ONGLETS OK
  EXPECT: TESTS ONGLETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3aad819b354c6d38c1480068ca2aae0d304773f490d60903b2838762c7b4a6c5; exit=0; EXPECT=matched; output-sha256=3ce1b6f90f1d868b1a38433adb6f8ebbec289d8b6ff5663366e1630b1a67f205; output-bytes=8626; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/t1-onglets/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f3ad1fd6b0a4c96b7af3af1a46cadccda780cce60d295e1f928152148417f50b; exit=0; EXPECT=matched; output-sha256=6aa13323af741bf00e0bcd5821a1c380e3815c16ad36d4a8c0a9ba253854bc89; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le résultat dit le témoin, les appelants et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/t1-onglets/RESULTAT.md --contient "TEMOIN AVANT,appelants,échéance à préciser,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2379d674b6b46ffe41e82a48141027e6ae0cd56e9ffa85aa40ebdbf139046d6c; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
