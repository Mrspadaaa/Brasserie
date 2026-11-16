# Gates: voie c2 — Créer un brassin, série v0 n° 2 (genre neuf)

OWNS: work/missions/2026-11-14-brassins/voies/c2/

Scope: 4 maquettes statiques à l'identité de l'app, chaque état capturé, notes complètes.

- [ ] G1: 4 maquettes, chacune avec tous ses états et NOTE.md, une 1280
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/c2';const v=fs.readdirSync(d).filter(x=>/^c2[a-d]$/.test(x));const ok=v.length===4&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);return ['repos-390-clair','geste-390-clair','apres-390-clair','vide-390-clair','repos-390-cave'].every(k=>f.includes(x+'-'+k+'.png'))&&fs.existsSync(d+'/'+x+'/NOTE.md')})&&v.some(x=>fs.readdirSync(d+'/'+x).some(y=>y.includes('1280')));console.log(ok?'SERIE OK':'SERIE KO '+v.join(','))"
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: chaque maquette passe le contrôle d'identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/c2
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G3: chaque NOTE.md porte Chaleur, Idée, Ce qui change, Geste
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/c2';const v=fs.readdirSync(d).filter(x=>/^c2[a-d]$/.test(x));const ko=v.filter(x=>{const n=fs.readFileSync(d+'/'+x+'/NOTE.md','utf8');return !['Chaleur','Idée','Ce qui change','Geste'].every(k=>n.includes(k+' :'))});console.log(v.length&&!ko.length?'NOTE OK '+v.length:'NOTE KO '+ko.join(','))"
  EXPECT: NOTE OK
  EVIDENCE: pending
