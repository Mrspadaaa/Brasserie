# Gates: voie c2f — Bloquants de c2

OWNS: work/missions/2026-11-14-brassins/voies/p2a/s1e2/, work/missions/2026-11-14-brassins/voies/p2a/s1g/, work/missions/2026-11-14-brassins/voies/p2c/s3b2/, work/missions/2026-11-14-brassins/voies/c2f/

Scope: aucun chiffre inventé ni chevauchement bloquant.

- [ ] G1: plus de brassins inventés dans les pages
  CHECK: node -e "const fs=require('fs');const p=['p2a/s1e2','p2a/s1g','p2c/s3b2'].map(x=>'work/missions/2026-11-14-brassins/voies/'+x+'/etat.html');const bad=p.filter(f=>/Blanche|Brune|LOT-011|LOT-010/.test(fs.readFileSync(f,'utf8')));console.log(bad.length?'INVENTE KO '+bad.join(' '):'INVENTE OK')"
  EXPECT: INVENTE OK
  EVIDENCE: pending

- [ ] G2: chaque bloquant de c2 est coché dans le résultat
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/c2f/RESULTAT.md','utf8');const n=(t.match(/\[x\]/gi)||[]).length;console.log(n>=6?'COCHE OK '+n:'COCHE KO '+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending
