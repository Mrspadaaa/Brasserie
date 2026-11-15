# Gates: voie q10 — Tests anciens cassés par le port

OWNS: work/missions/2026-11-14-brassins/voies/q10/, tests/integration/, tests/unit/, src/

Scope: les 3 fichiers repassent, les tests du port aussi.

- [ ] G1: les 3 fichiers et les tests du port passent
  CHECK: npx vitest run tests/integration/batchAbvOgConfirmee.test.tsx tests/integration/batchDefautsB.test.tsx tests/integration/batchNombresFr.test.tsx tests/unit/port- --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending
