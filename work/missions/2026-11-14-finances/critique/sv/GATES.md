# Gates: voie sv — critique des sous-vues

OWNS: work/missions/2026-11-14-finances/critique/sv

Scope: chaque mini maquette jugée, une ligne par id.

- [ ] G1: chaque id a sa ligne dans la synthèse
  CHECK: node -e "const fs=require('fs');const s=fs.existsSync('work/missions/2026-11-14-finances/critique/sv/SYNTHESE.md')?fs.readFileSync('work/missions/2026-11-14-finances/critique/sv/SYNTHESE.md','utf8'):'';const m='m1ap-a,m1ap-b,m1ap-c,m1ap-d,m1ar-a,m1ar-b,m1ar-c,m1ar-d,m1do-a,m1do-b,m1do-c,m1do-d,m1fi-a,m1fi-b,m1fi-c,m1fi-d,m2fo-a,m2fo-b,m2fo-c,m2fo-d,m2mo-a,m2mo-b,m2mo-c,m2mo-d,m2pa-a,m2pa-b,m2pa-c,m2pa-d,m3im-a,m3im-b,m3im-c,m3im-d,m3pm-a,m3pm-b,m3pm-c,m3pm-d,m3pr-a,m3pr-b,m3pr-c,m3pr-d,m4bb-a,m4bb-b,m4bb-c,m4bb-d,m4ia-a,m4ia-b,m4ia-c,m4ia-d,m4pf-a,m4pf-b,m4pf-c,m4pf-d'.split(',').filter(i=>!s.includes('| '+i+' |'));console.log(m.length?'SYNTHESE ECHEC '+m.join(' '):'SYNTHESE OK')"
  EXPECT: SYNTHESE OK
  EVIDENCE: pending
