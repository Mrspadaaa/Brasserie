# Gates: voie cx — Créer un brassin, retenues corrigées

OWNS: work/missions/2026-11-14-brassins/voies/c2/c2a/, work/missions/2026-11-14-brassins/voies/c1/c1d/, work/missions/2026-11-14-brassins/voies/c1/c1c/, work/missions/2026-11-14-brassins/voies/c2/c2c/, work/missions/2026-11-14-brassins/voies/cx/

Scope: quatre retenues corrigées, images régénérées, identité.

- [ ] G1: images plus récentes que les revues
  CHECK: node -e "const fs=require('fs');const t=Math.max(...['artiste','brasseur','uxui','critique'].map(r=>fs.statSync('work/missions/2026-11-14-brassins/revue-v0/creer-'+r+'.md').mtimeMs));const old=['c2a','c1d','c1c','c2c'].flatMap(k=>{const d='work/missions/2026-11-14-brassins/voies/'+k.slice(0,2)+'/'+k;return fs.readdirSync(d).filter(f=>f.endsWith('.png')&&fs.statSync(d+'/'+f).mtimeMs<t).map(f=>k+'/'+f)});console.log(old.length?'IMAGES KO '+old.join(' '):'IMAGES OK')"
  EXPECT: IMAGES OK
  EVIDENCE: pending

- [ ] G2: identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/c2/c2a/etat.html work/missions/2026-11-14-brassins/voies/c1/c1d/etat.html work/missions/2026-11-14-brassins/voies/c1/c1c/etat.html work/missions/2026-11-14-brassins/voies/c2/c2c/etat.html
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G3: corrections cochées
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/cx/RESULTAT.md','utf8');const n=['c2a','c1d','c1c','c2c'].filter(k=>t.includes('- [x] '+k+' ')).length;console.log(n===4?'COCHE OK':'COCHE KO '+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending
