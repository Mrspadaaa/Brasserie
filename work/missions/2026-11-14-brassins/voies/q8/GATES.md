# Gates: voie q8 — Tests anciens cassés par le port

OWNS: work/missions/2026-11-14-brassins/voies/q8/, tests/integration/, tests/unit/, src/

Scope: les 8 fichiers repassent, les tests du port aussi.

- [ ] G1: les 8 fichiers et les tests du port passent
  CHECK: npx vitest run tests/integration/batchAm4Am5.test.tsx tests/integration/batchFollowUp.test.tsx tests/integration/contactConversionUnique.test.tsx tests/integration/dashboardNavigation.test.tsx tests/integration/equipmentProjects.test.tsx tests/integration/liveDataViews.test.tsx tests/integration/productionCatalog.test.tsx tests/unit/bDiversContraste.test.ts tests/unit/port- --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending
