# Gates: voie p4 — Tests anciens cassés par le port

OWNS: work/missions/2026-11-14-brassins/voies/p4/, tests/integration/, tests/unit/, src/

Scope: les 13 fichiers repassent, les tests du port aussi.

- [ ] G1: les 13 fichiers et les tests du port passent
  CHECK: npx vitest run tests/integration/bStockVolumesNoms.test.tsx tests/integration/batchAm4Am5.test.tsx tests/integration/batchFollowUp.test.tsx tests/integration/batchPackagingVolume.test.tsx tests/integration/batchStockFollowUp.test.tsx tests/integration/brewCreationBudgetContinuity.test.tsx tests/integration/compactProduction.test.tsx tests/integration/dashboardNavigation.test.tsx tests/integration/liveDataViews.test.tsx tests/integration/productionCatalog.test.tsx tests/integration/productionVolumeBornes.test.tsx tests/integration/yeastPitchingExecution.test.tsx tests/unit/depense/loupe.test.tsx  tests/unit/port- --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending
