# Gates: voie r-mat — série r

OWNS: work/missions/2026-11-14-materiel/v0/r/, work/missions/2026-11-14-materiel/voies/r-mat/

Scope: quatre variantes, trois images chacune, une NOTE chacune.

- [ ] G1: douze images et quatre NOTE
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-materiel/v0/r';const ids='rq1 rq2 rq3 rq4'.split(' ');const m=[];for(const i of ids){for(const e of ['repos','geste','repos-cave'])if(!fs.existsSync(d+'/'+i+'/'+i+'-'+e+'-390.png'))m.push(i+'-'+e);if(!fs.existsSync(d+'/'+i+'/NOTE.md'))m.push(i+'-NOTE')}console.log(m.length?'SERIE ECHEC '+m:'SERIE OK')"
  EXPECT: SERIE OK
  EVIDENCE: pending
