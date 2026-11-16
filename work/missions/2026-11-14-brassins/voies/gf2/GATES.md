# Gates: voie gf2 — La fiche en fermentation : trois genres nets, corrigés

OWNS: work/missions/2026-11-14-brassins/voies/gf/gfa/, work/missions/2026-11-14-brassins/voies/gf/gfc/, work/missions/2026-11-14-brassins/voies/gf/gfd/, work/missions/2026-11-14-brassins/voies/gf2/

Scope: points de la revue du 15.11 corrigés, images régénérées, notes complètes.

- [ ] G1: chaque point coché
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/gf2/RESULTAT.md','utf8');const n=(t.match(/- \[x\] [a-z0-9]+ n°/gi)||[]).length;console.log(n>=9?'COCHE OK '+n:'COCHE KO '+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending

- [ ] G2: images plus récentes que la revue
  CHECK: node -e "const fs=require('fs');const t=fs.statSync('work/missions/2026-11-14-brassins/revue-page5/critique.md').mtimeMs;const old=['gfa','gfc','gfd'].flatMap(x=>{const d='work/missions/2026-11-14-brassins/voies/gf/'+x;return fs.readdirSync(d).filter(f=>f.endsWith('.png')&&fs.statSync(d+'/'+f).mtimeMs<t).map(f=>x+'/'+f)});console.log(old.length?'IMAGES KO '+old.join(' '):'IMAGES OK')"
  EXPECT: IMAGES OK
  EVIDENCE: pending

- [ ] G3: identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/gf/gfa/etat.html work/missions/2026-11-14-brassins/voies/gf/gfc/etat.html work/missions/2026-11-14-brassins/voies/gf/gfd/etat.html
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G4: chaque NOTE.md porte Chaleur, Idée, Ce qui change, Geste
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/gf';const v=fs.readdirSync(d).filter(x=>/^(gfa|gfc|gfd)$/.test(x));const ko=v.filter(x=>{const n=fs.readFileSync(d+'/'+x+'/NOTE.md','utf8');return !['Chaleur','Idée','Ce qui change','Geste'].every(k=>n.includes(k+' :'))});console.log(v.length&&!ko.length?'NOTE OK '+v.length:'NOTE KO '+ko.join(','))"
  EXPECT: NOTE OK
  EVIDENCE: pending
