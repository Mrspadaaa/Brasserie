# Gates: e4-aveugle-v2

OWNS: work/refonte-frontend/v4/etalonnage/reponses-v2.json

Scope: un critique neuf, avec le portrait version 2, passe la moitié B (items pairs) ; la note est calculée par le pilote.

- [ ] G1: une réponse valide pour chaque item pair
  CHECK: node -e "const fs=require('fs');const cle=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/cle.json','utf8')).items.filter(i=>i.moitie==='B');const r=new Map(JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/reponses-v2.json','utf8')).reponses.map(x=>[x.eid,x]));const bad=cle.filter(i=>{const x=r.get(i.eid);return !x||!(i.type==='paire'?['A','B']:['aime','mitige','rejette']).includes(x.reponse)||!x.phrase});console.log(bad.length?'REPONSES ECHEC '+bad.map(i=>i.eid).join(' '):'REPONSES COMPLETES '+cle.length);process.exit(bad.length?1:0)"
  EXPECT: REPONSES COMPLETES
  EVIDENCE: pending
