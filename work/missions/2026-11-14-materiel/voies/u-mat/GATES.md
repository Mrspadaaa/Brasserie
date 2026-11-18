# Gates: voie u-mat — série u

OWNS: work/missions/2026-11-14-materiel/v0/u/, work/missions/2026-11-14-materiel/voies/u-mat/

Scope: quatre variantes, trois images chacune, une NOTE chacune.

- [ ] G1: douze images et quatre NOTE
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-materiel/v0/u';const ids='uq1 uq2 uq3 uq4'.split(' ');const m=[];for(const i of ids){for(const e of ['repos','geste','repos-cave'])if(!fs.existsSync(d+'/'+i+'/'+i+'-'+e+'-390.png'))m.push(i+'-'+e);if(!fs.existsSync(d+'/'+i+'/NOTE.md'))m.push(i+'-NOTE')}console.log(m.length?'SERIE ECHEC '+m:'SERIE OK')"
  EXPECT: SERIE OK
  EVIDENCE: pending
