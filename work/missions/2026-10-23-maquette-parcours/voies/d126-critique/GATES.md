# Gates: voie d126-critique — un verdict pour chacune des 24 mini maquettes neuves

OWNS: work/refonte-frontend/v4/ecran-1/fils24-petits-choix/critique/**, work/missions/2026-10-23-maquette-parcours/voies/d126-critique/RESULTAT.md

Scope: chaque concept neuf jugé comme le brasseur, avec la règle de chaque rejet ; une tête proposée par question.

- [ ] G1: chaque concept a son verdict, au format exact
  CHECK: node -e "const fs=require('fs');const r=fs.readFileSync('work/refonte-frontend/v4/ecran-1/fils24-petits-choix/critique/VERDICTS.md','utf8');const ids=['pva','pvz','lsa','lsz','ana','anz'].flatMap(s=>[1,2,3,4].map(n=>s+n));const l=r.split(String.fromCharCode(10));const manque=ids.filter(i=>!l.some(x=>x.startsWith('- '+i+' : ACCEPTÉ')||x.startsWith('- '+i+' : REJET — ')));const tetes=['P','L','A'].filter(q=>!l.some(x=>x.startsWith(q+' : ')));console.log(manque.length||tetes.length?'VERDICTS ECHEC '+manque.join(',')+' '+tetes.join(','):['VERDICTS','COMPLETS',ids.length].join('-'));process.exit(manque.length||tetes.length?1:0)"
  EXPECT: VERDICTS-COMPLETS-24
  EVIDENCE: pending

- [ ] G2: le rapport rend la ligne de compte
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/d126-critique/RESULTAT.md --contient "ACCEPTÉ,VERDICTS.md"
  EXPECT: NOTE OK
  EVIDENCE: pending
