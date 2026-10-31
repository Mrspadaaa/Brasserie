# Gates: voie t1-onglets — Opérations, Synthèse et Prévisions disent les mêmes nombres

OWNS: src/domain/finance/ledger.ts, src/domain/finance/forecast.ts, src/ui/finance/TransactionJournal.tsx, src/components/tabs/FinancesTab.tsx, src/ui/finance/FinanceForecastSummary.tsx, tests/integration/dashboardNavigation.test.tsx, tests/integration/equipmentProjects.test.tsx, tests/integration/financeArchives.test.tsx, tests/integration/financeWorkspace.test.tsx, tests/integration/fix114.test.tsx, tests/integration/mobileDailyViews.test.tsx, tests/ux-mobile/financePeriodDrilldown.test.tsx, tests/unit/finance.test.ts, tests/unit/financeForecast.test.ts, tests/unit/forecastHorizon.test.ts, tests/unit/depense/onglets/, work/missions/2026-10-31-ecran-depense/voies/t1-onglets/

Scope: TA2, TA3, TA4, TA6 du diagnostic d2, dans le calcul ; la forme des vues ne change pas.

- [ ] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending

- [ ] G2: les tests des finances passent, les sondes du diagnostic comprises
  CHECK: npx vitest run tests/unit/finance.test.ts tests/unit/financeForecast.test.ts tests/unit/forecastHorizon.test.ts tests/unit/brewerBudgetLedger.test.ts tests/integration/financeJournalUx.test.tsx tests/unit/fribourgTax.test.ts tests/unit/financeArchiveContinuity.test.ts tests/unit/financeRefunds.test.ts tests/integration/dashboardNavigation.test.tsx tests/integration/equipmentProjects.test.tsx tests/integration/financeArchives.test.tsx tests/integration/financeWorkspace.test.tsx tests/integration/fix114.test.tsx tests/integration/mobileDailyViews.test.tsx tests/ux-mobile/financePeriodDrilldown.test.tsx tests/unit/depense/onglets --maxWorkers=2 && echo TESTS ONGLETS OK
  EXPECT: TESTS ONGLETS OK
  EVIDENCE: pending

- [ ] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/t1-onglets/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: pending

- [ ] G4: le résultat dit le témoin, les appelants et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/t1-onglets/RESULTAT.md --contient "TEMOIN AVANT,appelants,échéance à préciser,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: pending
