# Gates: voie ret-critique — les onze retouches jugées

OWNS: work/missions/2026-10-23-maquette-parcours/voies/ret-critique/RESULTAT.md

Scope: un verdict pour chacune des onze retouches de ses préférées, et une tête par groupe.

- [ ] G1: chaque retouche a son verdict, et chaque groupe sa tête
  CHECK: node -e "const r=require('fs').readFileSync('work/missions/2026-10-23-maquette-parcours/voies/ret-critique/RESULTAT.md','utf8').split(String.fromCharCode(10));const ids=['p4b2d','p4b2e','p4b2f','flb5b','flb5c','flb5d','u4e1','u4e2','u4e3','u4e4','u4e5'];const m=ids.filter(i=>!r.some(l=>l.startsWith('- '+i+' : ACCEPTÉ')||l.startsWith('- '+i+' : REJET — ')));const t=['p4b2','flb5','u4e'].filter(g=>!r.some(l=>l.startsWith(g+' : ')));console.log(m.length||t.length?'RETOUCHES ECHEC '+m.join(',')+' '+t.join(','):['RETOUCHES','JUGEES',ids.length].join('-'));process.exit(m.length||t.length?1:0)"
  EXPECT: RETOUCHES-JUGEES-11
  EVIDENCE: pending
