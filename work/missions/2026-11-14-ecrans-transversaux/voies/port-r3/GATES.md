# Gates: voie port-r3 — port 1:1

OWNS: work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/

Scope: la recherche r3p2 (le geste d'abord, au pouce), porté dans le worktree, typé, testé, construit, capturé côte à côte avec sa maquette.

- [ ] G1: les tests de ses règles passent
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/tests.txt','utf8');console.log(/failed/i.test(t)||!/passed/i.test(t)?'TESTS ECHEC':'TESTS OK')"
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: les captures côte à côte existent
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-ecrans-transversaux/voies/port-r3/captures';const n=fs.existsSync(d)?fs.readdirSync(d).filter(f=>/^cote-a-cote-.*\.png$/.test(f)).length:0;console.log(n>0?'CAPTURES OK':'CAPTURES ECHEC')"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
