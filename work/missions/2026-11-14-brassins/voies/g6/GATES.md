# Gates: voie g6 — Greffes e6a × e6c

OWNS: work/missions/2026-11-14-brassins/voies/g6/

Scope: 3 greffes statiques à l'identité de l'app.

- [ ] G1: 3 greffes, chacune avec repos, geste, vide, cave et NOTE.md
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/g6';const v=fs.readdirSync(d).filter(x=>/^g6[a-c]$/.test(x));const ok=v.length===3&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);const n=fs.readFileSync(d+'/'+x+'/NOTE.md','utf8');return ['repos-390-clair','geste-390-clair','vide-390-clair','repos-390-cave'].every(k=>f.some(y=>y.includes(k)))&&/Idée/.test(n)})&&v.some(x=>fs.readdirSync(d+'/'+x).some(y=>y.includes('1280')));console.log(ok?'GREFFES OK':'GREFFES KO '+v.join(','))"
  EXPECT: GREFFES OK
  EVIDENCE: pending

- [ ] G2: chaque greffe passe le contrôle d'identité
  CHECK: node work/missions/2026-11-14-brassins/outils/controle-identite.mjs work/missions/2026-11-14-brassins/voies/g6
  EXPECT: IDENTITE OK
  EVIDENCE: pending
