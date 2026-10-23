# Gates: e3-aveugle

OWNS: work/refonte-frontend/v4/etalonnage/reponses.json

Scope: l'épreuve à l'aveugle ; une réponse valide par item de la clé ; la note est calculée par le pilote.

- [ ] G1: une réponse valide pour chaque item
  CHECK: node -e "const fs=require('fs');const cle=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/cle.json','utf8')).items;const r=new Map(JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/reponses.json','utf8')).reponses.map(x=>[x.eid,x]));const bad=cle.filter(i=>{const x=r.get(i.eid);return !x||!(i.type==='paire'?['A','B']:['aime','mitige','rejette']).includes(x.reponse)||!x.phrase});console.log(bad.length?'REPONSES ECHEC '+bad.map(i=>i.eid).join(' '):'REPONSES COMPLETES '+cle.length);process.exit(bad.length?1:0)"
  EXPECT: REPONSES COMPLETES
  EVIDENCE: pending
