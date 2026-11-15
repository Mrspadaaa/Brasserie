# Gates: voie rx — Recettes, retenues corrigées

OWNS: work/missions/2026-11-14-brassins/voies/r1/r1a/, work/missions/2026-11-14-brassins/voies/r2/r2a/, work/missions/2026-11-14-brassins/voies/r1/r1c/, work/missions/2026-11-14-brassins/voies/r1/r1d/, work/missions/2026-11-14-brassins/voies/rx/

Scope: quatre retenues corrigées, images régénérées, identité.

- [ ] G1: images plus récentes que les revues
  CHECK: node -e "const fs=require('fs');const t=Math.max(...['artiste','brasseur','uxui','critique'].map(r=>fs.statSync('work/missions/2026-11-14-brassins/revue-v0/recettes-'+r+'.md').mtimeMs));const old=['r1a','r2a','r1c','r1d'].flatMap(k=>{const d='work/missions/2026-11-14-brassins/voies/'+k.slice(0,2)+'/'+k;return fs.readdirSync(d).filter(f=>f.endsWith('.png')&&fs.statSync(d+'/'+f).mtimeMs<t).map(f=>k+'/'+f)});console.log(old.length?'IMAGES KO '+old.join(' '):'IMAGES OK')"
  EXPECT: IMAGES OK
  EVIDENCE: pending

- [ ] G2: identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/r1/r1a/etat.html work/missions/2026-11-14-brassins/voies/r2/r2a/etat.html work/missions/2026-11-14-brassins/voies/r1/r1c/etat.html work/missions/2026-11-14-brassins/voies/r1/r1d/etat.html
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G3: corrections cochées
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/rx/RESULTAT.md','utf8');const n=['r1a','r2a','r1c','r1d'].filter(k=>t.includes('- [x] '+k+' ')).length;console.log(n===4?'COCHE OK':'COCHE KO '+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending
