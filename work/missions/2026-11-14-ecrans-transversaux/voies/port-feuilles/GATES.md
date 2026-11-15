# Gates: voie port-feuilles — port 1:1 de d3p2

OWNS: work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/

Scope: Journal des modifications, Connexions cloud et IA, Saisir au nom de, Mes conversations, Encaisser une vente selon d3p2, porté dans le worktree, typé, testé, construit, capturé côte à côte avec d3p2.

- [ ] G1: les tests de ses règles passent
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/tests.txt','utf8');console.log(/failed/i.test(t)||!/passed/i.test(t)?'TESTS ECHEC':'TESTS OK')"
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: les captures côte à côte existent
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-ecrans-transversaux/voies/port-feuilles/captures';const n=fs.existsSync(d)?fs.readdirSync(d).filter(f=>/^cote-a-cote-.*\.png$/.test(f)).length:0;console.log(n>0?'CAPTURES OK':'CAPTURES ECHEC')"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
