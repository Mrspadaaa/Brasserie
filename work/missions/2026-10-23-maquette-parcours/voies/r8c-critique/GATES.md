# Gates: voie r8c-critique — comparer, acquis, état par état

OWNS: work/missions/2026-10-23-maquette-parcours/voies/r8c-critique/RESULTAT.md

Scope: un verdict par état (RECONNU ou ÉCART) sur ses trois images, et un verdict par écran, comme le brasseur.

- [ ] G1: chaque état de sa part a son verdict, au format exact
  CHECK: node -e "const fs=require('fs');const r=fs.readFileSync('work/missions/2026-10-23-maquette-parcours/voies/r8c-critique/RESULTAT.md','utf8');const ids=['comparer','acquis'].flatMap(f=>JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/etats/'+f+'.json','utf8')).etats.map(e=>e.id));const manque=ids.filter(i=>!r.split(String.fromCharCode(10)).some(l=>l.startsWith('- '+i+' : RECONNU')||l.startsWith('- '+i+' : ÉCART')||l.startsWith('- '+i+' : EN ATTENTE')));console.log(manque.length?'AVIS ECHEC '+manque.length+' sans verdict : '+manque.slice(0,6).join(', '):['AVIS','COMPLET',ids.length].join('-'));process.exit(manque.length?1:0)"
  EXPECT: AVIS-COMPLET-45
  EVIDENCE: pending

- [ ] G2: une section et un verdict par écran, sur les captures du jour
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r8c-critique/RESULTAT.md --contient "## comparer,## acquis,-construite.png"
  EXPECT: NOTE OK
  EVIDENCE: pending
