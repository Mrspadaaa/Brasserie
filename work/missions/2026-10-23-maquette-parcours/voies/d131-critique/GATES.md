# Gates: voie d131-critique — les jeux de pictos jugés

OWNS: work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/critique/**, work/missions/2026-10-23-maquette-parcours/voies/d131-critique/RESULTAT.md

Scope: un verdict par jeu de pictos, une tête proposée.

- [ ] G1: chaque jeu a son verdict, et la tête est proposée
  CHECK: node -e "const r=require('fs').readFileSync('work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/critique/VERDICTS.md','utf8').split(String.fromCharCode(10));const ids=['pha1','pha2','pha3','pha4','phz1','phz2','phz3','phz4'];const m=ids.filter(i=>!r.some(l=>l.startsWith('- '+i+' : ACCEPTÉ')||l.startsWith('- '+i+' : REJET — ')));const t=r.some(l=>l.startsWith('Tête : '));console.log(m.length||!t?'PICTOS ECHEC '+m.join(',')+(t?'':' sans tête'):['PICTOS','JUGES',ids.length].join('-'));process.exit(m.length||!t?1:0)"
  EXPECT: PICTOS-JUGES-8
  EVIDENCE: pending
