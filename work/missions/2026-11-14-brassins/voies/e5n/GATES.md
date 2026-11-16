# Gates: voie e5n — Créer un brassin, refait

OWNS: work/missions/2026-11-14-brassins/voies/e5n/

Scope: 4 maquettes neuves d'un autre genre, à l'identité de l'app.

- [ ] G1: 4 maquettes, chacune avec repos, geste, vide, cave et NOTE.md (chaleur, idée), une chaude, un 1280
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/e5n';const v=fs.readdirSync(d).filter(x=>/^e5n[a-d]$/.test(x));const ok=v.length===4&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);const n=fs.readFileSync(d+'/'+x+'/NOTE.md','utf8');return ['repos-390-clair','geste-390-clair','vide-390-clair','repos-390-cave'].every(k=>f.some(y=>y.includes(k)))&&/Idée/.test(n)&&/froide|tiède|chaude/.test(n)})&&v.some(x=>/chaude/.test(fs.readFileSync(d+'/'+x+'/NOTE.md','utf8')))&&v.some(x=>fs.readdirSync(d+'/'+x).some(y=>y.includes('1280')));console.log(ok?'SERIE OK':'SERIE KO '+v.join(','))"
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: chaque maquette passe le contrôle d'identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/e5n
  EXPECT: IDENTITE OK
  EVIDENCE: pending
